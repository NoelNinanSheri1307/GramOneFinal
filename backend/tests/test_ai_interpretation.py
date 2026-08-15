"""AI issue interpretation tests — fully offline.

The provider is exercised with mocked ``_request_json`` responses and the
endpoints with a fake provider; no live OpenRouter calls are made.
"""
import asyncio
import json

import httpx
import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.core.errors import GramOneError
from app.main import app
from app.models.enums import UserRole
from app.schemas.common import DEFAULT_LIMIT  # noqa: F401
from app.services.ai import get_ai_provider
from app.services.ai.contracts import IssueInterpretation
from app.services.ai.openrouter import OpenRouterProvider
from app.services.ai_interpretation import AIIssueInterpretationService

VALID_WATER = {
    "category": "water",
    "summary": "School has no drinking water for three days.",
    "affected_entity": "school",
    "duration_hint": "3 days",
    "confidence": "medium",
}

VALID_EDUCATION = {
    "category": "education",
    "summary": "Classrooms have no benches.",
    "affected_entity": "classrooms",
    "confidence": "low",
}

VALID_CIVIC = {
    "category": "civic",
    "summary": "Street lights are not working.",
    "affected_entity": "street lights",
    "confidence": "high",
}


class FakeAIProvider:
    name = "fake"

    def __init__(self, result: IssueInterpretation | None = None, error: Exception | None = None):
        self._result = result
        self._error = error

    async def interpret_issue(self, content: str, language: str | None = None) -> IssueInterpretation:
        if self._error is not None:
            raise self._error
        if self._result is not None:
            return self._result
        return make_interpretation()

    async def summarize(self, text: str) -> str:
        return text


def make_interpretation(**overrides) -> IssueInterpretation:
    payload = {
        "category": "water",
        "summary": "School has no drinking water.",
        "confidence": "medium",
    }
    payload.update(overrides)
    return IssueInterpretation.model_validate(payload)


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _register(client: TestClient, email: str, role: UserRole) -> str:
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "AI User", "email": email, "password": "StrongPass123", "role": role.value},
    )
    assert response.status_code == 201, response.text
    token = client.post(
        "/api/v1/auth/login", json={"email": email, "password": "StrongPass123"}
    ).json()["access_token"]
    return token


def _provider_with(monkeypatch, *, content=None, error=None, payload=None) -> OpenRouterProvider:
    provider = OpenRouterProvider(get_settings())
    if payload is None:
        payload = {"choices": [{"message": {"content": content}}]}

    async def fake_request_json(messages):
        if error is not None:
            raise error
        return payload

    monkeypatch.setattr(provider, "_request_json", fake_request_json)
    return provider


# ---------------------------------------------------------------------------
# Provider: parsing + strict validation
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        (json.dumps(VALID_WATER), "water"),
        (json.dumps(VALID_EDUCATION), "education"),
        (json.dumps(VALID_CIVIC), "civic"),
    ],
)
def test_provider_parses_valid_interpretations(monkeypatch, raw, expected) -> None:
    provider = _provider_with(monkeypatch, content=raw)
    result = asyncio.run(provider.interpret_issue("some report"))
    assert result.category.value == expected
    assert isinstance(result, IssueInterpretation)


def test_provider_missing_info_stays_null(monkeypatch) -> None:
    raw = json.dumps(
        {
            "category": "water",
            "summary": "Village handpump is dry.",
            "confidence": "medium",
            "missing_information": ["Number of affected households"],
        }
    )
    result = asyncio.run(_provider_with(monkeypatch, content=raw).interpret_issue("x"))
    assert result.affected_population is None
    assert result.affected_entity is None
    assert result.missing_information == ["Number of affected households"]


def test_provider_rejects_unknown_category(monkeypatch) -> None:
    provider = _provider_with(
        monkeypatch, content=json.dumps({"category": "roads", "confidence": "high"})
    )
    with pytest.raises(GramOneError) as exc:
        asyncio.run(provider.interpret_issue("x"))
    assert exc.value.code == "ai_output_invalid"


def test_provider_rejects_malformed_json(monkeypatch) -> None:
    provider = _provider_with(monkeypatch, content="this is not json")
    with pytest.raises(GramOneError) as exc:
        asyncio.run(provider.interpret_issue("x"))
    assert exc.value.code == "ai_output_invalid"


def test_provider_rejects_missing_required_fields(monkeypatch) -> None:
    provider = _provider_with(
        monkeypatch, content=json.dumps({"category": "water"})
    )
    with pytest.raises(GramOneError) as exc:
        asyncio.run(provider.interpret_issue("x"))
    assert exc.value.code == "ai_output_invalid"


