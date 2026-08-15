"""Shared authorization/scope helpers for workflow services.

A Panchayat user's jurisdiction is their associated village. The schema has no
sophisticated jurisdiction model yet, so the current scope is: the user's own
village, or everything when the user has no village assigned. Documented as a
known limitation.
"""
from sqlalchemy.orm import Session

from app.core.errors import GramOneError
from app.models import User
from app.models.enums import UserRole


def panchayat_in_scope(user: User, village_id: int | None) -> bool:
    """Return True when ``user`` (a panchayat) may act on ``village_id``."""
    if user.village_id is None:
        return True
    return village_id is None or village_id == user.village_id


def resolve_assignee(db: Session, user_id: int, error_code: str) -> User:
    """Return an active Panchayat admin/employee ``user_id`` or raise a validation error."""
    user = db.get(User, user_id)
    if (
        user is None
        or user.role not in (UserRole.PANCHAYAT, UserRole.PANCHAYAT_EMPLOYEE)
        or not user.is_active
    ):
        raise GramOneError(
            code=error_code,
            message="Assignee must be an active Panchayat officer or employee.",
            status_code=400,
        )
    return user