"""Pydantic contracts for the Impact Case workflow."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ImpactCaseStatus, IssueCategory
from app.schemas.common import IssueBrief, LocalizedString, UserBrief, VillageBrief


class ImpactCaseCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=160)
    summary: str | None = None
    category: IssueCategory
    village_id: int | None = None
    issue_ids: list[int] = Field(min_length=1)
    affected_population: int | None = Field(default=None, ge=0)
    sdg: str | None = Field(default=None, max_length=16)
    original_language: str = Field(
        default="en", pattern="^(en|hi|ta|te|kn|ml|bn|mr|gu|pa|or|as|ur)$"
    )


class ImpactCaseUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=160)
    summary: str | None = None
    affected_population: int | None = Field(default=None, ge=0)
    sdg: str | None = Field(default=None, max_length=16)
    status: ImpactCaseStatus | None = None
    assigned_to: int | None = None
    note: str | None = None


class ImpactCaseResponse(BaseModel):
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
    issues: list[IssueBrief]
    original_language: str | None = None


class ImpactCaseListResponse(BaseModel):
    items: list[ImpactCaseResponse]
    total: int
    limit: int
    offset: int