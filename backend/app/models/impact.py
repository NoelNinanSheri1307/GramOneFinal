"""ImpactCase and ImpactScore: the unified problem bundle and its score.

An Impact Case is formed from multiple related Issues; the Impact Score is the
deterministic, explainable output of the future Impact Scoring Engine.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ImpactCaseStatus, IssueCategory
from app.models.types import db_enum


class ImpactCase(Base):
    __tablename__ = "impact_cases"

    id: Mapped[int] = mapped_column(primary_key=True)
    reference: Mapped[str | None] = mapped_column(String(32), unique=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    original_language: Mapped[str | None] = mapped_column(String(8))
    category: Mapped[IssueCategory] = mapped_column(
        db_enum(IssueCategory, "issue_category"), nullable=False
    )
    village_id: Mapped[int | None] = mapped_column(
        ForeignKey("villages.id", ondelete="RESTRICT"), index=True
    )
    status: Mapped[ImpactCaseStatus] = mapped_column(
        db_enum(ImpactCaseStatus, "impact_case_status"),
        nullable=False,
        default=ImpactCaseStatus.OPEN,
        server_default=text("'open'"),
        index=True,
    )
    affected_population: Mapped[int | None] = mapped_column(Integer)
    sdg: Mapped[str | None] = mapped_column(String(16))
    assigned_to: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT")
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
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    village = relationship("Village", back_populates="impact_cases")
    assignee = relationship("User", foreign_keys="ImpactCase.assigned_to")
    issues = relationship("Issue", back_populates="impact_case")
    score = relationship(
        "ImpactScore",
        back_populates="impact_case",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    projects = relationship("Project", back_populates="impact_case")
    csr_matches = relationship(
        "CSRMatch",
        back_populates="impact_case",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class ImpactScore(Base):
    __tablename__ = "impact_scores"

    id: Mapped[int] = mapped_column(primary_key=True)
    impact_case_id: Mapped[int] = mapped_column(
        ForeignKey("impact_cases.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    overall_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    severity_component: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    population_component: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    evidence_component: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    time_component: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    infrastructure_component: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    scoring_version: Mapped[str] = mapped_column(String(32), nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    impact_case = relationship("ImpactCase", back_populates="score")