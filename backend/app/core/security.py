"""Password hashing and JWT tokens for GramOne authentication.

Hashing uses bcrypt; tokens are signed HS256 JWTs with an expiry whose secret,
algorithm and lifetime come from application settings (never hardcoded).
"""
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import get_settings
from app.models.user import User


def hash_password(password: str) -> str:
    """Return a bcrypt hash string for ``password``."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Return True when ``password`` matches the bcrypt ``password_hash``."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user: User) -> str:
    """Create a signed HS256 JWT access token for ``user``."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "role": user.role.value,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_access_token_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Decode and verify ``token``.

    Raises ``jwt.ExpiredSignatureError`` when expired and ``jwt.InvalidTokenError``
    for any other invalid-token condition, so callers control the HTTP response.
    """
    settings = get_settings()
    return jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
        options={"require": ["exp", "sub"]},
    )