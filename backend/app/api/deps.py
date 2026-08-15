"""Shared FastAPI dependencies for authentication and role-based access control.

The backend is authoritative for authorization: role checks run here, never in
frontend route guards.
"""
from collections.abc import Callable

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.errors import GramOneError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import User
from app.models.enums import UserRole

_bearer_scheme = HTTPBearer(auto_error=False)


def _get_bearer_token(
    credentials: HTTPAuthorizationCredentials | None,
) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise GramOneError(
            code="missing_token",
            message="Authentication required.",
            status_code=401,
        )
    return credentials.credentials


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the authenticated User from the Bearer token (or raise)."""
    token = _get_bearer_token(credentials)
    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise GramOneError(
            code="token_expired",
            message="Access token has expired. Sign in again.",
            status_code=401,
        ) from None
    except jwt.InvalidTokenError:
        raise GramOneError(
            code="invalid_token",
            message="Invalid access token.",
            status_code=401,
        ) from None

    subject = payload.get("sub")
    if subject is None or not subject.isdigit():
        raise GramOneError(
            code="invalid_token",
            message="Invalid access token.",
            status_code=401,
        )

    user = db.get(User, int(subject))
    if user is None:
        raise GramOneError(
            code="invalid_token",
            message="Invalid access token.",
            status_code=401,
        )
    if not user.is_active:
        raise GramOneError(
            code="inactive_account",
            message="This account is inactive.",
            status_code=403,
        )
    return user


require_authenticated_user: Callable = get_current_user


def _require_roles(*roles: UserRole) -> Callable:
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise GramOneError(
                code="insufficient_permissions",
                message="You do not have permission to access this resource.",
                status_code=403,
            )
        return user

    return dependency


def require_role(role: UserRole) -> Callable:
    """Return a dependency that only admits the single ``role``."""
    return _require_roles(role)


def require_any_role(*roles: UserRole) -> Callable:
    """Return a dependency that admits any of the given ``roles``."""
    return _require_roles(*roles)