def test_provider_rejects_extra_fields(monkeypatch) -> None:
    raw = {**VALID_WATER, "impact_score": 87, "confidence": "high"}
    provider = _provider_with(monkeypatch, content=json.dumps(raw))
    with pytest.raises(GramOneError) as exc:
        asyncio.run(provider.interpret_issue("x"))
    assert exc.value.code == "ai_output_invalid"


# ---------------------------------------------------------------------------
# Provider: failure handling
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "error",
    [
        httpx.TimeoutException("request timed out"),
        httpx.ConnectError("connection refused"),
        httpx.HTTPStatusError(
            "401",
            request=httpx.Request("POST", "https://openrouter.ai"),
            response=httpx.Response(401, request=httpx.Request("POST", "https://openrouter.ai")),
        ),
    ],
)
def test_provider_http_failures_raise_controlled_error(monkeypatch, error) -> None:
    provider = _provider_with(monkeypatch, error=error)
    with pytest.raises(GramOneError) as exc:
        asyncio.run(provider.interpret_issue("x"))
    assert exc.value.code == "ai_provider_error"
    assert exc.value.status_code == 502


def test_provider_error_does_not_leak_api_key(monkeypatch) -> None:
    provider = _provider_with(monkeypatch, error=httpx.TimeoutException("timed out"))
    provider._api_key = "sk-test-secret-abc"
    with pytest.raises(GramOneError) as exc:
        asyncio.run(provider.interpret_issue("x"))
    assert "sk-test-secret" not in str(exc.value)


def test_provider_request_contains_no_key_and_uses_prompt_version(monkeypatch) -> None:
    provider = OpenRouterProvider(get_settings())
    provider._api_key = "sk-test-secret-abc"
    captured: dict = {}

    async def capture(messages):
        captured["messages"] = messages
        return {"choices": [{"message": {"content": json.dumps(VALID_WATER)}}]}

    monkeypatch.setattr(provider, "_request_json", capture)
    asyncio.run(provider.interpret_issue("School has no drinking water"))
    assert "sk-test-secret" not in str(captured["messages"])
    assert captured["messages"][0]["role"] == "system"
    assert "issue-interpretation-v1" in captured["messages"][0]["content"]
    assert captured["messages"][1]["role"] == "user"


# ---------------------------------------------------------------------------
# Provider factory selection
# ---------------------------------------------------------------------------


def test_factory_selects_openrouter_when_configured(monkeypatch) -> None:
    from app.core.config import get_settings

    get_settings.cache_clear()
    monkeypatch.setenv("AI_PROVIDER", "openrouter")
    monkeypatch.setenv("OPENROUTER_API_KEY", "sk-test")
    try:
        provider = get_ai_provider()
        assert isinstance(provider, OpenRouterProvider)
    finally:
        get_settings.cache_clear()


def test_factory_returns_unconfigured_without_key(monkeypatch) -> None:
    from app.core.config import get_settings

    get_settings.cache_clear()
    monkeypatch.setenv("OPENROUTER_API_KEY", "")
    try:
        provider = get_ai_provider()
        assert provider.name == "unconfigured"
    finally:
        get_settings.cache_clear()


# ---------------------------------------------------------------------------
# Service domain rules
# ---------------------------------------------------------------------------


def test_domain_rules_drop_unknown_sdg_and_normalize_known() -> None:
    unknown = _apply(make_interpretation(suggested_sdg="SDG99"))
    assert unknown.suggested_sdg is None
    known = _apply(make_interpretation(suggested_sdg="sdg6"))
    assert known.suggested_sdg == "SDG6"


def _apply(interp: IssueInterpretation) -> IssueInterpretation:
    return AIIssueInterpretationService._apply_domain_rules(interp)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@pytest.fixture()
def citizen_token(client: TestClient) -> str:
    return _register(client, "ai-cit@example.com", UserRole.CITIZEN)


def _override_provider(fake: FakeAIProvider):
    app.dependency_overrides[get_ai_provider] = lambda: fake
    return app


def test_interpret_endpoint_returns_validated_interpretation(client, citizen_token) -> None:
    fake = FakeAIProvider(
        result=make_interpretation(
            category="water",
            affected_population=80,
            missing_information=["Number of affected students"],
        )
    )
    _override_provider(fake)
    try:
        response = client.post(
            "/api/v1/issues/interpret",
            json={
                "text": (
                    "School has had no drinking water for three days; "
                    "around 80 students affected."
                )
            },
            headers=_auth(citizen_token),
        )
    finally:
        app.dependency_overrides.pop(get_ai_provider, None)
    assert response.status_code == 200
    body = response.json()
    assert body["category"] == "water"
    assert body["affected_population"] == 80
    assert body["missing_information"] == ["Number of affected students"]
    assert body["interpretation_version"] == "issue-interpretation-v1"


