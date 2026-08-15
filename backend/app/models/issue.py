"""Issue, IssueEvidence and IssueHistory: the central problem-report cluster.

Water, education and civic problems all use the same Issue model; category is
an attribute, not a table per domain.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import EvidenceType, IssueCategory, IssueSource, IssueStatus
from app.models.types import db_enum


class Issue(Base):
    __tablename__ = "issues"

    id: Mapped[int] = mapped_column(primary_key=True)
    reference: Mapped[str | None] = mapped_column(String(32), unique=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    original_language: Mapped[str | None] = mapped_column(String(8))
    category: Mapped[IssueCategory] = mapped_column(
        db_enum(IssueCategory, "issue_category"), nullable=False, index=True
    )
    subcategory: Mapped[str | None] = mapped_column(String(80))
    source: Mapped[IssueSource] = mapped_column(
        db_enum(IssueSource, "issue_source"), nullable=False
    )
    status: Mapped[IssueStatus] = mapped_column(
        db_enum(IssueStatus, "issue_status"),
        nullable=False,
        default=IssueStatus.REPORTED,
        server_default=text("'reported'"),
        index=True,
    )
    reported_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT")
    )
    assigned_to: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT")
    )
    village_id: Mapped[int | None] = mapped_column(
        ForeignKey("villages.id", ondelete="RESTRICT"), index=True
    )
    impact_case_id: Mapped[int | None] = mapped_column(
        ForeignKey("impact_cases.id", ondelete="SET NULL"), index=True
    )
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    village = relationship("Village", back_populates="issues")
    reporter = relationship(
        "User", foreign_keys="Issue.reported_by", back_populates="reported_issues"
    )
    assignee = relationship("User", foreign_keys="Issue.assigned_to")
    impact_case = relationship("ImpactCase", back_populates="issues")
    evidence = relationship(
        "IssueEvidence", back_populates="issue", cascade="all, delete-orphan", passive_deletes=True
    )
    history = relationship(
        "IssueHistory", back_populates="issue", cascade="all, delete-orphan", passive_deletes=True
    )


class IssueEvidence(Base):
    __tablename__ = "issue_evidence"

    id: Mapped[int] = mapped_column(primary_key=True)
    issue_id: Mapped[int] = mapped_column(
        ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True
    )
    evidence_type: Mapped[EvidenceType] = mapped_column(
        db_enum(EvidenceType, "evidence_type"), nullable=False
    )
    source_reference: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    issue = relationship("Issue", back_populates="evidence")


class IssueHistory(Base):
    __tablename__ = "issue_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    issue_id: Mapped[int] = mapped_column(
        ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True
    )
    previous_status: Mapped[IssueStatus | None] = mapped_column(
        db_enum(IssueStatus, "issue_status")
    )
    new_status: Mapped[IssueStatus] = mapped_column(
        db_enum(IssueStatus, "issue_status"), nullable=False
    )
    changed_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT")
    )
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    issue = relationship("Issue", back_populates="history")
    changed_by_user = relationship("User", back_populates="issue_history_entries")