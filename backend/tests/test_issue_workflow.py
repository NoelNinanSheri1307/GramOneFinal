"""Issue intake + evidence + impact case core workflow integration tests.

Run against the live PostgreSQL inside a rolled-back transaction (see
conftest) — nothing is persisted.
"""
from fastapi.testclient import TestClient

from app.models import Village
from app.models.enums import UserRole


def _register(client: TestClient, email: str, role: UserRole) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "Test User", "email": email, "password": "StrongPass123", "role": role.value},
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


def _create_issue(
    client: TestClient, token: str, *, category: str, village_id: int | None = None, **kwargs
) -> dict:
    payload = {
        "title": kwargs.get("title", "Test problem"),
        "description": kwargs.get("description", "Details"),
        "category": category,
        "village_id": village_id,
    }
    if "subcategory" in kwargs:
        payload["subcategory"] = kwargs["subcategory"]
    if "latitude" in kwargs and "longitude" in kwargs:
        payload["latitude"] = kwargs["latitude"]
        payload["longitude"] = kwargs["longitude"]
    response = client.post("/api/v1/issues", json=payload, headers=_auth(token))
    assert response.status_code == 201, response.text
    return response.json()


def _make_village(db_session, name: str = "Sevagram") -> Village:
    village = Village(name=name, district="Dhar", state="MP")
    db_session.add(village)
    db_session.flush()
    return village


def test_citizen_creates_water_education_civic_issues(
    client: TestClient, db_session
) -> None:
    _register(client, "c1@example.com", UserRole.CITIZEN)
    token = _token(client, "c1@example.com")
    village = _make_village(db_session)

    for category in ("water", "education", "civic"):
        issue = _create_issue(client, token, category=category, village_id=village.id)
        assert issue["category"] == category
        assert issue["status"] == "reported"
        assert issue["source"] == "citizen"
        assert issue["reference"].startswith("ISSUE-")


def test_invalid_category_rejected(client: TestClient) -> None:
    _register(client, "c2@example.com", UserRole.CITIZEN)
    token = _token(client, "c2@example.com")
    response = client.post(
        "/api/v1/issues",
        json={"title": "x", "category": "roads"},
        headers=_auth(token),
    )
    assert response.status_code == 422


def test_issue_reference_generated_by_backend(client: TestClient, db_session) -> None:
    _register(client, "c3@example.com", UserRole.CITIZEN)
    token = _token(client, "c3@example.com")
    village = _make_village(db_session)
    issue = _create_issue(client, token, category="water", village_id=village.id)
    assert issue["reference"] == f"ISSUE-{issue['id']:06d}"


def test_citizen_cannot_modify_another_users_issue(client: TestClient) -> None:
    _register(client, "owner@example.com", UserRole.CITIZEN)
    owner_token = _token(client, "owner@example.com")
    _register(client, "other@example.com", UserRole.CITIZEN)
    other_token = _token(client, "other@example.com")

    issue = _create_issue(client, owner_token, category="water")
    response = client.patch(
        f"/api/v1/issues/{issue['id']}",
        json={"title": "hacked"},
        headers=_auth(other_token),
    )
    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "unauthorized_issue_access"


def test_evidence_attached_by_authorized_user(client: TestClient, db_session) -> None:
    _register(client, "c4@example.com", UserRole.CITIZEN)
    citizen_token = _token(client, "c4@example.com")
    village = _make_village(db_session)
    issue = _create_issue(client, citizen_token, category="water", village_id=village.id)

    evidence = client.post(
        f"/api/v1/issues/{issue['id']}/evidence",
        json={
            "evidence_type": "uploaded_image",
            "source_reference": "media://dummy-key",
            "description": "Photo of dry tank",
        },
        headers=_auth(citizen_token),
    )
    assert evidence.status_code == 201
    assert evidence.json()["evidence_type"] == "uploaded_image"
    assert evidence.json()["source_reference"] == "media://dummy-key"

    detail = client.get(f"/api/v1/issues/{issue['id']}", headers=_auth(citizen_token))
    assert detail.status_code == 200
    assert detail.json()["evidence_count"] == 1


def test_unauthorized_evidence_attachment_rejected(client: TestClient, db_session) -> None:
    _register(client, "c5@example.com", UserRole.CITIZEN)
    citizen_token = _token(client, "c5@example.com")
    _register(client, "c6@example.com", UserRole.CITIZEN)
    intruder_token = _token(client, "c6@example.com")
    village = _make_village(db_session)
    issue = _create_issue(client, citizen_token, category="water", village_id=village.id)

    response = client.post(
        f"/api/v1/issues/{issue['id']}/evidence",
        json={"evidence_type": "citizen_report", "description": "intruder"},
        headers=_auth(intruder_token),
    )
    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "unauthorized_evidence_access"


