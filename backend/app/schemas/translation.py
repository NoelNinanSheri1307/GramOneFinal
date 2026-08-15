"""Pydantic contracts for the translation endpoints."""
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

EntityType = Literal[
    "issue",
    "impact_case",
    "evidence",
    "history",
    "village",
    "scheme",
    "community_notice",
    "safety_resource",
]


class TranslationStoreRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    entity_type: EntityType
    entity_id: int
    field_name: str = Field(max_length=40)
    source_language: str = Field(min_length=2, max_length=8)
    translations: dict[str, str]


class TranslationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    entity_type: EntityType
    entity_id: int
    field_name: str = Field(max_length=40)
    target_language: str = Field(min_length=2, max_length=8)
    source_language: str | None = Field(default=None, min_length=2, max_length=8)


class TranslationBatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    requests: list[TranslationRequest] = Field(min_length=1, max_length=60)


class TranslationResult(BaseModel):
    entity_type: EntityType
    entity_id: int
    field_name: str
    target_language: str
    translated_text: str | None


class TranslationBatchResponse(BaseModel):
    results: list[TranslationResult]