"""Health endpoint tests."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_healthy() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "healthy"
    assert payload["version"] == "0.1.0"
    assert payload["database"] in {"ok", "unavailable"}

def test_health_reports_database_unavailable_without_db() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["database"] == "unavailable"