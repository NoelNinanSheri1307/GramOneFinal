"""User endpoints for profile, employee management, and attendance."""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_any_role
from app.db.session import get_db
from app.models import Attendance, Issue, User
from app.models.enums import IssueStatus, UserRole
from pydantic import BaseModel
from app.schemas.hardware import AttendanceResponse
from app.schemas.user import EmployeeItem, UserProfileResponse

router = APIRouter(prefix="/users", tags=["users"])


class UserProfileUpdate(BaseModel):
    name: str | None = None
    email: str | None = None


@router.get("/me", response_model=UserProfileResponse)
def get_me(user: User = Depends(get_current_user)) -> UserProfileResponse:
    """Retrieve current authenticated user profile."""
    return UserProfileResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        village_id=user.village_id,
        rfid_card_id=user.rfid_card_id,
        is_active=user.is_active,
        created_at=user.created_at,
    )


@router.patch("/me", response_model=UserProfileResponse)
def update_me(
    payload: UserProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserProfileResponse:
    if payload.name is not None:
        user.name = payload.name
    if payload.email is not None:
        user.email = payload.email
    db.commit()
    db.refresh(user)
    return UserProfileResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        village_id=user.village_id,
        rfid_card_id=user.rfid_card_id,
        is_active=user.is_active,
        created_at=user.created_at,
    )


@router.get("/employees", response_model=list[EmployeeItem])
def list_panchayat_employees(
    user: User = Depends(require_any_role(UserRole.PANCHAYAT, UserRole.PANCHAYAT_EMPLOYEE)),
    db: Session = Depends(get_db),
) -> list[EmployeeItem]:
    """List field employees in the Panchayat jurisdiction with workload & attendance status."""
    stmt = select(User).where(
        User.role == UserRole.PANCHAYAT_EMPLOYEE,
        User.is_active == True,  # noqa: E712
    )
    if user.village_id is not None:
        stmt = stmt.where(User.village_id == user.village_id)

    employees = db.scalars(stmt).all()
    items: list[EmployeeItem] = []

    for emp in employees:
        assigned_count = db.scalar(
            select(func.count()).where(Issue.assigned_to == emp.id, Issue.status != IssueStatus.RESOLVED)
        ) or 0
        in_progress_count = db.scalar(
            select(func.count()).where(Issue.assigned_to == emp.id, Issue.status == IssueStatus.IN_PROGRESS)
        ) or 0

        latest_att = db.scalars(
            select(Attendance).where(Attendance.user_id == emp.id).order_by(Attendance.sign_in_time.desc())
        ).first()

        status_str = "SIGNED_IN" if latest_att and latest_att.sign_out_time is None else "OFFLINE"
        last_time = latest_att.sign_in_time if latest_att else None

        items.append(
            EmployeeItem(
                id=emp.id,
                name=emp.name,
                email=emp.email,
                rfid_card_id=emp.rfid_card_id,
                assigned_issues_count=assigned_count,
                in_progress_issues_count=in_progress_count,
                last_attendance_status=status_str,
                last_signed_in_at=last_time,
            )
        )

    return items


@router.get("/attendance", response_model=list[AttendanceResponse])
def get_attendance_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AttendanceResponse]:
    """Retrieve attendance records for authenticated employee or Panchayat Admin."""
    stmt = select(Attendance)
    if user.role == UserRole.PANCHAYAT_EMPLOYEE:
        stmt = stmt.where(Attendance.user_id == user.id)
    elif user.role == UserRole.PANCHAYAT and user.village_id is not None:
        stmt = stmt.where(Attendance.village_id == user.village_id)

    rows = db.scalars(stmt.order_by(Attendance.sign_in_time.desc()).limit(100)).all()
    results: list[AttendanceResponse] = []
    for r in rows:
        results.append(
            AttendanceResponse(
                id=r.id,
                user_id=r.user_id,
                user_name=r.user.name if r.user else "Employee",
                rfid_card_id=r.rfid_card_id,
                village_id=r.village_id,
                sign_in_time=r.sign_in_time,
                sign_out_time=r.sign_out_time,
            )
        )
    return results