"""Translation endpoints + localized serialization integration tests.

Runs against the live PostgreSQL inside a rolled-back transaction (see
conftest). The AI provider is faked so no external calls are made.
"""
from fastapi.testclient import TestClient

from app.main import app
from app.models import Village
from app.models.enums import UserRole
from app.services.ai import get_ai_provider


class FakeTranslateProvider:
    """Translates by suffixing the target language code (offline, deterministic)."""

    name = "fake-translate"

    async def interpret_issue(self, content, language=None):  # pragma: no cover - not used here
        raise NotImplementedError

    async def summarize(self, text):  # pragma: no cover - not used here
        return text

    async def suggest_sdgs(self, context):  # pragma: no cover - not used here
        return []

    async def suggest_stakeholders(self, context, village_hint):  # pragma: no cover
        return []

    async def translate(self, text, source_language, target_language):
        return f"{text} [{target_language}]"


class FailingTranslateProvider(FakeTranslateProvider):
    async def translate(self, text, source_language, target_language):
        raise RuntimeError("provider down")


def _register(client: TestClient, email: str, role: UserRole) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "Tr User", "email": email, "password": "StrongPass123", "role": role.value},
    )
    assert response.status_code == 201, response.text


def _token(client: TestClient, email: str) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "StrongPass123"},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _create_issue(client: TestClient, token: str, *, title: str = "School tank empty") -> dict:
    response = client.post(
        "/api/v1/issues",
        json={"title": title, "description": "Water supply broken.", "category": "water"},
        headers=_auth(token),
    )
    assert response.status_code == 201, response.text
    return response.json()


def _override_provider(provider):
    app.dependency_overrides[get_ai_provider] = lambda: provider
    return app


