"""POST /api/v1/auth/register, /login and GET /api/v1/auth/me.

Only the identity foundation is implemented: no email verification, password
reset, refresh tokens or social login.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import require_authenticated_user
from app.core.errors import GramOneError
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


def _normalize_email(email: str) -> str:
    return email.strip().lower()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> User:
    email = _normalize_email(payload.email)
    existing = db.scalar(select(User).where(User.email == email))
    if existing is not None:
        raise GramOneError(
            code="email_already_registered",
            message="An account with this email already exists.",
            status_code=status.HTTP_409_CONFLICT,
        )

    user = User(
        name=payload.name,
        email=email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=True,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise GramOneError(
            code="email_already_registered",
            message="An account with this email already exists.",
            status_code=status.HTTP_409_CONFLICT,
        ) from None
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    email = _normalize_email(payload.email)
    user = db.scalar(select(User).where(User.email == email))

    if user is None or not verify_password(payload.password, user.password_hash):
        raise GramOneError(
            code="invalid_credentials",
            message="Invalid email or password.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
    if not user.is_active:
        raise GramOneError(
            code="inactive_account",
            message="This account is inactive.",
            status_code=status.HTTP_403_FORBIDDEN,
        )

    return TokenResponse(
        access_token=create_access_token(user),
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(require_authenticated_user)) -> User:
    return user