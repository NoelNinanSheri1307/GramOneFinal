"""Pydantic contracts for the Community Information & Safety layer.

Request models are strict (``extra="forbid"``) so arbitrary fields cannot be
smuggled through management endpoints. Response fields that hold
user-generated content use ``str | LocalizedString`` to carry cached
translations alongside the original text.
"""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import (
    NoticeSource,
    NoticeType,
    PublishStatus,
    SafetyResourceType,
    SafetySection,
    SchemeCategory,
    SchemeStatus,
)
from app.schemas.common import LocalizedString, VillageBrief


# --------------------------------------------------------------------------- #
# Schemes
# --------------------------------------------------------------------------- #
class SchemeCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category: SchemeCategory = SchemeCategory.OTHER
    title: str = Field(min_length=1, max_length=200)
    short_description: str = Field(min_length=1)
    detailed_description: str | None = None
    eligibility: str | None = None
    benefits: str | None = None
    required_documents: str | None = None
    application_instructions: str | None = None
    official_url: str | None = Field(default=None, max_length=500)
    deadline: datetime | None = None
    state: str | None = Field(default=None, max_length=120)
    district: str | None = Field(default=None, max_length=120)
    village_id: int | None = None
    target_groups: str | None = Field(default=None, max_length=255)
    status: SchemeStatus = SchemeStatus.DRAFT
    original_language: str = Field(default="en", min_length=2, max_length=8)


class SchemeUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category: SchemeCategory | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    short_description: str | None = None
    detailed_description: str | None = None
    eligibility: str | None = None
    benefits: str | None = None
    required_documents: str | None = None
    application_instructions: str | None = None
    official_url: str | None = Field(default=None, max_length=500)
    deadline: datetime | None = None
    state: str | None = Field(default=None, max_length=120)
    district: str | None = Field(default=None, max_length=120)
    village_id: int | None = None
    target_groups: str | None = Field(default=None, max_length=255)
    status: SchemeStatus | None = None
    original_language: str | None = Field(default=None, min_length=2, max_length=8)


class SchemeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: SchemeCategory
    title: str | LocalizedString
    short_description: str | LocalizedString
    detailed_description: str | LocalizedString | None
    eligibility: str | LocalizedString | None
    benefits: str | LocalizedString | None
    required_documents: str | None
    application_instructions: str | LocalizedString | None
    official_url: str | None
    deadline: datetime | None
    state: str | None
    district: str | None
    village: VillageBrief | None
    target_groups: str | None
    status: SchemeStatus
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime
    original_language: str


class SchemeListResponse(BaseModel):
    items: list[SchemeResponse]
    total: int
    limit: int
    offset: int


# --------------------------------------------------------------------------- #
# Community notices / local news
# --------------------------------------------------------------------------- #
class NoticeCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    notice_type: NoticeType = NoticeType.ANNOUNCEMENT
    source_type: NoticeSource = NoticeSource.PANCHAYAT
    title: str = Field(min_length=1, max_length=200)
    summary: str | None = None
    content: str | None = None
    category: str | None = Field(default=None, max_length=80)
    is_featured: bool = False
    state: str | None = Field(default=None, max_length=120)
    district: str | None = Field(default=None, max_length=120)
    village_id: int | None = None
    status: PublishStatus = PublishStatus.DRAFT
    expires_at: datetime | None = None
    original_language: str = Field(default="en", min_length=2, max_length=8)


class NoticeUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    notice_type: NoticeType | None = None
    source_type: NoticeSource | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    summary: str | None = None
    content: str | None = None
    category: str | None = Field(default=None, max_length=80)
    is_featured: bool | None = None
    state: str | None = Field(default=None, max_length=120)
    district: str | None = Field(default=None, max_length=120)
    village_id: int | None = None
    status: PublishStatus | None = None
    expires_at: datetime | None = None
    original_language: str | None = Field(default=None, min_length=2, max_length=8)


class NoticeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    notice_type: NoticeType
    source_type: NoticeSource
    title: str | LocalizedString
    summary: str | LocalizedString | None
    content: str | LocalizedString | None
    category: str | None
    is_featured: bool
    state: str | None
    district: str | None
    village: VillageBrief | None
    status: PublishStatus
    published_at: datetime | None
    expires_at: datetime | None
    created_at: datetime
    updated_at: datetime
    original_language: str


class NoticeListResponse(BaseModel):
    items: list[NoticeResponse]
    total: int
    limit: int
    offset: int


# --------------------------------------------------------------------------- #
# Safety resources
# --------------------------------------------------------------------------- #
class SafetyResourceCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    section: SafetySection = SafetySection.COMMUNITY_SAFETY
    resource_type: SafetyResourceType = SafetyResourceType.ARTICLE
    title: str = Field(min_length=1, max_length=200)
    summary: str | None = None
    content: str | None = None
    external_url: str | None = Field(default=None, max_length=500)
    contact_label: str | None = Field(default=None, max_length=120)
    contact_phone: str | None = Field(default=None, max_length=40)
    is_featured: bool = False
    state: str | None = Field(default=None, max_length=120)
    district: str | None = Field(default=None, max_length=120)
    village_id: int | None = None
    status: PublishStatus = PublishStatus.DRAFT
    expires_at: datetime | None = None
    original_language: str = Field(default="en", min_length=2, max_length=8)


class SafetyResourceUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    section: SafetySection | None = None
    resource_type: SafetyResourceType | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    summary: str | None = None
    content: str | None = None
    external_url: str | None = Field(default=None, max_length=500)
    contact_label: str | None = Field(default=None, max_length=120)
    contact_phone: str | None = Field(default=None, max_length=40)
    is_featured: bool | None = None
    state: str | None = Field(default=None, max_length=120)
    district: str | None = Field(default=None, max_length=120)
    village_id: int | None = None
    status: PublishStatus | None = None
    expires_at: datetime | None = None
    original_language: str | None = Field(default=None, min_length=2, max_length=8)


class SafetyResourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    section: SafetySection
    resource_type: SafetyResourceType
    title: str | LocalizedString
    summary: str | LocalizedString | None
    content: str | LocalizedString | None
    external_url: str | None
    contact_label: str | None
    contact_phone: str | None
    is_featured: bool
    state: str | None
    district: str | None
    village: VillageBrief | None
    status: PublishStatus
    published_at: datetime | None
    expires_at: datetime | None
    created_at: datetime
    updated_at: datetime
    original_language: str


class SafetyResourceListResponse(BaseModel):
    items: list[SafetyResourceResponse]
    total: int
    limit: int
    offset: int
