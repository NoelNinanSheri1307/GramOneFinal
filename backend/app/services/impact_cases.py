"""ImpactCaseService — deterministic/manual creation of Impact Cases from
related Issues, plus the basic case lifecycle.

Automatic correlation is a later (Correlation Engine) milestone; this service
links Issues only when a Panchayat user explicitly chooses them.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errors import GramOneError
from app.models import ImpactCase, Issue, User, Village
from app.models.enums import ImpactCaseStatus, IssueCategory, UserRole
from app.schemas.common import DEFAULT_LIMIT, MAX_LIMIT, IssueBrief, UserBrief, VillageBrief
from app.schemas.impact_case import (
    ImpactCaseCreate,
    ImpactCaseListResponse,
    ImpactCaseResponse,
    ImpactCaseUpdate,
)
from app.services.access import panchayat_in_scope, resolve_assignee
from app.services.translations import TranslationService
from app.services.workflow import validate_impact_case_transition


def _now() -> datetime:
    return datetime.now(timezone.utc)


class ImpactCaseService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, actor: User, payload: ImpactCaseCreate) -> ImpactCaseResponse:
        if actor.role != UserRole.PANCHAYAT:
            raise GramOneError(
                code="unauthorized_impact_case_action",
                message="Only Panchayat users can create Impact Cases.",
                status_code=403,
            )
        if payload.village_id is not None and self.db.get(Village, payload.village_id) is None:
            raise GramOneError(
                code="invalid_impact_case",
                message=f"Village {payload.village_id} does not exist.",
                status_code=400,
            )

        issues = self._resolve_issues(payload.issue_ids)

        linked = [issue for issue in issues if issue.impact_case_id is not None]
        if linked:
            references = ", ".join(issue.reference or str(issue.id) for issue in linked)
            raise GramOneError(
                code="issue_already_linked",
                message=f"Issue(s) already linked to an Impact Case: {references}.",
                status_code=409,
            )

        categories = {issue.category for issue in issues}
        if categories != {payload.category}:
            raise GramOneError(
                code="invalid_impact_case",
                message="All linked Issues must share the same category as the Impact Case.",
                status_code=400,
            )

        village_id = self._resolve_village_id(issues, payload.village_id)

        for issue in issues:
            if not panchayat_in_scope(actor, issue.village_id):
                raise GramOneError(
                    code="unauthorized_impact_case_action",
                    message="An Issue is outside your jurisdiction.",
                    status_code=403,
                )

        case = ImpactCase(
            title=payload.title,
            summary=payload.summary,
            category=payload.category,
            village_id=village_id,
            status=ImpactCaseStatus.OPEN,
            affected_population=payload.affected_population,
            sdg=payload.sdg,
            original_language=payload.original_language,
        )
        self.db.add(case)
        self.db.flush()
        case.reference = f"CASE-{case.id:06d}"
        for issue in issues:
            issue.impact_case_id = case.id
        self.db.commit()
        self.db.refresh(case)
        return self._to_response(case)

    def get(self, case_id: int, actor: User) -> ImpactCaseResponse:
        case = self._case_or_404(case_id)
        self._ensure_readable(actor, case)
        return self._to_response(case)

    def list(
        self,
        actor: User,
        *,
        village_id: int | None,
        category: IssueCategory | None,
        status: ImpactCaseStatus | None,
        limit: int | None,
        offset: int | None,
    ) -> ImpactCaseListResponse:
        self._ensure_can_list(actor)

        stmt = select(ImpactCase)
        if actor.role == UserRole.PANCHAYAT and actor.village_id is not None:
            stmt = stmt.where(
                (ImpactCase.village_id == actor.village_id)
                | (ImpactCase.village_id.is_(None))
            )
        if village_id is not None:
            stmt = stmt.where(ImpactCase.village_id == village_id)
        if category is not None:
            stmt = stmt.where(ImpactCase.category == category)
        if status is not None:
            stmt = stmt.where(ImpactCase.status == status)

        total = self.db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        limit = DEFAULT_LIMIT if limit is None else min(limit, MAX_LIMIT)
        limit = max(limit, 1)
        offset = offset or 0
        rows = self.db.scalars(
            stmt.order_by(ImpactCase.created_at.desc()).offset(offset).limit(limit)
        ).all()
        maps = self._translation_maps(rows)
        return ImpactCaseListResponse(
            items=[self._to_response(case, maps=maps) for case in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    def update(self, case_id: int, actor: User, payload: ImpactCaseUpdate) -> ImpactCaseResponse:
        if actor.role != UserRole.PANCHAYAT:
            raise GramOneError(
                code="unauthorized_impact_case_action",
                message="Only Panchayat users can update Impact Cases.",
                status_code=403,
            )
        case = self._case_or_404(case_id)
        if not panchayat_in_scope(actor, case.village_id):
            raise GramOneError(
                code="unauthorized_impact_case_action",
                message="This Impact Case is outside your jurisdiction.",
                status_code=403,
            )
        data = payload.model_dump(exclude_unset=True)

        if "status" in data and data["status"] != case.status:
            validate_impact_case_transition(case.status, data["status"])
            case.status = data["status"]
            if case.status == ImpactCaseStatus.RESOLVED:
                case.resolved_at = _now()

        if "title" in data:
            if data["title"] != case.title:
                TranslationService(self.db).clear_field("impact_case", case.id, "title")
            case.title = data["title"]
        if "summary" in data:
            if data["summary"] != case.summary:
                TranslationService(self.db).clear_field("impact_case", case.id, "summary")
            case.summary = data["summary"]
        if "affected_population" in data:
            case.affected_population = data["affected_population"]
        if "sdg" in data:
            case.sdg = data["sdg"]
        if "assigned_to" in data:
            assignee = resolve_assignee(self.db, data["assigned_to"], "invalid_impact_case")
            case.assigned_to = assignee.id

        self.db.commit()
        self.db.refresh(case)
        return self._to_response(case)

    def _resolve_issues(self, issue_ids: list[int]) -> list[Issue]:
        unique_ids = list(dict.fromkeys(issue_ids))
        rows = self.db.scalars(select(Issue).where(Issue.id.in_(unique_ids))).all()
        found = {issue.id: issue for issue in rows}
        missing = [issue_id for issue_id in unique_ids if issue_id not in found]
        if missing:
            raise GramOneError(
                code="issue_not_found",
                message=f"Issue(s) not found: {missing}.",
                status_code=404,
            )
        return [found[issue_id] for issue_id in unique_ids]

    @staticmethod
    def _resolve_village_id(
        issues: list[Issue], requested: int | None
    ) -> int | None:
        distinct = {issue.village_id for issue in issues if issue.village_id is not None}
        if requested is not None:
            if distinct and distinct != {requested}:
                raise GramOneError(
                    code="invalid_impact_case",
                    message=f"Issues reference a different Village than {requested}.",
                    status_code=400,
                )
            return requested
        if len(distinct) > 1:
            raise GramOneError(
                code="invalid_impact_case",
                message="Linked Issues reference different Villages.",
                status_code=400,
            )
        return next(iter(distinct)) if distinct else None

    def _case_or_404(self, case_id: int) -> ImpactCase:
        case = self.db.get(ImpactCase, case_id)
        if case is None:
            raise GramOneError(
                code="impact_case_not_found", message="Impact Case not found.", status_code=404
            )
        return case

    def _ensure_readable(self, actor: User, case: ImpactCase) -> None:
        if actor.role == UserRole.CITIZEN:
            raise GramOneError(
                code="unauthorized_impact_case_action",
                message="Citizens cannot view Impact Cases.",
                status_code=403,
            )
        if actor.role == UserRole.PANCHAYAT and not panchayat_in_scope(actor, case.village_id):
            raise GramOneError(
                code="unauthorized_impact_case_action",
                message="This Impact Case is outside your jurisdiction.",
                status_code=403,
            )

    def _ensure_can_list(self, actor: User) -> None:
        if actor.role == UserRole.CITIZEN:
            raise GramOneError(
                code="unauthorized_impact_case_action",
                message="Citizens cannot view Impact Cases.",
                status_code=403,
            )

    def _to_response(
        self, case: ImpactCase, *, maps: dict[str, dict[int, dict[str, str]]] | None = None
    ) -> ImpactCaseResponse:
        service = TranslationService(self.db)
        if maps is None:
            maps = self._translation_maps([case])

        def localized(
            map_key: str, entity_type: str, field: str, entity_id: int, text: str | None
        ) -> str | dict | None:
            per_type = (maps or {}).get(map_key, {})
            return service.build_localized(
                entity_type,
                entity_id,
                field,
                text,
                case.original_language,
                per_type.get(entity_id, {}),
            )

        village = None
        if case.village is not None:
            village = VillageBrief(
                id=case.village.id,
                name=localized("village", "village", "name", case.village.id, case.village.name),
                district=case.village.district,
                state=case.village.state,
            )

        return ImpactCaseResponse(
            id=case.id,
            reference=case.reference,
            title=localized("case_title", "impact_case", "title", case.id, case.title),
            summary=localized("case_summary", "impact_case", "summary", case.id, case.summary),
            category=case.category,
            village=village,
            status=case.status,
            affected_population=case.affected_population,
            sdg=case.sdg,
            assigned_to=self._user_brief(case.assignee),
            created_at=case.created_at,
            updated_at=case.updated_at,
            resolved_at=case.resolved_at,
            issues=[
                IssueBrief(
                    id=issue.id,
                    reference=issue.reference,
                    title=localized(
                        "issue_title", "issue", "title", issue.id, issue.title
                    ),
                    category=issue.category.value,
                    status=issue.status.value,
                )
                for issue in case.issues
            ],
            original_language=case.original_language,
        )

    def _translation_maps(self, cases: list[ImpactCase]) -> dict[str, dict[int, dict[str, str]]]:
        """Batch-load cached translations for a set of impact cases."""
        service = TranslationService(self.db)
        case_ids = [case.id for case in cases]
        issue_ids = [issue.id for case in cases for issue in case.issues]
        village_ids = [case.village.id for case in cases if case.village is not None]
        return {
            "case_title": service.load_translation_map("impact_case", case_ids, "title"),
            "case_summary": service.load_translation_map("impact_case", case_ids, "summary"),
            "issue_title": service.load_translation_map("issue", issue_ids, "title"),
            "village": service.load_translation_map("village", village_ids, "name"),
        }

    @staticmethod
    def _user_brief(user: User | None) -> UserBrief | None:
        if user is None:
            return None
        return UserBrief(id=user.id, name=user.name)