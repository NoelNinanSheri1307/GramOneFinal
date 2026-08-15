"""Validated structured data returned by the AI service.

The AI service returns these Pydantic contracts rather than raw text/nested
dicts so downstream deterministic engines can rely on a stable, strict shape.

AI values are SUGGESTIONS: they never decide impact scores, priority, funding,
CSR matching, issue verification or truthfulness. Those belong to deterministic
GramOne engines and human/Panchayat workflows.
"""
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import IssueCategory
from app.services.ai.prompts import PROMPT_VERSION


class UrgencyLevel(str, Enum):
    """Model-suggested urgency. A suggestion only, never the final priority."""

    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class InterpretationConfidence(str, Enum):
    """Model interpretation uncertainty. NOT factual confidence."""

    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class EvidenceCandidate(BaseModel):
    """A report statement the model flags as potentially supporting an Issue.

    AI interpretation is not evidence verification; converting these into real
    Evidence records goes through the existing evidence workflow.
    """

    description: str


class Suggestion(BaseModel):
    value: str
    reason: str = Field(default="", description="Why the AI suggested this, for explainability")


class IssueInterpretation(BaseModel):
    """Strict, validated interpretation of a natural-language issue report.

    ``summary`` is the extracted title. It may be either plain text (as produced
    by the AI model) or a ``{language: text}`` map of pre-translated variants
    supplied by the client (used by the demo seed and the reporting flow). The
    original submitted content, its language and optional localized variants are
    carried alongside so the backend can store them without overwriting anything.
    """

    model_config = ConfigDict(extra="forbid")

    category: IssueCategory
    subcategory: str | None = None
    summary: str | dict[str, str]
    affected_entity: str | None = None
    location_clues: list[str] = Field(default_factory=list)
    duration_hint: str | None = None
    urgency_suggestion: UrgencyLevel | None = None
    affected_population: int | None = Field(
        default=None, ge=0, description="Only when the report states an explicit number."
    )
    suggested_sdg: str | None = None
    evidence_candidates: list[EvidenceCandidate] = Field(default_factory=list)
    missing_information: list[str] = Field(default_factory=list)
    explicit_facts: list[str] = Field(default_factory=list)
    inferences: list[str] = Field(default_factory=list)
    confidence: InterpretationConfidence
    interpretation_version: str = PROMPT_VERSION
    original_language: str = "en"
    description: str | None = Field(
        default=None,
        max_length=2000,
        description="Original natural-language report text, stored verbatim.",
    )
    localized_description: dict[str, str] | None = None