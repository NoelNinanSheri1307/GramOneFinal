"""Pydantic contracts for hardware nodes and telemetry ingestion."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TelemetryIngest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    device_id: str = Field(min_length=1, max_length=64)
    water_level_percent: float | None = Field(default=None, ge=0.0, le=100.0)
    battery_percent: float | None = Field(default=100.0, ge=0.0, le=100.0)
    waste_bin_level_percent: float | None = Field(default=None, ge=0.0, le=100.0)
    gas_anomaly: bool | None = Field(default=False)
    emergency_pressed: bool | None = Field(default=False)
    temperature: float | None = Field(default=None)
    humidity: float | None = Field(default=None)


class DeviceStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    device_id: str
    device_type: str = "water_node"
    status: str = "ONLINE"
    water_level_percent: float | None = None
    battery_percent: float | None = None
    warning_level: str = "normal"
    last_seen_at: datetime | None = None


class RFIDScanRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    rfid_card_id: str = Field(min_length=1, max_length=64)
    device_id: str | None = Field(default=None, max_length=64)


class RFIDScanResponse(BaseModel):
    user_id: int
    user_name: str
    rfid_card_id: str
    status: str  # "SIGNED_IN" or "SIGNED_OUT"
    message: str
    timestamp: datetime


class AttendanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    user_name: str
    rfid_card_id: str
    village_id: int | None
    sign_in_time: datetime
    sign_out_time: datetime | None
