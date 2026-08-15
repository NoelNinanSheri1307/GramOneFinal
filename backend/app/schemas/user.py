"""User and Employee Pydantic schemas."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.enums import UserRole


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: UserRole
    village_id: int | None = None
    rfid_card_id: str | None = None
    is_active: bool = True
    created_at: datetime


class EmployeeItem(BaseModel):
    id: int
    name: str
    email: str
    rfid_card_id: str | None = None
    assigned_issues_count: int = 0
    in_progress_issues_count: int = 0
    last_attendance_status: str = "OFFLINE"  # SIGNED_IN or OFFLINE/SIGNED_OUT
    last_signed_in_at: datetime | None = None
