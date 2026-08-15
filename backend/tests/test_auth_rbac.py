"""Authentication + RBAC integration tests against the live PostgreSQL.

Every test runs inside a single database transaction that is rolled back when
the test ends, so nothing is persisted. The application's ``get_db`` dependency
is overridden to a session bound to that transaction. If the real database is
unreachable the whole module is skipped (the rest of the suite stays DB-free).
"""
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from jwt import encode
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password
from app.models import User
from app.models.enums import UserRole


def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _register(
    client: TestClient, email: str, role: UserRole, password: str = "StrongPass123"
) -> dict:
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "Test User", "email": email, "password": password, "role": role.value},
    )
    assert response.status_code == 201, response.text
    return response.json()


def _login(client: TestClient, email: str, password: str = "StrongPass123") -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()


@pytest.mark.parametrize("role", [UserRole.CITIZEN, UserRole.PANCHAYAT, UserRole.CSR])
def test_register_each_role_succeeds(client: TestClient, role: UserRole) -> None:
    payload = _register(client, f"{role.value}@example.com", role)
    assert payload["id"] > 0
    assert payload["name"] == "Test User"
    assert payload["email"] == f"{role.value}@example.com"
    assert payload["role"] == role.value
    assert payload["is_active"] is True
    assert "password_hash" not in payload


def test_register_duplicate_email_rejected(client: TestClient) -> None:
    _register(client, "dupe@example.com", UserRole.CITIZEN)
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Another",
            "email": "DUPE@example.com",
            "password": "StrongPass123",
            "role": "citizen",
        },
    )
    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "email_already_registered"


def test_register_invalid_payloads_rejected(client: TestClient) -> None:
    cases = [
        {"name": "", "email": "x@example.com", "password": "StrongPass123", "role": "citizen"},
        {"name": "X", "email": "not-an-email", "password": "StrongPass123", "role": "citizen"},
        {"name": "X", "email": "x@example.com", "password": "short", "role": "citizen"},
        {"name": "X", "email": "x@example.com", "password": "StrongPass123", "role": "admin"},
        {"name": "X", "email": "x@example.com", "password": "StrongPass123"},
    ]
    for body in cases:
        response = client.post("/api/v1/auth/register", json=body)
        assert response.status_code == 422, body


def test_login_valid_credentials_succeed(client: TestClient) -> None:
    email = "login-ok@example.com"
    _register(client, email, UserRole.CITIZEN)
    token_payload = _login(client, email)
    assert token_payload["token_type"] == "bearer"
    assert isinstance(token_payload["access_token"], str) and len(token_payload["access_token"]) > 0
    assert token_payload["user"]["email"] == email
    assert "password_hash" not in token_payload


def test_login_invalid_credentials_rejected_without_leak(client: TestClient) -> None:
    email = "login-bad@example.com"
    _register(client, email, UserRole.CITIZEN)
    wrong_password = client.post(
        "/api/v1/auth/login", json={"email": email, "password": "WrongPass123"}
    )
    unknown_email = client.post(
        "/api/v1/auth/login", json={"email": "nobody@example.com", "password": "WrongPass123"}
    )
    assert wrong_password.status_code == 401
    assert unknown_email.status_code == 401
    assert wrong_password.json()["detail"]["code"] == "invalid_credentials"
    assert unknown_email.json()["detail"]["code"] == wrong_password.json()["detail"]["code"]


def test_me_with_valid_token(client: TestClient) -> None:
    _register(client, "me-ok@example.com", UserRole.CITIZEN)
    token = _login(client, "me-ok@example.com")["access_token"]
    response = client.get("/api/v1/auth/me", headers=_auth_header(token))
    assert response.status_code == 200
    assert response.json()["email"] == "me-ok@example.com"
    assert "password_hash" not in response.json()


def test_me_rejects_missing_token(client: TestClient) -> None:
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "missing_token"


def test_me_rejects_invalid_token(client: TestClient) -> None:
    for token in ["not-a-jwt", "Bearer-tampered.malformed.value"]:
        response = client.get("/api/v1/auth/me", headers=_auth_header(token))
        assert response.status_code == 401
        assert response.json()["detail"]["code"] == "invalid_token"


def test_expired_token_rejected(client: TestClient) -> None:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expired = encode(
        {"sub": "1", "exp": now - timedelta(minutes=5), "iat": now},
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    response = client.get("/api/v1/auth/me", headers=_auth_header(expired))
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "token_expired"


def test_inactive_user_cannot_authenticate_or_access(
    client: TestClient, db_session: Session
) -> None:
    user = User(
        name="Inactive",
        email="inactive@example.com",
        password_hash=hash_password("StrongPass123"),
        role=UserRole.CITIZEN,
        is_active=False,
    )
    db_session.add(user)
    db_session.flush()
    assert user.id is not None

    login = client.post(
        "/api/v1/auth/login", json={"email": "inactive@example.com", "password": "StrongPass123"}
    )
    assert login.status_code == 403
    assert login.json()["detail"]["code"] == "inactive_account"

    token = create_access_token(user)
    me = client.get("/api/v1/auth/me", headers=_auth_header(token))
    assert me.status_code == 403
    assert me.json()["detail"]["code"] == "inactive_account"


def test_role_restrictions_enforced(client: TestClient) -> None:
    _register(client, "rbac-citizen@example.com", UserRole.CITIZEN)
    _register(client, "rbac-panchayat@example.com", UserRole.PANCHAYAT)
    _register(client, "rbac-csr@example.com", UserRole.CSR)
    citizen_token = _login(client, "rbac-citizen@example.com")["access_token"]
    panchayat_token = _login(client, "rbac-panchayat@example.com")["access_token"]
    csr_token = _login(client, "rbac-csr@example.com")["access_token"]

    no_token = client.get("/api/v1/demo/rbac/citizen")
    assert no_token.status_code == 401
    assert no_token.json()["detail"]["code"] == "missing_token"

    citizen_on_panchayat = client.get(
        "/api/v1/demo/rbac/panchayat", headers=_auth_header(citizen_token)
    )
    assert citizen_on_panchayat.status_code == 403
    assert citizen_on_panchayat.json()["detail"]["code"] == "insufficient_permissions"

    csr_on_panchayat = client.get("/api/v1/demo/rbac/panchayat", headers=_auth_header(csr_token))
    assert csr_on_panchayat.status_code == 403

    panchayat_on_panchayat = client.get(
        "/api/v1/demo/rbac/panchayat", headers=_auth_header(panchayat_token)
    )
    assert panchayat_on_panchayat.status_code == 200

    citizen_on_csr = client.get("/api/v1/demo/rbac/csr", headers=_auth_header(citizen_token))
    assert citizen_on_csr.status_code == 403

    csr_on_csr = client.get("/api/v1/demo/rbac/csr", headers=_auth_header(csr_token))
    assert csr_on_csr.status_code == 200

    citizen_on_staff = client.get("/api/v1/demo/rbac/staff", headers=_auth_header(citizen_token))
    assert citizen_on_staff.status_code == 200


def test_password_hash_never_in_any_response(client: TestClient) -> None:
    email = "no-hash@example.com"
    register = _register(client, email, UserRole.PANCHAYAT)
    login = _login(client, email)
    me = client.get("/api/v1/auth/me", headers=_auth_header(login["access_token"])).json()
    for body in (register, login, me):
        assert "password_hash" not in body
        assert "password" not in str(body)
        assert "bcrypt" not in str(body)