def test_issue_status_transition_and_history(client: TestClient) -> None:
    _register(client, "c7@example.com", UserRole.CITIZEN)
    citizen_token = _token(client, "c7@example.com")
    _register(client, "p7@example.com", UserRole.PANCHAYAT)
    panchayat_token = _token(client, "p7@example.com")

    issue = _create_issue(client, citizen_token, category="water")
    response = client.patch(
        f"/api/v1/issues/{issue['id']}",
        json={"status": "verified", "note": "Confirmed by ward head"},
        headers=_auth(panchayat_token),
    )
    assert response.status_code == 200
    assert response.json()["status"] == "verified"

    history = client.get(f"/api/v1/issues/{issue['id']}/history", headers=_auth(panchayat_token))
    assert history.status_code == 200
    entries = history.json()
    assert [entry["new_status"] for entry in entries] == ["reported", "verified"]


def test_invalid_status_transition_rejected(client: TestClient) -> None:
    _register(client, "c8@example.com", UserRole.CITIZEN)
    citizen_token = _token(client, "c8@example.com")
    _register(client, "p8@example.com", UserRole.PANCHAYAT)
    panchayat_token = _token(client, "p8@example.com")

    issue = _create_issue(client, citizen_token, category="water")
    response = client.patch(
        f"/api/v1/issues/{issue['id']}",
        json={"status": "resolved"},
        headers=_auth(panchayat_token),
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "invalid_status_transition"


def test_issue_workflow_progresses_to_resolved(client: TestClient) -> None:
    _register(client, "c9@example.com", UserRole.CITIZEN)
    citizen_token = _token(client, "c9@example.com")
    _register(client, "p9@example.com", UserRole.PANCHAYAT)
    panchayat_token = _token(client, "p9@example.com")
    _register(client, "worker@example.com", UserRole.PANCHAYAT)
    worker_id = client.post(
        "/api/v1/auth/login", json={"email": "worker@example.com", "password": "StrongPass123"}
    ).json()["user"]["id"]

    issue = _create_issue(client, citizen_token, category="water")
    issue_id = issue["id"]
    for status in ("verified", "open", "assigned", "in_progress"):
        response = client.patch(
            f"/api/v1/issues/{issue_id}",
            json={"status": status},
            headers=_auth(panchayat_token),
        )
        assert response.status_code == 200, (status, response.text)

    assigned = client.patch(
        f"/api/v1/issues/{issue_id}",
        json={"assigned_to": worker_id},
        headers=_auth(panchayat_token),
    )
    assert assigned.status_code == 200
    assert assigned.json()["assigned_to"]["id"] == worker_id

    resolved = client.patch(
        f"/api/v1/issues/{issue_id}",
        json={"status": "resolved"},
        headers=_auth(panchayat_token),
    )
    assert resolved.status_code == 200
    assert resolved.json()["status"] == "resolved"
    assert resolved.json()["resolved_at"] is not None


def test_panchayat_creates_impact_case_from_issues(client: TestClient, db_session) -> None:
    _register(client, "c10a@example.com", UserRole.CITIZEN)
    _register(client, "c10b@example.com", UserRole.CITIZEN)
    _register(client, "p10@example.com", UserRole.PANCHAYAT)
    citizen_a = _token(client, "c10a@example.com")
    citizen_b = _token(client, "c10b@example.com")
    panchayat_token = _token(client, "p10@example.com")
    village = _make_village(db_session)

    issue_a = _create_issue(
        client, citizen_a, category="water", village_id=village.id, title="School tank empty"
    )
    issue_b = _create_issue(
        client, citizen_b, category="water", village_id=village.id, title="Students have no water"
    )

    response = client.post(
        "/api/v1/impact-cases",
        json={
            "title": "Water availability issue affecting school",
            "summary": "Two related reports about school water",
            "category": "water",
            "village_id": village.id,
            "issue_ids": [issue_a["id"], issue_b["id"]],
        },
        headers=_auth(panchayat_token),
    )
    assert response.status_code == 201, response.text
    case = response.json()
    assert case["reference"].startswith("CASE-")
    assert [entry["id"] for entry in case["issues"]] == [issue_a["id"], issue_b["id"]]
    assert case["status"] == "open"


def test_citizen_cannot_create_impact_case(client: TestClient) -> None:
    _register(client, "c11@example.com", UserRole.CITIZEN)
    citizen_token = _token(client, "c11@example.com")
    response = client.post(
        "/api/v1/impact-cases",
        json={"title": "x", "category": "water", "issue_ids": [1]},
        headers=_auth(citizen_token),
    )
    assert response.status_code == 403


def test_issues_linked_to_impact_case(client: TestClient, db_session) -> None:
    _register(client, "c12@example.com", UserRole.CITIZEN)
    citizen_token = _token(client, "c12@example.com")
    _register(client, "p12@example.com", UserRole.PANCHAYAT)
    panchayat_token = _token(client, "p12@example.com")
    village = _make_village(db_session)
    issue = _create_issue(client, citizen_token, category="civic", village_id=village.id)

    case_response = client.post(
        "/api/v1/impact-cases",
        json={
            "title": "Street light corridor",
            "category": "civic",
            "village_id": village.id,
            "issue_ids": [issue["id"]],
        },
        headers=_auth(panchayat_token),
    )
    assert case_response.status_code == 201
    case = case_response.json()

    issue_detail = client.get(f"/api/v1/issues/{issue['id']}", headers=_auth(citizen_token))
    assert issue_detail.status_code == 200
    assert issue_detail.json()["impact_case"]["id"] == case["id"]
    assert issue_detail.json()["impact_case"]["reference"] == case["reference"]

    case_detail = client.get(f"/api/v1/impact-cases/{case['id']}", headers=_auth(panchayat_token))
    assert case_detail.status_code == 200
    assert case_detail.json()["issues"][0]["id"] == issue["id"]


def test_issue_already_linked_not_silently_reassigned(
    client: TestClient, db_session
) -> None:
    _register(client, "c13@example.com", UserRole.CITIZEN)
    citizen_token = _token(client, "c13@example.com")
    _register(client, "p13@example.com", UserRole.PANCHAYAT)
    panchayat_token = _token(client, "p13@example.com")
    village = _make_village(db_session)
    issue = _create_issue(client, citizen_token, category="water", village_id=village.id)

    first = client.post(
        "/api/v1/impact-cases",
        json={"title": "Case one", "category": "water", "village_id": village.id,
              "issue_ids": [issue["id"]]},
        headers=_auth(panchayat_token),
    )
    assert first.status_code == 201

    second = client.post(
        "/api/v1/impact-cases",
        json={"title": "Case two", "category": "water", "village_id": village.id,
              "issue_ids": [issue["id"]]},
        headers=_auth(panchayat_token),
    )
    assert second.status_code == 409
    assert second.json()["detail"]["code"] == "issue_already_linked"


def test_impact_case_retrieval_and_workflow(client: TestClient, db_session) -> None:
    _register(client, "c14@example.com", UserRole.CITIZEN)
    citizen_token = _token(client, "c14@example.com")
    _register(client, "p14@example.com", UserRole.PANCHAYAT)
    panchayat_token = _token(client, "p14@example.com")
    village = _make_village(db_session)
    issue = _create_issue(client, citizen_token, category="civic", village_id=village.id)

    case_response = client.post(
        "/api/v1/impact-cases",
        json={"title": "Drainage repair", "category": "civic", "village_id": village.id,
              "issue_ids": [issue["id"]]},
        headers=_auth(panchayat_token),
    )
    assert case_response.status_code == 201
    case_id = case_response.json()["id"]

    for status in ("assigned", "in_progress", "resolved"):
        response = client.patch(
            f"/api/v1/impact-cases/{case_id}",
            json={"status": status},
            headers=_auth(panchayat_token),
        )
        assert response.status_code == 200, (status, response.text)
        assert response.json()["status"] == status

    resolved = client.get(f"/api/v1/impact-cases/{case_id}", headers=_auth(panchayat_token))
    assert resolved.status_code == 200
    assert resolved.json()["status"] == "resolved"
    assert resolved.json()["resolved_at"] is not None


def test_citizen_list_scoped_to_own_issues(client: TestClient, db_session) -> None:
    _register(client, "c15@example.com", UserRole.CITIZEN)
    token_a = _token(client, "c15@example.com")
    _register(client, "c16@example.com", UserRole.CITIZEN)
    token_b = _token(client, "c16@example.com")
    village = _make_village(db_session)

    _create_issue(client, token_a, category="water", village_id=village.id)
    _create_issue(client, token_a, category="water", village_id=village.id)
    _create_issue(client, token_b, category="water", village_id=village.id)

    list_a = client.get("/api/v1/issues", headers=_auth(token_a))
    assert list_a.status_code == 200
    assert len(list_a.json()["items"]) == 2

    list_b = client.get("/api/v1/issues", headers=_auth(token_b))
    assert list_b.status_code == 200
    assert len(list_b.json()["items"]) == 1


def test_csr_cannot_create_issue(client: TestClient) -> None:
    _register(client, "csr@example.com", UserRole.CSR)
    csr_token = _token(client, "csr@example.com")
    response = client.post(
        "/api/v1/issues",
        json={"title": "x", "category": "water"},
        headers=_auth(csr_token),
    )
    assert response.status_code == 403