"""CSRService — the CSR workflow backend.

Provides the CSR organization profile, the opportunity view over Impact Cases
(with an explainable, deterministic impact score), CSR matching based purely on
declared CSR preferences vs. real case data (no LLM, no invented scores), and
the Sponsorship lifecycle. Sponsorship status remains under Panchayat control:
CSR may create a sponsorship, but only a Panchayat user can confirm or close it.
"""
from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.errors import GramOneError
from app.models import (
    CSRProfile,
    ImpactCase,
    Notification,
    Project,
    Sponsorship,
    User,
    Village,
)
from app.models.enums import (
    ImpactCaseStatus,
    NotificationType,
    ProjectStatus,
    SponsorshipStatus,
)
from app.schemas.common import DEFAULT_LIMIT, MAX_LIMIT, UserBrief, VillageBrief
from app.schemas.csr import (
    CSRProfileResponse,
    CSRProfileUpdate,
    ImpactScoreBreakdown,
    OpportunityItem,
    OpportunityListResponse,
    ProjectBrief,
    SponsorshipCreate,
    SponsorshipListResponse,
    SponsorshipResponse,
)
from app.services.impact import ImpactScoringEngine
from app.services.translations import TranslationService

_MATCH_VERSION = "v1.0.0"


def _get_profile(db: Session, user_id: int) -> CSRProfile | None:
    return db.scalar(select(CSRProfile).where(CSRProfile.user_id == user_id))


def _profile_or_404(db: Session, profile: CSRProfile | None) -> CSRProfile:
    if profile is None:
        raise GramOneError(
            code="csr_profile_not_found",
            message="No CSR profile found. Create one to access CSR tools.",
            status_code=404,
        )
    return profile


