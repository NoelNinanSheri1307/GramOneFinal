"""CSR workflow integration tests.

Cover CSR profile, opportunity discovery, deterministic matching, sponsorship
creation, Panchayat sponsorship control, and notifications. Runs inside a
rolled-back transaction against the live PostgreSQL (see conftest).
"""
from fastapi.testclient import TestClient

from app.models import Village
from app.models.enums import UserRole


def _register(client: TestClient, email: str, role: UserRole) -> dict:
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "Test User", "email": email, "password": "StrongPass123", "role": role.value},
    )
    assert response.status_code == 201, response.text
    return response.json()


def _token(client: TestClient, email: str) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "StrongPass123"},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _make_village(db_session, name: str = "Sevagram") -> Village:
    village = Village(name=name, district="Dhar", state="MP")
    db_session.add(village)
    db_session.flush()
    return village


def _make_impact_case_with_project(
    client: TestClient, db_session, *, panchayat_token: str, village: Village, title: str = "Case"
) -> dict:
    _register(client, "proj-citizen@example.com", UserRole.CITIZEN)
    citizen_token = _token(client, "proj-citizen@example.com")
    issue = client.post(
        "/api/v1/issues",
        json={"title": "Related issue", "category": "water", "village_id": village.id},
        headers=_auth(citizen_token),
    )
    assert issue.status_code == 201, issue.text

    unique_title = title if title != "Case" else f"Case {id(object())}"
    case = client.post(
        "/api/v1/impact-cases",
        json={"title": unique_title, "category": "water", "village_id": village.id,
              "issue_ids": [issue.json()["id"]]},
        headers=_auth(panchayat_token),
    )
    assert case.status_code == 201, case.text
    case_data = case.json()
    case_data["_unique_title"] = unique_title
    return case_data


def test_csr_profile_get_and_update(client: TestClient, db_session) -> None:
    _register(client, "csr-profile@example.com", UserRole.CSR)
    token = _token(client, "csr-profile@example.com")

    missing = client.get("/api/v1/csr/me", headers=_auth(token))
    assert missing.status_code == 404
    assert missing.json()["detail"]["code"] == "csr_profile_not_found"

    updated = client.patch(
        "/api/v1/csr/me",
        json={
            "org_name": "GreenBridge Corp",
            "focus_areas": ["water", "education"],
            "preferred_sdgs": ["6"],
            "preferred_state": "MP",
            "preferred_districts": ["Dhar"],
            "min_budget": 100000,
            "max_budget": 1000000,
        },
        headers=_auth(token),
    )
    assert updated.status_code == 200, updated.text
    body = updated.json()
    assert body["org_name"] == "GreenBridge Corp"
    assert body["focus_areas"] == ["water", "education"]
    assert body["preferred_sdgs"] == ["6"]

    fetched = client.get("/api/v1/csr/me", headers=_auth(token))
    assert fetched.status_code == 200
    assert fetched.json()["org_name"] == "GreenBridge Corp"


