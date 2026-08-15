"""AI service provider abstraction.

The backend is not coupled to any single LLM provider. Concrete providers
(OpenAI, a local model, etc.) implement :class:`AIProvider` and are selected
through configuration.

Scoping:
- Language understanding only: classification, structured extraction,
  summarization, SDG/stakeholder suggestions.
- Never numerical or state decisions: evidence confidence, impact score,
  priority, CSR matching and issue transitions are deterministic backend rules.
"""
from abc import ABC, abstractmethod

from app.services.ai.contracts import IssueInterpretation, Suggestion


class AIProvider(ABC):
    """Interface every AI provider must implement."""

    name: str = "abstract"

    @abstractmethod
    async def interpret_issue(self, content: str, language: str | None = None) -> IssueInterpretation:
        """Classify, extract and summarize a natural-language issue report."""

    @abstractmethod
    async def summarize(self, text: str) -> str:
        """Return a compact summary of the given text."""

    @abstractmethod
    async def suggest_sdgs(self, context: str) -> list[Suggestion]:
        """Suggest SDGs aligned with the described problem."""

    @abstractmethod
    async def suggest_stakeholders(self, context: str, village_hint: str) -> list[Suggestion]:
        """Suggest stakeholders (e.g. a Panchayat office, a CSR partner)."""

    @abstractmethod
    async def translate(self, text: str, source_language: str, target_language: str) -> str:
        """Translate ``text`` from ``source_language`` into ``target_language``.

        Used for dynamic user-generated content translation. Implementations
        must raise :class:`app.core.errors.GramOneError` on failure so callers
        can fall back to the original text gracefully.
        """