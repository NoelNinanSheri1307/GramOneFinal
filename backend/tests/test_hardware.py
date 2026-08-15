"""Hardware telemetry endpoint tests."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_ingest_telemetry_normal_level(db_session) -> None:
    payload = {
        "device_id": "TEST-WATER-NODE-001",
        "water_level_percent": 85.5,
        "battery_percent": 95.0,
    }
    response = client.post("/api/v1/hardware/telemetry", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["device_id"] == "TEST-WATER-NODE-001"
    assert data["status"] == "ONLINE"
    assert data["water_level_percent"] == 85.5
    assert data["battery_percent"] == 95.0
    assert data["warning_level"] == "normal"
    assert data["last_seen_at"] is not None


def test_ingest_telemetry_critical_level(db_session) -> None:
    payload = {
        "device_id": "TEST-WATER-NODE-002",
        "water_level_percent": 14.2,
        "battery_percent": 88.0,
    }
    response = client.post("/api/v1/hardware/telemetry", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["device_id"] == "TEST-WATER-NODE-002"
    assert data["water_level_percent"] == 14.2
    assert data["warning_level"] == "critical"


def test_list_hardware_devices(db_session) -> None:
    # First ingest a telemetry reading
    client.post(
        "/api/v1/hardware/telemetry",
        json={
            "device_id": "TEST-WATER-NODE-003",
            "water_level_percent": 18.0,
            "battery_percent": 90.0,
        },
    )

    response = client.get("/api/v1/hardware/devices")
    assert response.status_code == 200
    devices = response.json()
    assert isinstance(devices, list)
    found = [d for d in devices if d["device_id"] == "TEST-WATER-NODE-003"]
    assert len(found) > 0
    assert found[0]["warning_level"] == "critical"
