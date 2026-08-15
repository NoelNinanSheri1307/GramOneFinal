"""Pydantic contracts for the Issue workflow.

API schemas are kept separate from the SQLAlchemy models; nothing sensitive
(e.g. reporter email) is exposed unless a caller is authorized to see it.
"""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import EvidenceType, IssueCategory, IssueSource, IssueStatus
from app.schemas.common import ImpactCaseBrief, LocalizedString, UserBrief, VillageBrief

SUPPORTED_CONTENT_LANGUAGES = {
    "en", "hi", "ta", "te", "kn", "ml", "bn", "mr", "gu", "pa", "or", "as", "ur"
}


class IssueCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=160)
    description: str | None = None
    category: IssueCategory
    subcategory: str | None = Field(default=None, max_length=80)
    village_id: int | None = None
    latitude: float | None = None
    longitude: float | None = None
    original_language: str = Field(
        default="en", pattern="^(en|hi|ta|te|kn|ml|bn|mr|gu|pa|or|as|ur)$"
    )

    @model_validator(mode="after")
    def _coordinates_pair(self) -> "IssueCreate":
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must be provided together")
        return self


class IssueUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = None
    category: IssueCategory | None = None
    subcategory: str | None = Field(default=None, min_length=1, max_length=80)
    latitude: float | None = None
    longitude: float | None = None
    status: IssueStatus | None = None
    assigned_to: int | None = None
    note: str | None = None


class IssueHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    previous_status: IssueStatus | None
    new_status: IssueStatus
    changed_by: int | None
    note: LocalizedString | str | None
    created_at: datetime


class EvidenceCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    evidence_type: EvidenceType
    source_reference: str | None = Field(default=None, max_length=255)
    description: str | None = None


class EvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    issue_id: int
    evidence_type: EvidenceType
    source_reference: str | None
    description: LocalizedString | str | None
    created_at: datetime


class IssueResponse(BaseModel):
    id: int
    reference: str | None
    title: LocalizedString | str
    description: LocalizedString | str | None
    category: IssueCategory
    subcategory: str | None
    source: IssueSource
    status: IssueStatus
    latitude: float | None
    longitude: float | None
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None
    village: VillageBrief | None
    reporter: UserBrief | None
    assigned_to: UserBrief | None
    evidence_count: int
    impact_case: ImpactCaseBrief | None
    history: list[IssueHistoryResponse]
    original_language: str | None = None


class IssueListResponse(BaseModel):
    items: list[IssueResponse]
    total: int
    limit: int
    offset: int