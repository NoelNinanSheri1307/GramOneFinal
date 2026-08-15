"""Pytest configuration.

Sets environment variables before the application is imported so tests are
deterministic: the app must never touch a real PostgreSQL during the test run,
and JWTs are signed with a test-only secret.

Shared DB fixtures run tests inside a single database transaction against the
real PostgreSQL from the repository `.env`, rolled back afterwards so nothing
is persisted. Tests that do not require a database stay fully DB-free.
"""
import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import NullPool

os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg2://test:test@127.0.0.1:1/gramone")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("AI_PROVIDER", "unconfigured")
os.environ.setdefault("OPENROUTER_API_KEY", "")

from app.db.session import get_db  # noqa: E402
from app.main import app  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[2]


def _load_real_database_url() -> str | None:
    env_path = REPO_ROOT / ".env"
    if not env_path.exists():
        return None
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("DATABASE_URL="):
            value = line[len("DATABASE_URL="):].strip()
            return value.strip('"').strip("'")
    return None


REAL_DATABASE_URL = _load_real_database_url()


@pytest.fixture()
def db_session():
    """A Session that runs inside a rolled-back transaction on the real DB."""
    if REAL_DATABASE_URL is None:
        pytest.skip("DATABASE_URL not found in repository .env")
    engine = create_engine(REAL_DATABASE_URL, poolclass=NullPool)
    try:
        connection = engine.connect()
    except Exception as exc:  # pragma: no cover - environment dependent
        engine.dispose()
        pytest.skip(f"live PostgreSQL unavailable: {exc}")

    transaction = connection.begin()
    session = Session(
        bind=connection,
        join_transaction_mode="create_savepoint",
        expire_on_commit=False,
    )

    def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db
    yield session
    app.dependency_overrides.clear()
    transaction.rollback()
    session.close()
    connection.close()
    engine.dispose()


@pytest.fixture()
def client(db_session):
    with TestClient(app) as test_client:
        yield test_client