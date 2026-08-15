"""Pydantic contracts for the AI issue interpretation endpoints."""
from pydantic import BaseModel, ConfigDict, Field


class InterpretRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str = Field(min_length=1, max_length=2000, description="Natural-language report text.")
    language: str | None = Field(
        default=None,
        max_length=8,
        description="Target language code for AI interpretation output (e.g. hi, ta, ur).",
    )