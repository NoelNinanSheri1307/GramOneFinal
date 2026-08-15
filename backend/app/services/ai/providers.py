"""Concrete AI provider implementations.

The default, do-nothing provider is used whenever no LLM is configured so any
accidental call fails loudly. Real providers never depend on secrets being
committed to source control.
"""
from app.services.ai.base import AIProvider
from app.services.ai.contracts import IssueInterpretation, Suggestion


class UnconfiguredAIProvider(AIProvider):
    """Default provider used until a real LLM connection is configured.

    Raises :class:`NotImplementedError` so any accidental call is loud instead
    of pretending to work.
    """

    name = "unconfigured"

    async def interpret_issue(self, content: str, language: str | None = None) -> IssueInterpretation:
        raise NotImplementedError("AI provider not configured.")

    async def summarize(self, text: str) -> str:
        raise NotImplementedError("AI provider not configured.")

    async def suggest_sdgs(self, context: str) -> list[Suggestion]:
        raise NotImplementedError("AI provider not configured.")

    async def suggest_stakeholders(self, context: str, village_hint: str) -> list[Suggestion]:
        raise NotImplementedError("AI provider not configured.")

    async def translate(self, text: str, source_language: str, target_language: str) -> str:
        raise NotImplementedError("AI provider not configured.")