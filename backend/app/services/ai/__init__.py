"""AI service package.

Exposes a provider-agnostic factory. Providers are chosen by configuration
(``AI_PROVIDER`` / the presence of ``OPENROUTER_API_KEY``); their output is
always validated structured data (see ``app.services.ai.contracts``).
"""
from app.core.config import get_settings
from app.services.ai.base import AIProvider
from app.services.ai.openrouter import OpenRouterProvider
from app.services.ai.providers import UnconfiguredAIProvider


def get_ai_provider(name: str | None = None) -> AIProvider:
    """Return the configured AI provider instance.

    Selection is driven by ``AI_PROVIDER``; the OpenRouter provider is also used
    for the legacy/unset provider names when ``OPENROUTER_API_KEY`` is present,
    so the backend works out of the box with OpenRouter configured locally.
    Falls back to the loud, do-nothing provider when no key is configured.
    """
    settings = get_settings()
    provider_name = (name or settings.ai_provider or "").strip().lower()
    if provider_name == "openrouter" and settings.openrouter_api_key:
        return OpenRouterProvider(settings)
    if provider_name in {"", "unconfigured", "openai"} and settings.openrouter_api_key:
        return OpenRouterProvider(settings)
    return UnconfiguredAIProvider()


__all__ = ["AIProvider", "get_ai_provider"]