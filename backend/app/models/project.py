"""Project, CSRProfile, CSRMatch and Sponsorship: the funding/stakeholder side."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    JSON,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ProjectStatus, SponsorshipStatus
from app.models.types import db_enum


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    impact_case_id: Mapped[int] = mapped_column(
        ForeignKey("impact_cases.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    village_id: Mapped[int] = mapped_column(
        ForeignKey("villages.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    estimated_budget: Mapped[float | None] = mapped_column(Numeric(14, 2))
    status: Mapped[ProjectStatus] = mapped_column(
        db_enum(ProjectStatus, "project_status"),
        nullable=False,
        default=ProjectStatus.CREATED,
        server_default=text("'created'"),
        index=True,
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
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    impact_case = relationship("ImpactCase", back_populates="projects")
    village = relationship("Village", back_populates="projects")
    csr_matches = relationship(
        "CSRMatch",
        back_populates="project",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    sponsorships = relationship("Sponsorship", back_populates="project")


class CSRProfile(Base):
    __tablename__ = "csr_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), unique=True
    )
    org_name: Mapped[str] = mapped_column(String(160), nullable=False)
    contact_name: Mapped[str | None] = mapped_column(String(120))
    contact_email: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    focus_areas: Mapped[list[str] | None] = mapped_column(JSON().with_variant(ARRAY(String(20)), "postgresql"))
    preferred_sdgs: Mapped[list[str] | None] = mapped_column(JSON().with_variant(ARRAY(String(16)), "postgresql"))
    preferred_support_types: Mapped[list[str] | None] = mapped_column(JSON().with_variant(ARRAY(String(40)), "postgresql"))
    preferred_domains: Mapped[list[str] | None] = mapped_column(JSON().with_variant(ARRAY(String(40)), "postgresql"))
    preferred_state: Mapped[str | None] = mapped_column(String(80))
    preferred_districts: Mapped[list[str] | None] = mapped_column(JSON().with_variant(ARRAY(String(80)), "postgresql"))
    min_budget: Mapped[float | None] = mapped_column(Numeric(14, 2))
    max_budget: Mapped[float | None] = mapped_column(Numeric(14, 2))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    user = relationship("User", back_populates="csr_profiles")
    csr_matches = relationship(
        "CSRMatch",
        back_populates="csr_profile",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    sponsorships = relationship("Sponsorship", back_populates="csr_profile")


class CSRMatch(Base):
    __tablename__ = "csr_matches"
    __table_args__ = (
        CheckConstraint(
            "impact_case_id IS NOT NULL OR project_id IS NOT NULL",
            name="csr_matches_target_check",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    csr_profile_id: Mapped[int] = mapped_column(
        ForeignKey("csr_profiles.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    impact_case_id: Mapped[int | None] = mapped_column(
        ForeignKey("impact_cases.id", ondelete="CASCADE"), index=True
    )
    project_id: Mapped[int | None] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    match_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    scoring_version: Mapped[str] = mapped_column(String(32), nullable=False)
    match_reasons: Mapped[list | None] = mapped_column(JSON().with_variant(JSONB, "postgresql"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    csr_profile = relationship("CSRProfile", back_populates="csr_matches")
    impact_case = relationship("ImpactCase", back_populates="csr_matches")
    project = relationship("Project", back_populates="csr_matches")


class Sponsorship(Base):
    __tablename__ = "sponsorships"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    csr_profile_id: Mapped[int] = mapped_column(
        ForeignKey("csr_profiles.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    amount: Mapped[float | None] = mapped_column(Numeric(14, 2))
    support_type: Mapped[str | None] = mapped_column(String(40))
    status: Mapped[SponsorshipStatus] = mapped_column(
        db_enum(SponsorshipStatus, "sponsorship_status"),
        nullable=False,
        default=SponsorshipStatus.PENDING,
        server_default=text("'pending'"),
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

    project = relationship("Project", back_populates="sponsorships")
    csr_profile = relationship("CSRProfile", back_populates="sponsorships")