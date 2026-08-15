"""EvidenceService — attach and list IssueEvidence records."""
import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import GramOneError
from app.models import Issue, IssueEvidence, User
from app.models.enums import EvidenceType, UserRole
from app.schemas.issue import EvidenceCreate, EvidenceResponse
from app.services.access import panchayat_in_scope
from app.services.translations import TranslationService

logger = logging.getLogger(__name__)

_ALLOWED_EVIDENCE_TYPES: dict[UserRole, set[EvidenceType]] = {
    UserRole.CITIZEN: {
        EvidenceType.CITIZEN_REPORT,
        EvidenceType.UPLOADED_IMAGE,
        EvidenceType.RELATED_ISSUE,
    },
    UserRole.PANCHAYAT: {
        EvidenceType.CITIZEN_REPORT,
        EvidenceType.PANCHAYAT_VERIFICATION,
        EvidenceType.UPLOADED_IMAGE,
        EvidenceType.BEFORE_FIELD_IMAGE,
        EvidenceType.AFTER_FIELD_IMAGE,
        EvidenceType.FIELD_INSPECTION_NOTE,
        EvidenceType.RELATED_ISSUE,
    },
    UserRole.PANCHAYAT_EMPLOYEE: {
        EvidenceType.UPLOADED_IMAGE,
        EvidenceType.BEFORE_FIELD_IMAGE,
        EvidenceType.AFTER_FIELD_IMAGE,
        EvidenceType.FIELD_INSPECTION_NOTE,
        EvidenceType.RELATED_ISSUE,
    },
    UserRole.CSR: set(),
}


class EvidenceService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, issue_id: int, actor: User, payload: EvidenceCreate) -> EvidenceResponse:
        issue = self._issue_or_404(issue_id)
        self._ensure_can_add(actor, issue)

        allowed = _ALLOWED_EVIDENCE_TYPES[actor.role]
        if payload.evidence_type not in allowed:
            raise GramOneError(
                code="unauthorized_evidence_access",
                message=(
                    f"{actor.role.value} users cannot attach "
                    f"'{payload.evidence_type.value}' evidence."
                ),
                status_code=403,
            )

        evidence = IssueEvidence(
            issue_id=issue.id,
            evidence_type=payload.evidence_type,
            source_reference=payload.source_reference,
            description=payload.description,
        )
        self.db.add(evidence)
        self.db.commit()
        self.db.refresh(evidence)
        return self._to_response(evidence, issue)

    def list(self, issue_id: int, actor: User) -> list[EvidenceResponse]:
        issue = self._issue_or_404(issue_id)
        self._ensure_can_view(actor, issue)
        rows = self.db.scalars(
            select(IssueEvidence)
            .where(IssueEvidence.issue_id == issue.id)
            .order_by(IssueEvidence.created_at.desc())
        ).all()
        return [self._to_response(row, issue) for row in rows]

    def _to_response(self, evidence: IssueEvidence, issue: Issue) -> EvidenceResponse:
        service = TranslationService(self.db)
        translations = service.load_translation_map(
            "evidence", [evidence.id], "description"
        ).get(evidence.id, {})
        return EvidenceResponse(
            id=evidence.id,
            issue_id=evidence.issue_id,
            evidence_type=evidence.evidence_type,
            source_reference=evidence.source_reference,
            description=service.build_localized(
                "evidence",
                evidence.id,
                "description",
                evidence.description,
                issue.original_language,
                translations,
            ),
            created_at=evidence.created_at,
        )

    def _issue_or_404(self, issue_id: int) -> Issue:
        issue = self.db.get(Issue, issue_id)
        if issue is None:
            raise GramOneError(code="issue_not_found", message="Issue not found.", status_code=404)
        return issue

    def _ensure_can_add(self, actor: User, issue: Issue) -> None:
        if actor.role == UserRole.CSR:
            raise GramOneError(
                code="unauthorized_evidence_access",
                message="CSR users cannot modify citizen evidence.",
                status_code=403,
            )
        if actor.role == UserRole.CITIZEN and issue.reported_by != actor.id:
            raise GramOneError(
                code="unauthorized_evidence_access",
                message="You cannot add evidence to this issue.",
                status_code=403,
            )
        if actor.role == UserRole.PANCHAYAT and not (
            panchayat_in_scope(actor, issue.village_id) or issue.reported_by == actor.id
        ):
            raise GramOneError(
                code="unauthorized_evidence_access",
                message="This issue is outside your jurisdiction.",
                status_code=403,
            )
        if actor.role == UserRole.PANCHAYAT_EMPLOYEE and not (
            issue.assigned_to == actor.id or panchayat_in_scope(actor, issue.village_id)
        ):
            raise GramOneError(
                code="unauthorized_evidence_access",
                message="This issue is not in your assigned work scope.",
                status_code=403,
            )

    @staticmethod
    def _ensure_can_view(actor: User, issue: Issue) -> None:
        if actor.role == UserRole.CITIZEN and issue.reported_by != actor.id:
            raise GramOneError(
                code="unauthorized_evidence_access",
                message="You cannot view this issue's evidence.",
                status_code=403,
            )
        if actor.role == UserRole.PANCHAYAT and not (
            panchayat_in_scope(actor, issue.village_id) or issue.reported_by == actor.id
        ):
            raise GramOneError(
                code="unauthorized_evidence_access",
                message="This issue is outside your jurisdiction.",
                status_code=403,
            )
        if actor.role == UserRole.PANCHAYAT_EMPLOYEE and not (
            issue.assigned_to == actor.id or panchayat_in_scope(actor, issue.village_id)
        ):
            raise GramOneError(
                code="unauthorized_evidence_access",
                message="This issue is outside your assigned work scope.",
                status_code=403,
            )