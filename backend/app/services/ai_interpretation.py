"""AIIssueInterpretationService — bridge between the AIProvider, strict schema
validation and the existing IssueService.

The flow is: natural language -> AIProvider -> Pydantic validation -> domain
validation -> (optionally) existing IssueService. The AI never decides scores,
priority, funding, CSR matching, verification or truthfulness.
"""
from sqlalchemy.orm import Session

from app.models import User
from app.schemas.issue import IssueCreate, IssueResponse
from app.services.ai.base import AIProvider
from app.services.ai.contracts import IssueInterpretation
from app.services.issues import IssueService
from app.services.translations import TranslationService

_ALLOWED_SDGS = {f"SDG{n}" for n in range(1, 18)}


def _split_localized(summary: str | dict[str, str]) -> tuple[str, dict[str, str]]:
    """Split a title that may be ``str`` or a ``{language: text}`` map.

    Returns ``(original_text, {target_language: text} variants)``. The original
    text is the English variant when present, otherwise the first non-empty one.
    """
    if isinstance(summary, str):
        return summary, {}
    variants = {k: v for k, v in summary.items() if v and v.strip()}
    original = variants.pop("en", None) or next(iter(variants.values()), "")
    return original, variants


class AIIssueInterpretationService:
    def __init__(self, provider: AIProvider) -> None:
        self._provider = provider

    async def interpret(self, text: str, language: str | None = None) -> IssueInterpretation:
        """Return a validated interpretation for ``text``.

        The provider already parses + validates strictly; this layer applies
        GramOne domain rules (e.g. the controlled SDG vocabulary) afterwards.
        """
        interpretation = await self._provider.interpret_issue(text, language)
        return self._apply_domain_rules(interpretation)

    def create_from_interpretation(
        self, actor: User, interpretation: IssueInterpretation, db: Session
    ) -> IssueResponse:
        """Create an Issue from a confirmed interpretation via IssueService.

        The original report text and its language are persisted verbatim; any
        pre-translated variants supplied by the client are cached separately in
        ``content_translations`` — the original content is never overwritten.
        """
        validated = self._apply_domain_rules(interpretation)
        title_text, title_variants = _split_localized(validated.summary)
        original_language = validated.original_language or "en"

        payload = IssueCreate(
            title=title_text[:160],
            description=validated.description
            or (validated.summary if isinstance(validated.summary, str) else title_text),
            category=validated.category,
            subcategory=validated.subcategory,
            original_language=original_language,
        )
        created = IssueService(db).create_issue(actor, payload)

        service = TranslationService(db)
        if title_variants:
            service.store("issue", created.id, "title", original_language, title_variants)
        if validated.localized_description:
            service.store(
                "issue",
                created.id,
                "description",
                original_language,
                validated.localized_description,
            )
        # Re-serialize so the stored translations are included in the response.
        return IssueService(db).get_issue(created.id, actor)

    @staticmethod
    def _apply_domain_rules(interpretation: IssueInterpretation) -> IssueInterpretation:
        if interpretation.suggested_sdg is not None:
            normalized = interpretation.suggested_sdg.strip().upper()
            if normalized not in _ALLOWED_SDGS:
                interpretation.suggested_sdg = None
            else:
                interpretation.suggested_sdg = normalized
        return interpretation