def test_localized_variants_stored_and_served(client: TestClient, db_session) -> None:
    _register(client, "tr1@example.com", UserRole.CITIZEN)
    token = _token(client, "tr1@example.com")

    # Seed a report in Hindi.
    response = client.post(
        "/api/v1/issues/from-interpretation",
        json={
            "category": "water",
            "summary": "स्कूल में पानी की समस्या",
            "confidence": "high",
            "original_language": "hi",
            "description": "स्कूल में दो दिनों से पानी नहीं है।",
            "localized_description": {"en": "School has had no water for two days."},
        },
        headers=_auth(token),
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["original_language"] == "hi"
    assert body["title"] == "स्कूल में पानी की समस्या"

    # English translation of the description was supplied and must be served.
    assert body["description"]["hi"] == "स्कूल में दो दिनों से पानी नहीं है।"
    assert body["description"]["en"] == "School has had no water for two days."

    # Original DB content is untouched (still the raw Hindi description).
    from app.models import Issue
    issue = db_session.get(Issue, body["id"])
    assert issue.description == "स्कूल में दो दिनों से पानी नहीं है।"
    assert issue.original_language == "hi"


def test_store_and_cache_translations(client: TestClient, db_session) -> None:
    _register(client, "tr2@example.com", UserRole.CITIZEN)
    token = _token(client, "tr2@example.com")
    issue = _create_issue(client, token, title="School tank empty")

    response = client.post(
        "/api/v1/translations/store",
        json={
            "entity_type": "issue",
            "entity_id": issue["id"],
            "field_name": "title",
            "source_language": "en",
            "translations": {"hi": "स्कूल टंकी खाली", "ta": "பள்ளி தொட்டி காலி"},
        },
        headers=_auth(token),
    )
    assert response.status_code == 200, response.text

    detail = client.get(f"/api/v1/issues/{issue['id']}", headers=_auth(token))
    assert detail.status_code == 200
    body = detail.json()
    assert body["title"] == {
        "en": "School tank empty",
        "hi": "स्कूल टंकी खाली",
        "ta": "பள்ளி தொட்டி காலி",
    }
    # Original string column is preserved.
    from app.models import Issue
    assert db_session.get(Issue, issue["id"]).title == "School tank empty"


def test_translate_batch_fills_missing_via_provider(client: TestClient, db_session) -> None:
    _register(client, "tr3@example.com", UserRole.CITIZEN)
    token = _token(client, "tr3@example.com")
    issue = _create_issue(client, token, title="Broken handpump")

    _override_provider(FakeTranslateProvider())
    try:
        response = client.post(
            "/api/v1/translations/translate-batch",
            json={
                "requests": [
                    {
                        "entity_type": "issue",
                        "entity_id": issue["id"],
                        "field_name": "title",
                        "target_language": "hi",
                    }
                ]
            },
            headers=_auth(token),
        )
    finally:
        app.dependency_overrides.pop(get_ai_provider, None)

    assert response.status_code == 200, response.text
    results = response.json()["results"]
    assert len(results) == 1
    assert results[0]["translated_text"] == "Broken handpump [hi]"

    # Second call is served from cache (provider result identical, but no call).
    detail = client.get(f"/api/v1/issues/{issue['id']}", headers=_auth(token))
    assert detail.json()["title"] == {"en": "Broken handpump", "hi": "Broken handpump [hi]"}


def test_translate_batch_failure_falls_back_to_null(client: TestClient) -> None:
    _register(client, "tr4@example.com", UserRole.CITIZEN)
    token = _token(client, "tr4@example.com")
    issue = _create_issue(client, token, title="Dry well")

    _override_provider(FailingTranslateProvider())
    try:
        response = client.post(
            "/api/v1/translations/translate-batch",
            json={
                "requests": [
                    {
                        "entity_type": "issue",
                        "entity_id": issue["id"],
                        "field_name": "title",
                        "target_language": "ta",
                    }
                ]
            },
            headers=_auth(token),
        )
    finally:
        app.dependency_overrides.pop(get_ai_provider, None)

    assert response.status_code == 200
    result = response.json()["results"][0]
    assert result["translated_text"] is None

    # UI must still show the original title (no blank cards).
    detail = client.get(f"/api/v1/issues/{issue['id']}", headers=_auth(token))
    assert detail.json()["title"] == "Dry well"


def test_translate_batch_rejects_foreign_issue(client: TestClient) -> None:
    _register(client, "tr5@example.com", UserRole.CITIZEN)
    owner_token = _token(client, "tr5@example.com")
    _register(client, "tr6@example.com", UserRole.CITIZEN)
    other_token = _token(client, "tr6@example.com")

    issue = _create_issue(client, owner_token, title="Own issue")
    response = client.post(
        "/api/v1/translations/translate-batch",
        json={
            "requests": [
                {
                    "entity_type": "issue",
                    "entity_id": issue["id"],
                    "field_name": "title",
                    "target_language": "hi",
                }
            ]
        },
        headers=_auth(other_token),
    )
    assert response.status_code == 403


def test_issue_village_name_localized(client: TestClient, db_session) -> None:
    _register(client, "tr7@example.com", UserRole.CITIZEN)
    token = _token(client, "tr7@example.com")
    village = Village(name="Sevagram", district="Dhar", state="MP")
    db_session.add(village)
    db_session.flush()

    response = client.post(
        "/api/v1/translations/store",
        json={
            "entity_type": "village",
            "entity_id": village.id,
            "field_name": "name",
            "source_language": "en",
            "translations": {"hi": "सेवाग्राम"},
        },
        headers=_auth(token),
    )
    assert response.status_code == 200, response.text

    create = client.post(
        "/api/v1/issues",
        json={
            "title": "Handpump dry",
            "category": "water",
            "village_id": village.id,
        },
        headers=_auth(token),
    )
    assert create.status_code == 201
    assert create.json()["village"]["name"] == {"en": "Sevagram", "hi": "सेवाग्राम"}
    # Database row is unchanged.
    assert db_session.get(Village, village.id).name == "Sevagram"
