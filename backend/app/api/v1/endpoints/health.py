"""GET /api/v1/health

Returns service health. The application reports ``healthy`` whenever the
process is up; the PostgreSQL connectivity is reported independently so the
endpoint stays useful (and testable) before the database is provisioned.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app import APP_VERSION
from app.db.session import get_db
from app.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)) -> HealthResponse:
    database_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception:  # pragma: no cover - depends on environment
        database_status = "unavailable"
    return HealthResponse(status="healthy", database=database_status, version=APP_VERSION)