@pytest.mark.parametrize(
    ("interp", "expected"),
    [
        (make_interpretation(**VALID_WATER), "water"),
        (make_interpretation(**VALID_EDUCATION), "education"),
        (make_interpretation(**VALID_CIVIC), "civic"),
    ],
)
def test_interpret_endpoint_handles_all_domains(client, citizen_token, interp, expected) -> None:
    _override_provider(FakeAIProvider(result=interp))
    try:
        response = client.post(
            "/api/v1/issues/interpret",
            json={"text": "sample report"},
            headers=_auth(citizen_token),
        )
    finally:
        app.dependency_overrides.pop(get_ai_provider, None)
    assert response.status_code == 200
    assert response.json()["category"] == expected


def test_interpret_endpoint_provider_failure_returns_controlled_error(
    client, citizen_token
) -> None:
    _override_provider(
        FakeAIProvider(
            error=GramOneError(code="ai_provider_error", message="down", status_code=502)
        )
    )
    try:
        response = client.post(
            "/api/v1/issues/interpret",
            json={"text": "sample report"},
            headers=_auth(citizen_token),
        )
    finally:
        app.dependency_overrides.pop(get_ai_provider, None)
    assert response.status_code == 502
    assert response.json()["detail"]["code"] == "ai_provider_error"
    assert "sk-" not in response.text


def test_interpret_endpoint_invalid_output_returns_controlled_error(
    client, citizen_token
) -> None:
    _override_provider(
        FakeAIProvider(
            error=GramOneError(code="ai_output_invalid", message="bad", status_code=502)
        )
    )
    try:
        response = client.post(
            "/api/v1/issues/interpret",
            json={"text": "sample report"},
            headers=_auth(citizen_token),
        )
    finally:
        app.dependency_overrides.pop(get_ai_provider, None)
    assert response.status_code == 502
    assert response.json()["detail"]["code"] == "ai_output_invalid"


def test_create_from_interpretation_creates_issue_via_issue_service(
    client, db_session, citizen_token
) -> None:
    interp = make_interpretation(
        category="water", summary="School water shortage affecting students."
    )
    response = client.post(
        "/api/v1/issues/from-interpretation",
        json=interp.model_dump(mode="json"),
        headers=_auth(citizen_token),
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["category"] == "water"
    assert body["source"] == "citizen"
    assert body["status"] == "reported"
    assert body["title"] == "School water shortage affecting students."
    assert body["reference"].startswith("ISSUE-")


def test_from_interpretation_rejects_arbitrary_fields(client, citizen_token) -> None:
    payload = make_interpretation(category="water").model_dump(mode="json")
    payload["impact_score"] = 87
    payload["reported_by"] = 1
    response = client.post(
        "/api/v1/issues/from-interpretation",
        json=payload,
        headers=_auth(citizen_token),
    )
    assert response.status_code == 422


def test_interpret_and_create_do_not_create_scores_or_matches(
    client, db_session, citizen_token
) -> None:
    from sqlalchemy import func, select

    from app.models import CSRMatch, ImpactScore

    _override_provider(FakeAIProvider(result=make_interpretation(category="water")))
    try:
        interp_response = client.post(
            "/api/v1/issues/interpret",
            json={"text": "Tank empty in ward 4"},
            headers=_auth(citizen_token),
        )
        assert interp_response.status_code == 200
        interpretation = interp_response.json()

        create_response = client.post(
            "/api/v1/issues/from-interpretation",
            json=interpretation,
            headers=_auth(citizen_token),
        )
        assert create_response.status_code == 201
    finally:
        app.dependency_overrides.pop(get_ai_provider, None)

    assert db_session.scalar(select(func.count()).select_from(ImpactScore)) == 0
    assert db_session.scalar(select(func.count()).select_from(CSRMatch)) == 0


def test_structured_issue_creation_still_works_without_ai(client, db_session) -> None:
    token = _register(client, "no-ai@example.com", UserRole.CITIZEN)
    response = client.post(
        "/api/v1/issues",
        json={"title": "Plain report", "category": "civic"},
        headers=_auth(token),
    )
    assert response.status_code == 201