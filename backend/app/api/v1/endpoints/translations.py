"""Translation endpoints.

Provide two non-destructive paths for dynamic-content translation:

- ``POST /translations/store`` stores pre-authored ``{language: text}``
  variants supplied by trusted clients (reporting flow / demo seed).
- ``POST /translations/translate-batch`` ensures translations exist for a set
  of ``(entity_type, entity_id, field, target_language)`` requests, translating
  missing ones via the AI provider and caching them. Individual failures are
  reported as ``translated_text: null`` so the UI never breaks.

Original database content is never modified by either endpoint.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.errors import GramOneError
from app.db.session import get_db
from app.models import (
    CommunityNotice,
    ImpactCase,
    Issue,
    IssueEvidence,
    IssueHistory,
    SafetyResource,
    Scheme,
    User,
    Village,
)
from app.models.enums import PublishStatus, SchemeStatus, UserRole
from app.schemas.translation import (
    TranslationBatchRequest,
    TranslationBatchResponse,
    TranslationResult,
    TranslationStoreRequest,
)
from app.services.access import panchayat_in_scope
from app.services.ai import AIProvider, get_ai_provider
from app.services.impact_cases import ImpactCaseService
from app.services.issues import IssueService
from app.services.translations import SUPPORTED_CONTENT_LANGUAGES, TranslationService

router = APIRouter(prefix="/translations", tags=["translations"])

_ENTITY_TYPES = (
    "issue",
    "impact_case",
    "evidence",
    "history",
    "village",
    "scheme",
    "community_notice",
    "safety_resource",
)
_ISSUE_FIELDS = ("title", "description")
_CASE_FIELDS = ("title", "summary")
_NOTE_FIELDS = ("note", "description", "name")

#: translatable fields for each community entity type
_COMMUNITY_FIELDS = {
    "scheme": (
        "title",
        "short_description",
        "detailed_description",
        "eligibility",
        "benefits",
        "application_instructions",
    ),
    "community_notice": ("title", "summary", "content"),
    "safety_resource": ("title", "summary", "content"),
}


def _resolve_content(
    db: Session, actor: User, entity_type: str, entity_id: int, field_name: str
) -> tuple[object, str | None, str]:
    """Return ``(entity, original_text, source_language)`` after access checks."""
    if entity_type == "issue":
        issue = db.get(Issue, entity_id)
        if issue is None:
            raise GramOneError(code="issue_not_found", message="Issue not found.", status_code=404)
        IssueService._ensure_readable(actor, issue)
        source = issue.original_language or "en"
        if field_name == "title":
            return issue, issue.title, source
        if field_name == "description":
            return issue, issue.description, source
        raise _unsupported_field(entity_type, field_name)
    if entity_type == "impact_case":
        case = db.get(ImpactCase, entity_id)
        if case is None:
            raise GramOneError(
                code="impact_case_not_found", message="Impact Case not found.", status_code=404
            )
        ImpactCaseService._ensure_readable(actor, case)
        source = case.original_language or "en"
        if field_name == "title":
            return case, case.title, source
        if field_name == "summary":
            return case, case.summary, source
        raise _unsupported_field(entity_type, field_name)
    if entity_type == "village":
        village = db.get(Village, entity_id)
        if village is None:
            raise GramOneError(
                code="village_not_found", message="Village not found.", status_code=404
            )
        if field_name == "name":
            return village, village.name, "en"
        raise _unsupported_field(entity_type, field_name)
    if entity_type in ("evidence", "history"):
        if entity_type == "evidence":
            row = db.get(IssueEvidence, entity_id)
            if row is None:
                raise GramOneError(
                    code="evidence_not_found", message="Evidence not found.", status_code=404
                )
            if field_name != "description":
                raise _unsupported_field(entity_type, field_name)
            field_text = row.description
        else:
            row = db.get(IssueHistory, entity_id)
            if row is None:
                raise GramOneError(
                    code="history_not_found", message="History entry not found.", status_code=404
                )
            if field_name != "note":
                raise _unsupported_field(entity_type, field_name)
            field_text = row.note
        issue = db.get(Issue, row.issue_id)
        if issue is None:
            raise GramOneError(code="issue_not_found", message="Issue not found.", status_code=404)
        IssueService._ensure_readable(actor, issue)
        return row, field_text, issue.original_language or "en"
    if entity_type in _COMMUNITY_FIELDS:
        if entity_type == "scheme":
            row = db.get(Scheme, entity_id)
            if row is None:
                raise GramOneError(
                    code="scheme_not_found", message="Scheme not found.", status_code=404
                )
            public_ok = row.status == SchemeStatus.PUBLISHED
            village_id = row.village_id
        elif entity_type == "community_notice":
            row = db.get(CommunityNotice, entity_id)
            if row is None:
                raise GramOneError(
                    code="notice_not_found", message="Notice not found.", status_code=404
                )
            public_ok = row.status == PublishStatus.PUBLISHED
            village_id = row.village_id
        else:
            row = db.get(SafetyResource, entity_id)
            if row is None:
                raise GramOneError(
                    code="safety_resource_not_found",
                    message="Safety resource not found.",
                    status_code=404,
                )
            public_ok = row.status == PublishStatus.PUBLISHED
            village_id = row.village_id

        if actor.role != UserRole.PANCHAYAT:
            if not public_ok:
                raise GramOneError(
                    code="content_not_available",
                    message="This content is not available.",
                    status_code=404,
                )
        elif not panchayat_in_scope(actor, village_id):
            raise GramOneError(
                code="out_of_jurisdiction",
                message="This content is outside your Panchayat jurisdiction.",
                status_code=403,
            )

        if field_name not in _COMMUNITY_FIELDS[entity_type]:
            raise _unsupported_field(entity_type, field_name)
        return row, getattr(row, field_name), row.original_language or "en"
    raise GramOneError(
        code="invalid_translation_target",
        message=f"Unsupported translation target: {entity_type}.",
        status_code=400,
    )


def _unsupported_field(entity_type: str, field_name: str) -> GramOneError:
    return GramOneError(
        code="invalid_translation_target",
        message=f"Field '{field_name}' is not translatable for '{entity_type}'.",
        status_code=400,
    )


def _validate_language(language: str, field: str) -> str:
    language = (language or "").lower()
    if language not in SUPPORTED_CONTENT_LANGUAGES:
        raise GramOneError(
            code="invalid_translation_target",
            message=f"Unsupported {field} language '{language}'.",
            status_code=400,
        )
    return language


@router.post("/store", status_code=200)
def store_translations(
    payload: TranslationStoreRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Store pre-authored localized variants for a dynamic field."""
    entity_type = payload.entity_type
    source_language = _validate_language(payload.source_language, "source")
    _resolve_content(db, user, entity_type, payload.entity_id, payload.field_name)
    TranslationService(db).store(
        entity_type,
        payload.entity_id,
        payload.field_name,
        source_language,
        payload.translations,
    )
    return {"ok": True}


@router.post("/translate-batch", response_model=TranslationBatchResponse)
async def translate_batch(
    payload: TranslationBatchRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    provider: AIProvider = Depends(get_ai_provider),
) -> TranslationBatchResponse:
    """Ensure translations exist for a batch of fields and return them.

    Cache hits are returned instantly; cache misses are translated via the AI
    provider and stored. Failures produce ``translated_text: null``.
    """
    service = TranslationService(db)
    results: list[TranslationResult] = []
    for request in payload.requests:
        target_language = _validate_language(request.target_language, "target")
        entity, original_text, resolved_source = _resolve_content(
            db, user, request.entity_type, request.entity_id, request.field_name
        )
        source_language = (
            _validate_language(request.source_language, "source")
            if request.source_language
            else resolved_source
        )
        translated = await service.ensure_translation(
            provider,
            request.entity_type,
            request.entity_id,
            request.field_name,
            source_language,
            target_language,
            original_text,
        )
        results.append(
            TranslationResult(
                entity_type=request.entity_type,
                entity_id=request.entity_id,
                field_name=request.field_name,
                target_language=target_language,
                translated_text=translated,
            )
        )
    return TranslationBatchResponse(results=results)