def test_csr_opportunities_listed(client: TestClient, db_session) -> None:
    _register(client, "p-opp@example.com", UserRole.PANCHAYAT)
    panchayat_token = _token(client, "p-opp@example.com")
    _register(client, "csr-opp@example.com", UserRole.CSR)
    csr_token = _token(client, "csr-opp@example.com")
    village = _make_village(db_session)
    case = _make_impact_case_with_project(client, db_session, panchayat_token=panchayat_token, village=village)

    response = client.get(
        f"/api/v1/csr/opportunities?q={case['_unique_title']}", headers=_auth(csr_token)
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["total"] == 1
    item = body["items"][0]
    assert item["category"] == "water"
    assert item["impact_score"]["overall_score"] > 0
    assert item["village"]["district"] == "Dhar"


def test_csr_matches_deterministic(client: TestClient, db_session) -> None:
    _register(client, "p-match@example.com", UserRole.PANCHAYAT)
    panchayat_token = _token(client, "p-match@example.com")
    _register(client, "csr-match@example.com", UserRole.CSR)
    csr_token = _token(client, "csr-match@example.com")
    village = _make_village(db_session)
    case = _make_impact_case_with_project(client, db_session, panchayat_token=panchayat_token, village=village)

    client.patch(
        "/api/v1/csr/me",
        json={"focus_areas": ["water"], "preferred_state": "MP"},
        headers=_auth(csr_token),
    )
    response = client.get("/api/v1/csr/matches", headers=_auth(csr_token))
    assert response.status_code == 200, response.text
    items = response.json()["items"]
    matched = [item for item in items if item["reference"] == case["reference"]]
    assert len(matched) == 1
    assert matched[0]["matched_score"] is not None
    assert matched[0]["matched_score"] > 50
    assert len(matched[0]["match_reasons"]) > 0


def test_sponsorship_flow_and_panchayat_control(client: TestClient, db_session) -> None:
    _register(client, "p-spo@example.com", UserRole.PANCHAYAT)
    panchayat_token = _token(client, "p-spo@example.com")
    _register(client, "csr-spo@example.com", UserRole.CSR)
    csr_token = _token(client, "csr-spo@example.com")
    village = _make_village(db_session)
    case = _make_impact_case_with_project(
        client, db_session, panchayat_token=panchayat_token, village=village
    )

    # CSR sets up a profile before sponsoring.
    client.patch(
        "/api/v1/csr/me",
        json={"focus_areas": ["water"]},
        headers=_auth(csr_token),
    )

    # Sponsorship requires a project; create one for the case (project placeholder).
    project_response = client.post(
        "/api/v1/projects",
        json={
            "name": "Water pipeline repair",
            "description": "Replace burst pipeline",
            "impact_case_id": case["id"],
            "village_id": village.id,
            "estimated_budget": 500000,
        },
        headers=_auth(panchayat_token),
    )
    assert project_response.status_code == 201, project_response.text
    project = project_response.json()

    create = client.post(
        "/api/v1/csr/sponsorships",
        json={"project_id": project["id"], "amount": 500000, "note": "Funding commitment"},
        headers=_auth(csr_token),
    )
    assert create.status_code == 201, create.text
    sponsorship = create.json()
    assert sponsorship["status"] == "pending"

    # Duplicate creates are rejected.
    dup = client.post(
        "/api/v1/csr/sponsorships",
        json={"project_id": project["id"], "amount": 100000},
        headers=_auth(csr_token),
    )
    assert dup.status_code == 409

    # Listing shows the sponsorship.
    listing = client.get("/api/v1/csr/sponsorships", headers=_auth(csr_token))
    assert listing.status_code == 200
    assert listing.json()["total"] == 1

    # CSR cannot confirm their own sponsorship; Panchayat drives lifecycle.
    forbidden = client.patch(
        f"/api/v1/csr/sponsorships/{sponsorship['id']}/status",
        json={"status": "confirmed"},
        headers=_auth(csr_token),
    )
    assert forbidden.status_code == 403

    confirmed = client.patch(
        f"/api/v1/csr/sponsorships/{sponsorship['id']}/status",
        json={"status": "confirmed"},
        headers=_auth(panchayat_token),
    )
    assert confirmed.status_code == 200, confirmed.text
    assert confirmed.json()["status"] == "confirmed"

    active = client.patch(
        f"/api/v1/csr/sponsorships/{sponsorship['id']}/status",
        json={"status": "active"},
        headers=_auth(panchayat_token),
    )
    assert active.status_code == 200
    assert active.json()["status"] == "active"

    completed = client.patch(
        f"/api/v1/csr/sponsorships/{sponsorship['id']}/status",
        json={"status": "completed"},
        headers=_auth(panchayat_token),
    )
    assert completed.status_code == 200
    assert completed.json()["status"] == "completed"

    # Supported projects list reflects the sponsorship.
    projects = client.get("/api/v1/csr/projects", headers=_auth(csr_token))
    assert projects.status_code == 200
    assert projects.json()["total"] == 1


def test_csr_notifications(client: TestClient, db_session) -> None:
    _register(client, "p-notif@example.com", UserRole.PANCHAYAT)
    panchayat_token = _token(client, "p-notif@example.com")
    _register(client, "csr-notif@example.com", UserRole.CSR)
    csr_token = _token(client, "csr-notif@example.com")
    village = _make_village(db_session)
    case = _make_impact_case_with_project(
        client, db_session, panchayat_token=panchayat_token, village=village
    )
    client.patch("/api/v1/csr/me", json={"focus_areas": ["water"]}, headers=_auth(csr_token))

    project = client.post(
        "/api/v1/projects",
        json={"name": "P", "impact_case_id": case["id"], "village_id": village.id},
        headers=_auth(panchayat_token),
    ).json()

    client.post(
        "/api/v1/csr/sponsorships",
        json={"project_id": project["id"]},
        headers=_auth(csr_token),
    )

    notifications = client.get("/api/v1/csr/notifications", headers=_auth(csr_token))
    assert notifications.status_code == 200
    items = notifications.json()["items"]
    assert len(items) >= 1
    assert items[0]["type"] == "sponsorship_update"
    assert items[0]["is_read"] is False

    mark = client.post(f"/api/v1/csr/notifications/{items[0]['id']}/read", headers=_auth(csr_token))
    assert mark.status_code == 200

    after = client.get("/api/v1/csr/notifications", headers=_auth(csr_token)).json()["items"]
    assert any(item["id"] == items[0]["id"] and item["is_read"] for item in after)


def test_non_csr_cannot_access_csr_endpoints(client: TestClient) -> None:
    _register(client, "citizen-block@example.com", UserRole.CITIZEN)
    token = _token(client, "citizen-block@example.com")

    for path in ("/api/v1/csr/me", "/api/v1/csr/opportunities", "/api/v1/csr/matches"):
        response = client.get(path, headers=_auth(token))
        assert response.status_code == 403

    response = client.post(
        "/api/v1/csr/sponsorships", json={"project_id": 1, "amount": 100}, headers=_auth(token)
    )
    assert response.status_code == 403