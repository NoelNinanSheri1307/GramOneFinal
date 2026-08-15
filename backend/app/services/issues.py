"""IssueService — create, read, list and update Issues with authorization and
workflow transition handling."""
from datetime import datetime, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.errors import GramOneError
from app.models import Issue, IssueEvidence, IssueHistory, User, Village
from app.models.enums import IssueCategory, IssueSource, IssueStatus, UserRole
from app.schemas.common import DEFAULT_LIMIT, MAX_LIMIT, ImpactCaseBrief, UserBrief, VillageBrief
from app.schemas.issue import (
    IssueCreate,
    IssueHistoryResponse,
    IssueListResponse,
    IssueResponse,
    IssueUpdate,
)
from app.services.access import panchayat_in_scope, resolve_assignee
from app.services.translations import TranslationService
from app.services.workflow import validate_issue_transition


def _now() -> datetime:
    return datetime.now(timezone.utc)


class IssueService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_issue(self, actor: User, payload: IssueCreate) -> IssueResponse:
        if actor.role == UserRole.CSR:
            raise GramOneError(
                code="insufficient_permissions",
                message="CSR users cannot create issues.",
                status_code=403,
            )
        if payload.village_id is not None and self.db.get(Village, payload.village_id) is None:
            raise GramOneError(
                code="invalid_issue_data",
                message=f"Village {payload.village_id} does not exist.",
                status_code=400,
            )

        source = (
            IssueSource.PANCHAYAT if actor.role == UserRole.PANCHAYAT else IssueSource.CITIZEN
        )
        issue = Issue(
            title=payload.title,
            description=payload.description,
            category=payload.category,
            subcategory=payload.subcategory,
            village_id=payload.village_id,
            latitude=payload.latitude,
            longitude=payload.longitude,
            source=source,
            status=IssueStatus.REPORTED,
            reported_by=actor.id,
            original_language=payload.original_language,
        )
        self.db.add(issue)
        self.db.flush()
        issue.reference = f"ISSUE-{issue.id:06d}"
        self.db.add(
            IssueHistory(
                issue_id=issue.id,
                previous_status=None,
                new_status=IssueStatus.REPORTED,
                changed_by=actor.id,
                note="Issue reported.",
            )
        )
        self.db.commit()
        self.db.refresh(issue)
        try:
            from app.services.notification import NotificationService
            NotificationService.notify_new_issue(self.db, issue)
        except Exception as e:
            # Prevent failure to notify from blocking issue creation
            import logging
            logging.getLogger(__name__).error(f"Failed to send notification: {e}")
        return self._to_response(issue)

    def get_issue(self, issue_id: int, actor: User) -> IssueResponse:
        issue = self._get_or_404(issue_id)
        self._ensure_readable(actor, issue)
        return self._to_response(issue)

    def list_issues(
        self,
        actor: User,
        *,
        village_id: int | None,
        category: IssueCategory | None,
        status: IssueStatus | None,
        source: IssueSource | None,
        limit: int | None,
        offset: int | None,
    ) -> IssueListResponse:
        stmt = select(Issue)
        if actor.role == UserRole.CITIZEN:
            stmt = stmt.where(Issue.reported_by == actor.id)
        elif actor.role == UserRole.PANCHAYAT_EMPLOYEE:
            stmt = stmt.where(
                or_(
                    Issue.assigned_to == actor.id,
                    Issue.village_id == actor.village_id,
                )
            )
        elif actor.role == UserRole.PANCHAYAT and actor.village_id is not None:
            stmt = stmt.where(
                or_(
                    Issue.village_id == actor.village_id,
                    Issue.village_id.is_(None),
                    Issue.reported_by == actor.id,
                )
            )

        if village_id is not None:
            stmt = stmt.where(Issue.village_id == village_id)
        if category is not None:
            stmt = stmt.where(Issue.category == category)
        if status is not None:
            stmt = stmt.where(Issue.status == status)
        if source is not None:
            stmt = stmt.where(Issue.source == source)

        total = self.db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        limit = DEFAULT_LIMIT if limit is None else min(limit, MAX_LIMIT)
        limit = max(limit, 1)
        offset = offset or 0
        rows = self.db.scalars(
            stmt.order_by(Issue.created_at.desc()).offset(offset).limit(limit)
        ).all()
        maps = self._translation_maps(rows)
        return IssueListResponse(
            items=[self._to_response(issue, maps=maps) for issue in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    def update_issue(self, issue_id: int, actor: User, payload: IssueUpdate) -> IssueResponse:
        issue = self._get_or_404(issue_id)
        self._ensure_writable(actor, issue)
        data = payload.model_dump(exclude_unset=True)

        prev_status = issue.status
        prev_assigned_to = issue.assigned_to

        if actor.role == UserRole.CITIZEN:
            workflow_fields = {"status", "assigned_to"}
            if any(key in data for key in workflow_fields):
                raise GramOneError(
                    code="unauthorized_issue_access",
                    message="Citizens cannot change workflow fields.",
                    status_code=403,
                )

        if actor.role == UserRole.PANCHAYAT_EMPLOYEE:
            if "assigned_to" in data:
                raise GramOneError(
                    code="unauthorized_issue_access",
                    message="Field employees cannot reassign issues.",
                    status_code=403,
                )
            allowed_emp_statuses = {IssueStatus.IN_PROGRESS, IssueStatus.FIELD_COMPLETED}
            if "status" in data and data["status"] not in allowed_emp_statuses:
                raise GramOneError(
                    code="unauthorized_issue_access",
                    message="Employees can only set status to 'in_progress' or 'field_completed'.",
                    status_code=403,
                )

        if "status" in data and data["status"] != issue.status:
            validate_issue_transition(issue.status, data["status"])
            previous = issue.status
            issue.status = data["status"]
            if issue.status == IssueStatus.RESOLVED:
                issue.resolved_at = _now()
            self.db.add(
                IssueHistory(
                    issue_id=issue.id,
                    previous_status=previous,
                    new_status=issue.status,
                    changed_by=actor.id,
                    note=data.get("note") or f"Issue moved to '{issue.status.value}'.",
                )
            )

        self._apply_content_fields(issue, data, actor)
        self.db.commit()
        self.db.refresh(issue)

        try:
            from app.services.notification import NotificationService
            if issue.assigned_to != prev_assigned_to:
                NotificationService.notify_issue_assigned(self.db, issue)
            elif issue.status != prev_status:
                NotificationService.notify_issue_status_changed(self.db, issue, prev_status, issue.status, actor)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to send update notification: {e}")

        return self._to_response(issue)

    def list_history(self, issue_id: int, actor: User) -> list[IssueHistoryResponse]:
        issue = self._get_or_404(issue_id)
        self._ensure_readable(actor, issue)
        rows = self.db.scalars(
            select(IssueHistory)
            .where(IssueHistory.issue_id == issue.id)
            .order_by(IssueHistory.created_at)
        ).all()
        return [IssueHistoryResponse.model_validate(row) for row in rows]

    def _get_or_404(self, issue_id: int) -> Issue:
        issue = self.db.get(Issue, issue_id)
        if issue is None:
            raise GramOneError(code="issue_not_found", message="Issue not found.", status_code=404)
        return issue

    @staticmethod
    def _ensure_readable(actor: User, issue: Issue) -> None:
        if actor.role == UserRole.CITIZEN and issue.reported_by != actor.id:
            raise GramOneError(
                code="unauthorized_issue_access",
                message="You cannot view this issue.",
                status_code=403,
            )
        if actor.role == UserRole.PANCHAYAT_EMPLOYEE and not (
            issue.assigned_to == actor.id or panchayat_in_scope(actor, issue.village_id)
        ):
            raise GramOneError(
                code="unauthorized_issue_access",
                message="This issue is outside your assigned work scope.",
                status_code=403,
            )
        if actor.role == UserRole.PANCHAYAT and not (
            panchayat_in_scope(actor, issue.village_id) or issue.reported_by == actor.id
        ):
            raise GramOneError(
                code="unauthorized_issue_access",
                message="This issue is outside your jurisdiction.",
                status_code=403,
            )

    @staticmethod
    def _ensure_writable(actor: User, issue: Issue) -> None:
        if actor.role == UserRole.CSR:
            raise GramOneError(
                code="unauthorized_issue_access",
                message="CSR users cannot modify issues.",
                status_code=403,
            )
        if actor.role == UserRole.CITIZEN and issue.reported_by != actor.id:
            raise GramOneError(
                code="unauthorized_issue_access",
                message="You cannot modify this issue.",
                status_code=403,
            )
        if actor.role == UserRole.PANCHAYAT_EMPLOYEE and not (
            issue.assigned_to == actor.id or panchayat_in_scope(actor, issue.village_id)
        ):
            raise GramOneError(
                code="unauthorized_issue_access",
                message="This issue is not in your assigned work scope.",
                status_code=403,
            )
        if actor.role == UserRole.PANCHAYAT and not (
            panchayat_in_scope(actor, issue.village_id) or issue.reported_by == actor.id
        ):
            raise GramOneError(
                code="unauthorized_issue_access",
                message="This issue is outside your jurisdiction.",
                status_code=403,
            )

    def _apply_content_fields(self, issue: Issue, data: dict, actor: User) -> None:
        translations = TranslationService(self.db)
        if "title" in data:
            if data["title"] != issue.title:
                translations.clear_field("issue", issue.id, "title")
            issue.title = data["title"]
        if "description" in data:
            if data["description"] != issue.description:
                translations.clear_field("issue", issue.id, "description")
            issue.description = data["description"]
        if "category" in data:
            issue.category = data["category"]
        if "subcategory" in data:
            issue.subcategory = data["subcategory"]
        if "latitude" in data or "longitude" in data:
            if (data.get("latitude") is None) != (data.get("longitude") is None):
                raise GramOneError(
                    code="invalid_issue_data",
                    message="latitude and longitude must be set together.",
                    status_code=400,
                )
            issue.latitude = data.get("latitude")
            issue.longitude = data.get("longitude")
        if "assigned_to" in data:
            if actor.role != UserRole.PANCHAYAT:
                raise GramOneError(
                    code="unauthorized_issue_access",
                    message="Only Panchayat users can assign issues.",
                    status_code=403,
                )
            assignee = resolve_assignee(self.db, data["assigned_to"], "invalid_issue_data")
            issue.assigned_to = assignee.id
            if issue.status in (IssueStatus.REPORTED, IssueStatus.VERIFIED, IssueStatus.OPEN):
                issue.status = IssueStatus.ASSIGNED

    def _to_response(
        self, issue: Issue, *, maps: dict[str, dict[int, dict[str, str]]] | None = None
    ) -> IssueResponse:
        translations = TranslationService(self.db)
        if maps is None:
            maps = self._translation_maps([issue])

        evidence_count = (
            self.db.scalar(
                select(func.count())
                .select_from(IssueEvidence)
                .where(IssueEvidence.issue_id == issue.id)
            )
            or 0
        )
        case = issue.impact_case
        history = sorted(issue.history, key=lambda entry: entry.created_at)

        def localized(
            map_key: str, entity_type: str, field: str, entity_id: int, text: str | None
        ) -> str | dict | None:
            per_type = (maps or {}).get(map_key, {})
            return translations.build_localized(
                entity_type,
                entity_id,
                field,
                text,
                issue.original_language,
                per_type.get(entity_id, {}),
            )

        village = None
        if issue.village is not None:
            village = VillageBrief(
                id=issue.village.id,
                name=localized("village", "village", "name", issue.village.id, issue.village.name),
                district=issue.village.district,
                state=issue.village.state,
            )

        return IssueResponse(
            id=issue.id,
            reference=issue.reference,
            title=localized("issue", "issue", "title", issue.id, issue.title),
            description=localized(
                "issue_desc", "issue", "description", issue.id, issue.description
            ),
            category=issue.category,
            subcategory=issue.subcategory,
            source=issue.source,
            status=issue.status,
            latitude=issue.latitude,
            longitude=issue.longitude,
            created_at=issue.created_at,
            updated_at=issue.updated_at,
            resolved_at=issue.resolved_at,
            village=village,
            reporter=self._user_brief(issue.reporter),
            assigned_to=self._user_brief(issue.assignee),
            evidence_count=evidence_count,
            impact_case=(
                ImpactCaseBrief(
                    id=case.id,
                    reference=case.reference,
                    title=localized("impact_case", "impact_case", "title", case.id, case.title),
                )
                if case is not None
                else None
            ),
            history=[
                IssueHistoryResponse(
                    id=entry.id,
                    previous_status=entry.previous_status,
                    new_status=entry.new_status,
                    changed_by=entry.changed_by,
                    note=localized("history", "history", "note", entry.id, entry.note),
                    created_at=entry.created_at,
                )
                for entry in history
            ],
            original_language=issue.original_language,
        )

    def _translation_maps(self, issues: list[Issue]) -> dict[str, dict[int, dict[str, str]]]:
        """Batch-load cached translations for a set of issues (single queries)."""
        translations = TranslationService(self.db)
        issue_ids = [issue.id for issue in issues]
        history_ids = [entry.id for issue in issues for entry in issue.history]
        case_ids = [issue.impact_case.id for issue in issues if issue.impact_case is not None]
        village_ids = [issue.village.id for issue in issues if issue.village is not None]
        return {
            "issue": translations.load_translation_map("issue", issue_ids, "title"),
            "issue_desc": translations.load_translation_map("issue", issue_ids, "description"),
            "history": translations.load_translation_map("history", history_ids, "note"),
            "impact_case": translations.load_translation_map("impact_case", case_ids, "title"),
            "village": translations.load_translation_map("village", village_ids, "name"),
        }

    @staticmethod
    def _user_brief(user: User | None) -> UserBrief | None:
        if user is None:
            return None
        return UserBrief(id=user.id, name=user.name)