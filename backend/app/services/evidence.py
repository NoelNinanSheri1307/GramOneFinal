"""Evidence Engine — boundary (not implemented).

Deterministic aggregation of everything that supports an issue: citizen
reports, telemetry from hardware devices, photos/media, and user verifications.

Responsibilities (shape for the evidence milestone):
- Collect and normalise evidence records for an issue.
- Compute evidence **confidence** from deterministic rules (source type,
  corroboration count, telemetry thresholds, media presence, freshness).
- Express confidence as an explainable breakdown (which inputs contributed
  how much) so the UI can show *why* a confidence value was produced.

Ownership boundary:
- Inputs may come from the AI service, but the confidence value itself is
  computed here with fixed rules — never reported by a model.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from app.services.ai.contracts import IssueInterpretation


@dataclass(frozen=True)
class EvidenceInput:
    issue_id: str
    ai_interpretation: IssueInterpretation | None = None
    telemetry_readings: list[dict] = field(default_factory=list)
    reports: list[dict] = field(default_factory=list)
    media_count: int = 0


class EvidenceEngine:
    """Placeholder boundary for the Evidence Engine.

    ``assess`` with every parameter set to ``None`` forces a decision-free,
    typesafe surface to implement later. It raises until the real algorithm is
    defined in the evidence milestone.
    """

    def assess(self, evidence: EvidenceInput) -> dict:
        raise NotImplementedError(
            "Evidence Engine is a boundary placeholder; implement confidence aggregation."
        )