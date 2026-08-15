"""Pydantic contracts for the CSR workflow.

Cover the CSR organization profile, the opportunity view of an Impact Case
(with its explainable impact score), deterministic CSR matching, and the
Sponsorship lifecycle. No payment/financial functionality is modelled here.
"""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ImpactCaseStatus, IssueCategory, ProjectStatus, SponsorshipStatus
from app.schemas.common import LocalizedString, UserBrief, VillageBrief


class CSRProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    org_name: str
    contact_name: str | None = None
    contact_email: str | None = None
    description: str | None = None
    focus_areas: list[str] = []
    preferred_sdgs: list[str] = []
    preferred_support_types: list[str] = []
    preferred_domains: list[str] = []
    preferred_state: str | None = None
    preferred_districts: list[str] = []
    min_budget: float | None = None
    max_budget: float | None = None


class CSRProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    org_name: str | None = Field(default=None, min_length=1, max_length=160)
    contact_name: str | None = Field(default=None, max_length=120)
    contact_email: str | None = Field(default=None, max_length=255)
    description: str | None = None
    focus_areas: list[str] | None = None
    preferred_sdgs: list[str] | None = None
    preferred_support_types: list[str] | None = None
    preferred_domains: list[str] | None = None
    preferred_state: str | None = Field(default=None, max_length=80)
    preferred_districts: list[str] | None = None
    min_budget: float | None = Field(default=None, ge=0)
    max_budget: float | None = Field(default=None, ge=0)


class ImpactScoreBreakdown(BaseModel):
    overall_score: float
    severity_component: float
    population_component: float
    evidence_component: float
    time_component: float
    infrastructure_component: float
    rationale: dict = {}


class ProjectBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None = None
    status: ProjectStatus
    estimated_budget: float | None = None
    village: VillageBrief | None = None
    completed_at: datetime | None = None
    sponsorship_status: SponsorshipStatus | None = None


class OpportunityItem(BaseModel):
    """An Impact Case surfaced to CSR as a sponsorship opportunity."""

    model_config = ConfigDict(extra="forbid")

    id: int
    reference: str | None
    title: LocalizedString | str
    summary: LocalizedString | str | None
    category: IssueCategory
    village: VillageBrief | None
    status: ImpactCaseStatus
    affected_population: int | None
    sdg: str | None
    assigned_to: UserBrief | None
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None
    evidence_count: int = 0
    impact_score: ImpactScoreBreakdown | None
    matched_score: float | None = None
    match_reasons: list = []
    projects: list[ProjectBrief] = []
    sponsored: bool = False
    original_language: str | None = None


class OpportunityListResponse(BaseModel):
    items: list[OpportunityItem]
    total: int
    limit: int
    offset: int


class SponsorshipCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    project_id: int
    amount: float | None = Field(default=None, ge=0)
    support_type: str | None = Field(default=None, max_length=40)
    note: str | None = Field(default=None, max_length=400)


class SponsorshipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    amount: float | None
    support_type: str | None = None
    status: SponsorshipStatus
    created_at: datetime
    updated_at: datetime
    project: ProjectBrief | None = None
    impact_case_id: int | None = None


class SponsorshipListResponse(BaseModel):
    items: list[SponsorshipResponse]
    total: int
    limit: int
    offset: int


class ProjectUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: ProjectStatus | None = None
    note: str | None = None


class SponsorshipStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: SponsorshipStatus
    note: str | None = None