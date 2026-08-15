"""Correlation Engine — boundary (not implemented).

Deterministic detection that several reports/events describe the same
underlying problem (e.g. three villages reporting the same failed borewell, or
repeated telemetry threshold breaches at one device).

Responsibilities (shape for the correlation milestone):
- Match reports to issues by structured attributes (village/panchayat,
  device, object, category, time window).
- Produce a correlation score with the matching evidence shown for
  explainability.
- Never rely on an LLM's "guess" for whether two records are the same problem.

Ownership boundary: correlation scores are backend-deterministic.
"""


class CorrelationEngine:
    """Placeholder boundary for the Correlation Engine."""

    def correlate(self, candidates: list[dict]) -> list[dict]:
        raise NotImplementedError(
            "Correlation Engine is a boundary placeholder; implement match scoring."
        )