class CSRService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.engine = ImpactScoringEngine()

    # ------------------------------------------------------------------ profile
    def get_profile(self, user_id: int) -> CSRProfileResponse:
        profile = _get_profile(self.db, user_id)
        if profile is None:
            raise GramOneError(
                code="csr_profile_not_found",
                message="No CSR profile found. Create one to access CSR tools.",
                status_code=404,
            )
        return self._profile_response(profile)

    def update_profile(self, user: User, payload: CSRProfileUpdate) -> CSRProfileResponse:
        profile = _get_profile(self.db, user.id)
        if profile is None:
            profile = CSRProfile(
                user_id=user.id, org_name=user.name, contact_name=user.name,
                contact_email=user.email,
            )
            self.db.add(profile)
            self.db.flush()

        data = payload.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(profile, key, value)
        self.db.commit()
        self.db.refresh(profile)
        return self._profile_response(profile)

    # ----------------------------------------------------------- opportunities
    def list_opportunities(
        self,
        user_id: int,
        *,
        village_id: int | None,
        category: str | None,
        status: ImpactCaseStatus | None,
        state: str | None,
        district: str | None,
        q: str | None,
        sort: str | None,
        limit: int | None,
        offset: int | None,
    ) -> OpportunityListResponse:
        stmt = select(ImpactCase)
        if village_id is not None:
            stmt = stmt.where(ImpactCase.village_id == village_id)
        if category is not None:
            stmt = stmt.where(ImpactCase.category == category)
        if status is not None:
            stmt = stmt.where(ImpactCase.status == status)

        if state or district or q:
            if state or district:
                stmt = stmt.join(Village, ImpactCase.village_id == Village.id, isouter=True)
            if state is not None:
                stmt = stmt.where(Village.state == state)
            if district is not None:
                stmt = stmt.where(Village.district == district)
            if q:
                stmt = stmt.where(
                    or_(
                        ImpactCase.title.ilike(f"%{q}%"),
                        ImpactCase.reference.ilike(f"%{q}%"),
                    )
                )

        total = self.db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        limit = DEFAULT_LIMIT if limit is None else min(limit, MAX_LIMIT)
        limit = max(limit, 1)
        offset = offset or 0

        rows = self.db.scalars(
            stmt.order_by(ImpactCase.updated_at.desc()).offset(offset).limit(limit)
        ).all()

        profile = _get_profile(self.db, user_id)
        items = [self._opportunity_item(case, profile=profile) for case in rows]
        return OpportunityListResponse(items=items, total=total, limit=limit, offset=offset)

    def get_opportunity(self, case_id: int, user_id: int) -> OpportunityItem:
        case = self.db.get(ImpactCase, case_id)
        if case is None:
            raise GramOneError(
                code="opportunity_not_found",
                message="Impact Case not found.",
                status_code=404,
            )
        return self._opportunity_item(case, profile=_get_profile(self.db, user_id))

    def list_matches(self, user_id: int) -> dict:
        profile = _get_profile(self.db, user_id)
        profile = _profile_or_404(self.db, profile)
        cases = self.db.scalars(
            select(ImpactCase).where(ImpactCase.status == ImpactCaseStatus.OPEN)
        ).all()
        results: list[OpportunityItem] = []
        for case in cases:
            item = self._opportunity_item(case, profile=profile)
            results.append(item)
        results.sort(key=lambda item: (item.matched_score or 0), reverse=True)
        return {"items": results, "total": len(results), "version": _MATCH_VERSION}

    # ------------------------------------------------------------ sponsorship
    def create_sponsorship(self, user: User, payload: SponsorshipCreate) -> SponsorshipResponse:
        profile = _get_profile(self.db, user.id)
        profile = _profile_or_404(self.db, profile)

        project = self.db.get(Project, payload.project_id)
        if project is None:
            raise GramOneError(
                code="project_not_found",
                message="Project not found.",
                status_code=404,
            )

        existing = self.db.scalar(
            select(Sponsorship).where(
                Sponsorship.project_id == project.id,
                Sponsorship.csr_profile_id == profile.id,
                Sponsorship.status.in_(
                    [SponsorshipStatus.PENDING, SponsorshipStatus.ACTIVE,
                     SponsorshipStatus.CONFIRMED]
                ),
            )
        )
        if existing is not None:
            raise GramOneError(
                code="sponsorship_already_exists",
                message="You already have an active sponsorship for this project.",
                status_code=409,
            )

        sponsorship = Sponsorship(
            project_id=project.id,
            csr_profile_id=profile.id,
            amount=payload.amount,
            support_type=payload.support_type,
            status=SponsorshipStatus.PENDING,
        )
        self.db.add(sponsorship)
        self.db.flush()
        
        self.db.commit()
        self.db.refresh(sponsorship)

        try:
            from app.services.notification import NotificationService
            NotificationService.notify_sponsorship_submitted(self.db, sponsorship)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to send sponsorship notification: {e}")

        return self._sponsorship_response(sponsorship)

    def update_sponsorship_status(
        self, sponsorship_id: int, status: SponsorshipStatus
    ) -> SponsorshipResponse:
        """Panchayat-controlled sponsorship lifecycle transition."""
        sponsorship = self.db.get(Sponsorship, sponsorship_id)
        if sponsorship is None:
            raise GramOneError(
                code="sponsorship_not_found",
                message="Sponsorship not found.",
                status_code=404,
            )
        
        old_status = sponsorship.status

        allowed = {
            SponsorshipStatus.PENDING: {SponsorshipStatus.CONFIRMED, SponsorshipStatus.CANCELLED},
            SponsorshipStatus.CONFIRMED: {SponsorshipStatus.ACTIVE, SponsorshipStatus.CANCELLED},
            SponsorshipStatus.ACTIVE: {SponsorshipStatus.COMPLETED, SponsorshipStatus.CANCELLED},
            SponsorshipStatus.COMPLETED: set(),
            SponsorshipStatus.CANCELLED: set(),
        }
        if status not in allowed.get(sponsorship.status, set()):
            raise GramOneError(
                code="invalid_sponsorship_transition",
                message=(
                    f"Cannot move sponsorship from '{sponsorship.status.value}' "
                    f"to '{status.value}'."
                ),
                status_code=400,
            )
        sponsorship.status = status
        project = sponsorship.project
        if project is not None:
            if status == SponsorshipStatus.CONFIRMED:
                project.status = ProjectStatus.SPONSORED
                case = project.impact_case
                if case is not None and case.status == ImpactCaseStatus.OPEN:
                    from datetime import datetime, timezone

                    case.status = ImpactCaseStatus.SPONSORED
                    case.updated_at = datetime.now(timezone.utc)
            elif status == SponsorshipStatus.COMPLETED:
                project.status = ProjectStatus.COMPLETED
                from datetime import datetime, timezone

                project.completed_at = datetime.now(timezone.utc)
            elif status == SponsorshipStatus.ACTIVE:
                project.status = ProjectStatus.IN_PROGRESS
        self.db.commit()
        self.db.refresh(sponsorship)

        try:
            from app.services.notification import NotificationService
            NotificationService.notify_sponsorship_status_changed(self.db, sponsorship, old_status, status)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to send sponsorship status notification: {e}")

        return self._sponsorship_response(sponsorship)

    def list_sponsorships(
        self, user_id: int, limit: int | None, offset: int | None
    ) -> SponsorshipListResponse:
        profile = _get_profile(self.db, user_id)
        profile = _profile_or_404(self.db, profile)
        stmt = select(Sponsorship).where(Sponsorship.csr_profile_id == profile.id)
        total = self.db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        limit = DEFAULT_LIMIT if limit is None else min(limit, MAX_LIMIT)
        offset = offset or 0
        rows = self.db.scalars(
            stmt.order_by(Sponsorship.updated_at.desc()).offset(offset).limit(limit)
        ).all()
        return SponsorshipListResponse(
            items=[self._sponsorship_response(row) for row in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    # ---------------------------------------------------------------- projects
    def list_supported_projects(self, user_id: int) -> list[ProjectBrief]:
        profile = _get_profile(self.db, user_id)
        profile = _profile_or_404(self.db, profile)
        rows = self.db.scalars(
            select(Project)
            .join(Sponsorship, Sponsorship.project_id == Project.id)
            .where(
                Sponsorship.csr_profile_id == profile.id,
                Sponsorship.status.in_(
                    [SponsorshipStatus.PENDING, SponsorshipStatus.CONFIRMED,
                     SponsorshipStatus.ACTIVE, SponsorshipStatus.COMPLETED]
                ),
            )
            .order_by(Project.updated_at.desc())
        ).all()
        return [self._project_brief(row, profile_owner_id=profile.id) for row in rows]

    # ------------------------------------------------------------- notifications
    def list_notifications(self, user_id: int, limit: int | None = 20) -> list[dict]:
        limit = min(limit or 20, 50)
        rows = self.db.scalars(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        ).all()
        return [
            {
                "id": n.id,
                "type": n.type.value,
                "title": n.title,
                "message": n.message,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat(),
            }
            for n in rows
        ]

    def mark_notification_read(self, user_id: int, notification_id: int) -> None:
        row = self.db.get(Notification, notification_id)
        if row is None or row.user_id != user_id:
            raise GramOneError(
                code="notification_not_found",
                message="Notification not found.",
                status_code=404,
            )
        row.is_read = True
        self.db.commit()

    # ----------------------------------------------------------------- internal
    def _opportunity_item(
        self, case: ImpactCase, *, profile: CSRProfile | None = None
    ) -> OpportunityItem:
        service = TranslationService(self.db)
        title = service.build_localized(
            "impact_case", case.id, "title", case.title, case.original_language
        )
        summary = service.build_localized(
            "impact_case", case.id, "summary", case.summary, case.original_language
        )

        evidence_count = sum(len(issue.evidence) for issue in case.issues) if case.issues else 0
        impact_score = self.engine.calculate_score(
            category=case.category.value,
            urgency="medium",
            affected_population=case.affected_population,
            evidence_count=max(evidence_count, 1),
            created_at=case.created_at,
        )

        projects = [self._project_brief(p) for p in case.projects]

        item = OpportunityItem(
            id=case.id,
            reference=case.reference,
            title=title,
            summary=summary,
            category=case.category,
            village=self._localized_village(case.village, service),
            status=case.status,
            affected_population=case.affected_population,
            sdg=case.sdg,
            assigned_to=UserBrief(id=case.assignee.id, name=case.assignee.name) if case.assignee else None,
            created_at=case.created_at,
            updated_at=case.updated_at,
            resolved_at=case.resolved_at,
            evidence_count=evidence_count,
            impact_score=ImpactScoreBreakdown(
                overall_score=impact_score.overall_score,
                severity_component=impact_score.severity_component,
                population_component=impact_score.population_component,
                evidence_component=impact_score.evidence_component,
                time_component=impact_score.time_component,
                infrastructure_component=impact_score.infrastructure_component,
                rationale=impact_score.factors,
            ),
            projects=projects,
            sponsored=any(
                p.sponsorship_status
                in (SponsorshipStatus.PENDING, SponsorshipStatus.CONFIRMED,
                    SponsorshipStatus.ACTIVE)
                for p in projects
            ),
            original_language=case.original_language,
        )

        if profile is not None:
            item.matched_score, item.match_reasons = self._match_score(profile, case)
        return item

    def _localized_village(
        self, village: Village | None, service: TranslationService
    ) -> VillageBrief | None:
        if village is None:
            return None
        name = service.build_localized("village", village.id, "name", village.name, "en")
        return VillageBrief(
            id=village.id, name=name, district=village.district, state=village.state
        )

    def _match_score(self, profile: CSRProfile, case: ImpactCase) -> tuple[float, list[str]]:
        """Deterministic match (0-100) using only real, declared preference data."""
        reasons: list[str] = []
        score = 0.0

        focus = [f.lower() for f in (profile.focus_areas or [])]
        if not focus or case.category.value in focus:
            score += 25.0
            reasons.append("Domain matches your focus areas" if focus else "Covers all focus areas")

        if profile.preferred_sdgs:
            if case.sdg and case.sdg.upper() in [s.upper() for s in profile.preferred_sdgs]:
                score += 20.0
                reasons.append(f"Targets your preferred SDG {case.sdg}")

        domains = [d.lower() for d in (profile.preferred_domains or [])]
        if domains:
            cat_val = case.category.value.lower()
            matched_domain = False
            if cat_val in domains:
                matched_domain = True
            elif cat_val == "civic" and "rural/civic infrastructure" in domains:
                matched_domain = True
            elif case.sdg == "SDG 13" and ("environment" in domains or "climate/environmental resilience" in domains):
                matched_domain = True
            
            if matched_domain:
                score += 15.0
                reasons.append("Rural need aligns with your preferred contribution domains")

        if profile.preferred_state:
            village = case.village
            if village and village.state.lower() == profile.preferred_state.lower():
                score += 20.0
                reasons.append(f"Located in your preferred state ({village.state})")
            elif profile.preferred_districts and village:
                if village.district.lower() in [d.lower() for d in profile.preferred_districts]:
                    score += 20.0
                    reasons.append(f"Located in a preferred district ({village.district})")

        impact_score = self.engine.calculate_score(
            category=case.category.value, urgency="medium",
            affected_population=case.affected_population,
            evidence_count=max(sum(len(i.evidence) for i in case.issues), 1),
            created_at=case.created_at,
        )
        score += min(20.0, impact_score.overall_score / 5.0)
        reasons.append(f"Deterministic impact score {impact_score.overall_score:.0f}/100")

        if profile.min_budget is not None or profile.max_budget is not None:
            budgets = [p.estimated_budget for p in case.projects if p.estimated_budget is not None]
            if budgets:
                budget = max(budgets)
                within = True
                if profile.min_budget is not None and budget < profile.min_budget:
                    within = False
                if profile.max_budget is not None and budget > profile.max_budget:
                    within = False
                if within:
                    score += 15.0
                    reasons.append("Estimated budget within your range")
            else:
                score += 15.0
                reasons.append("Budget not yet estimated")

        return min(100.0, score), reasons

    def _profile_response(self, profile: CSRProfile) -> CSRProfileResponse:
        return CSRProfileResponse(
            id=profile.id,
            user_id=profile.user_id,
            org_name=profile.org_name,
            contact_name=profile.contact_name,
            contact_email=profile.contact_email,
            description=profile.description,
            focus_areas=profile.focus_areas or [],
            preferred_sdgs=profile.preferred_sdgs or [],
            preferred_support_types=profile.preferred_support_types or [],
            preferred_domains=profile.preferred_domains or [],
            preferred_state=profile.preferred_state,
            preferred_districts=profile.preferred_districts or [],
            min_budget=profile.min_budget,
            max_budget=profile.max_budget,
        )

    def _project_brief(self, project: Project, profile_owner_id: int | None = None) -> ProjectBrief:
        sponsorship = None
        if project.sponsorships:
            if profile_owner_id is not None:
                actives = [s for s in project.sponsorships if s.csr_profile_id == profile_owner_id]
                sponsorship = actives[0] if actives else None
            if sponsorship is None:
                sponsorship = project.sponsorships[0]
        return ProjectBrief(
            id=project.id,
            name=project.name,
            description=project.description,
            status=project.status,
            estimated_budget=project.estimated_budget,
            village=self._project_village(project.village),
            completed_at=project.completed_at,
            sponsorship_status=sponsorship.status if sponsorship else None,
        )

    def _project_village(self, village: Village | None) -> VillageBrief | None:
        if village is None:
            return None
        return VillageBrief(
            id=village.id, name=village.name, district=village.district, state=village.state
        )

    def _sponsorship_response(self, sponsorship: Sponsorship) -> SponsorshipResponse:
        project = sponsorship.project
        return SponsorshipResponse(
            id=sponsorship.id,
            project_id=sponsorship.project_id,
            amount=sponsorship.amount,
            support_type=sponsorship.support_type,
            status=sponsorship.status,
            created_at=sponsorship.created_at,
            updated_at=sponsorship.updated_at,
            project=self._project_brief(project) if project else None,
            impact_case_id=project.impact_case_id if project else None,
        )

    def _add_notification(
        self, *, user_id: int, ntype: NotificationType, title: str, message: str
    ) -> None:
        self.db.add(
            Notification(user_id=user_id, type=ntype, title=title, message=message)
        )