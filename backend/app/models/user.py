"""User: authenticated GramOne actors (citizen, panchayat, csr)."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import UserRole
from app.models.types import db_enum


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        db_enum(UserRole, "user_role"), nullable=False, default=UserRole.CITIZEN
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )
    village_id: Mapped[int | None] = mapped_column(
        ForeignKey("villages.id", ondelete="RESTRICT")
    )
    rfid_card_id: Mapped[str | None] = mapped_column(
        String(64), unique=True, nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    village = relationship("Village", back_populates="users")
    reported_issues = relationship(
        "Issue", foreign_keys="Issue.reported_by", back_populates="reporter"
    )
    notifications = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )
    issue_history_entries = relationship("IssueHistory", back_populates="changed_by_user")
    csr_profiles = relationship("CSRProfile", back_populates="user")
    attendances = relationship("Attendance", back_populates="user", cascade="all, delete-orphan")