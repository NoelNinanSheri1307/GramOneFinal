"""OpenRouter-backed AIProvider.

Isolated behind the AIProvider abstraction: nothing else in GramOne talks to
OpenRouter directly. Output is parsed and strictly validated before it is
returned; provider internals and secrets never leak into errors or logs.
"""
import json

import httpx
from pydantic import ValidationError

from app.core.config import Settings
from app.core.errors import GramOneError
from app.services.ai.base import AIProvider
from app.services.ai.contracts import IssueInterpretation, Suggestion
from app.services.ai.prompts import (
    build_issue_interpretation_messages,
    build_translation_messages,
)

_CHAT_COMPLETIONS_PATH = "/chat/completions"


class OpenRouterProvider(AIProvider):
    """Calls the configured OpenRouter model with JSON-mode chat completions."""

    name = "openrouter"

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._model = settings.openrouter_model
        self._api_key = settings.openrouter_api_key
        self._base_url = settings.openrouter_base_url.rstrip("/")
        self._timeout = settings.openrouter_timeout_seconds

    async def interpret_issue(self, content: str, language: str | None = None) -> IssueInterpretation:
        messages = build_issue_interpretation_messages(content, language)
        try:
            data = await self._request_json(messages)
            raw = self._extract_content(data)
        except (httpx.HTTPStatusError, httpx.TimeoutException, httpx.ConnectError) as exc:
            raise self._provider_error(exc) from None
        except (KeyError, IndexError, TypeError, json.JSONDecodeError):
            raise self._output_invalid() from None

        try:
            if isinstance(raw, str):
                cleaned = raw.strip()
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:]
                elif cleaned.startswith("```"):
                    cleaned = cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()
                parsed = json.loads(cleaned)
            else:
                parsed = raw
            if isinstance(parsed, dict):
                if "urgency_suggestion" in parsed and isinstance(parsed["urgency_suggestion"], str):
                    parsed["urgency_suggestion"] = parsed["urgency_suggestion"].lower()
                if "confidence" in parsed and isinstance(parsed["confidence"], str):
                    parsed["confidence"] = parsed["confidence"].lower()
                if (
                    "evidence_candidates" in parsed
                    and isinstance(parsed["evidence_candidates"], list)
                ):
                    normalized_candidates = []
                    for item in parsed["evidence_candidates"]:
                        if isinstance(item, str):
                            normalized_candidates.append({"description": item})
                        elif isinstance(item, dict):
                            normalized_candidates.append(item)
                    parsed["evidence_candidates"] = normalized_candidates
            return IssueInterpretation.model_validate(parsed)
        except (json.JSONDecodeError, ValidationError) as err:
            import logging
            logging.error(f"Validation or JSON parsing error: {err}. Raw response content: {raw}")
            raise self._output_invalid() from None

    async def summarize(self, text: str) -> str:
        raise NotImplementedError("summarize is not wired for OpenRouter in this milestone.")

    async def suggest_sdgs(self, context: str) -> list[Suggestion]:
        raise NotImplementedError("suggest_sdgs is not wired for OpenRouter in this milestone.")

    async def suggest_stakeholders(self, context: str, village_hint: str) -> list[Suggestion]:
        raise NotImplementedError(
            "suggest_stakeholders is not wired for OpenRouter in this milestone."
        )

    async def translate(self, text: str, source_language: str, target_language: str) -> str:
        messages = build_translation_messages(text, source_language, target_language)
        try:
            content = await self._request_text(messages)
        except (httpx.HTTPStatusError, httpx.TimeoutException, httpx.ConnectError) as exc:
            raise self._provider_error(exc) from None
        except (KeyError, IndexError, TypeError):
            raise self._output_invalid() from None

        cleaned = content.strip().strip('"').strip("'")
        if cleaned:
            return cleaned
        raise self._output_invalid()

    async def _request_json(self, messages: list[dict[str, str]]) -> dict:
        """POST a chat completion and return the JSON response object."""
        url = f"{self._base_url}{_CHAT_COMPLETIONS_PATH}"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": self._model,
            "messages": messages,
            "temperature": 0,
            "response_format": {"type": "json_object"},
        }
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(url, headers=headers, json=body)
            response.raise_for_status()
            return response.json()

    async def _request_text(self, messages: list[dict[str, str]]) -> str:
        """POST a chat completion and return the plain-text content."""
        url = f"{self._base_url}{_CHAT_COMPLETIONS_PATH}"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": self._model,
            "messages": messages,
            "temperature": 0,
        }
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(url, headers=headers, json=body)
            response.raise_for_status()
            data = response.json()
        return data["choices"][0]["message"]["content"]

    @staticmethod
    def _extract_content(data: dict) -> object:
        """Pull ``choices[0].message.content`` from an OpenAI-compatible payload."""
        return data["choices"][0]["message"]["content"]

    @staticmethod
    def _provider_error(exc: Exception) -> GramOneError:
        return GramOneError(
            code="ai_provider_error",
            message="The AI service is temporarily unavailable. Please try again or use "
            "structured issue creation.",
            status_code=502,
            details={"reason": type(exc).__name__},
        )

    @staticmethod
    def _output_invalid() -> GramOneError:
        return GramOneError(
            code="ai_output_invalid",
            message="The AI service returned an invalid interpretation. Please try again or "
            "use structured issue creation.",
            status_code=502,
        )