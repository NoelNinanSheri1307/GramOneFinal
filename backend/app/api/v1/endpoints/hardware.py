"""Hardware endpoints for physical GramOne telemetry nodes.

Supports ESP32 telemetry ingestion, device status retrieval, and RFID employee attendance.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.models.device import Device, Telemetry
from app.models.enums import DeviceType, UserRole
from app.schemas.hardware import (
    DeviceStatusResponse,
    RFIDScanRequest,
    RFIDScanResponse,
    TelemetryIngest,
)
from app.services.hardware_workflow import HardwareWorkflowService

router = APIRouter(prefix="/hardware", tags=["hardware"])


@router.post("/telemetry", response_model=DeviceStatusResponse, status_code=status.HTTP_201_CREATED)
def ingest_telemetry(
    payload: TelemetryIngest,
    db: Session = Depends(get_db),
) -> DeviceStatusResponse:
    """Ingest telemetry from an ESP32 or simulated hardware node."""
    now = datetime.now(timezone.utc)

    # Find or create device
    stmt = select(Device).where(Device.device_id == payload.device_id)
    device = db.scalars(stmt).first()

    if not device:
        device = Device(
            device_id=payload.device_id,
            device_type=DeviceType.WATER_NODE,
            is_active=True,
            last_seen_at=now,
        )
        db.add(device)
        db.flush()
    else:
        device.last_seen_at = now

    # Store telemetry records for provided values
    if payload.water_level_percent is not None:
        db.add(Telemetry(device_id=device.id, sensor_type="water_level", value=payload.water_level_percent, unit="%", timestamp=now))
    if payload.battery_percent is not None:
        db.add(Telemetry(device_id=device.id, sensor_type="battery", value=payload.battery_percent, unit="%", timestamp=now))
    if payload.waste_bin_level_percent is not None:
        db.add(Telemetry(device_id=device.id, sensor_type="waste_bin_level", value=payload.waste_bin_level_percent, unit="%", timestamp=now))
    if payload.temperature is not None:
        db.add(Telemetry(device_id=device.id, sensor_type="temperature", value=payload.temperature, unit="C", timestamp=now))
    if payload.humidity is not None:
        db.add(Telemetry(device_id=device.id, sensor_type="humidity", value=payload.humidity, unit="%", timestamp=now))
    if payload.gas_anomaly:
        db.add(Telemetry(device_id=device.id, sensor_type="gas_anomaly", value=1.0, unit="alert", timestamp=now))
    if payload.emergency_pressed:
        db.add(Telemetry(device_id=device.id, sensor_type="emergency_button", value=1.0, unit="alert", timestamp=now))

    db.commit()
    db.refresh(device)

    # Evaluate deterministic thresholds and trigger Panchayat workflow if needed
    service = HardwareWorkflowService(db)
    warning_level = service.process_telemetry(device, payload)

    has_val = hasattr(device.device_type, "value")
    dtype_str = str(device.device_type.value if has_val else device.device_type)

    return DeviceStatusResponse(
        device_id=device.device_id,
        device_type=dtype_str,
        status="ONLINE" if device.is_active else "OFFLINE",
        water_level_percent=payload.water_level_percent,
        battery_percent=payload.battery_percent,
        warning_level=warning_level,
        last_seen_at=device.last_seen_at,
    )


@router.post("/rfid-scan", response_model=RFIDScanResponse)
def rfid_scan(
    payload: RFIDScanRequest,
    db: Session = Depends(get_db),
) -> RFIDScanResponse:
    """Ingest RFID card scan from ESP32 node and update employee attendance."""
    service = HardwareWorkflowService(db)
    return service.process_rfid_scan(payload)


@router.get("/devices", response_model=list[DeviceStatusResponse])
def list_devices(
    db: Session = Depends(get_db),
) -> list[DeviceStatusResponse]:
    """Retrieve all active hardware devices with their latest telemetry readings."""
    stmt = select(Device).where(Device.is_active == True).order_by(Device.updated_at.desc())  # noqa: E712
    devices = db.scalars(stmt).all()

    results: list[DeviceStatusResponse] = []
    for d in devices:
        water_stmt = (
            select(Telemetry.value)
            .where(Telemetry.device_id == d.id, Telemetry.sensor_type == "water_level")
            .order_by(Telemetry.timestamp.desc())
            .limit(1)
        )
        water_val = db.scalars(water_stmt).first()

        batt_stmt = (
            select(Telemetry.value)
            .where(Telemetry.device_id == d.id, Telemetry.sensor_type == "battery")
            .order_by(Telemetry.timestamp.desc())
            .limit(1)
        )
        batt_val = db.scalars(batt_stmt).first()

        water_percent = float(water_val) if water_val is not None else None
        battery_percent = float(batt_val) if batt_val is not None else None
        warning = "critical" if water_percent is not None and water_percent < 20.0 else "normal"
        dtype = str(d.device_type.value if hasattr(d.device_type, "value") else d.device_type)

        results.append(
            DeviceStatusResponse(
                device_id=d.device_id,
                device_type=dtype,
                status="ONLINE" if d.is_active else "OFFLINE",
                water_level_percent=water_percent,
                battery_percent=battery_percent,
                warning_level=warning,
                last_seen_at=d.last_seen_at,
            )
        )

    return results