import logging
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from ..core.config import get_settings
from .base import Base
import app.models  # Ensure all models are registered

logger = logging.getLogger(__name__)
_settings = get_settings()

def _init_engine():
    try:
        db_url = _settings.database_url
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+psycopg2://"):
            db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

        eng = create_engine(db_url, pool_pre_ping=True)
        with eng.connect() as conn:
            pass
        return eng
    except Exception as e:
        logger.warning(f"PostgreSQL connection failed ({e}). Falling back to local SQLite database.")
        eng = create_engine(
            "sqlite:///./gramone_local.db",
            connect_args={"check_same_thread": False},
        )
        Base.metadata.create_all(bind=eng)
        _seed_default_users(eng)
        return eng

def _seed_default_users(eng):
    from sqlalchemy.orm import sessionmaker
    from app.models import User
    from app.models.enums import UserRole
    from app.core.security import hash_password

    Session = sessionmaker(bind=eng)
    db = Session()
    try:
        defaults = [
            ("Admin User", "admin@gmail.com", UserRole.PANCHAYAT),
            ("Panchayat Admin", "admin@gramone.gov.in", UserRole.PANCHAYAT),
            ("Citizen User", "citizen@gramone.gov.in", UserRole.CITIZEN),
            ("CSR Sponsor", "csr@gramone.gov.in", UserRole.CSR),
            ("Field Worker", "worker@gramone.gov.in", UserRole.PANCHAYAT_EMPLOYEE),
        ]
        h_pass = hash_password("Admin1234#")
        for name, email, role in defaults:
            if not db.query(User).filter(User.email == email).first():
                db.add(User(name=name, email=email, password_hash=h_pass, role=role, is_active=True))
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()

engine = _init_engine()
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()