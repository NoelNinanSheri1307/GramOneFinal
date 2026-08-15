"""CSR Matching Engine — boundary (not implemented).

Deterministic matching of impact-carrying issues / projects to CSR partners.

Responsibilities (shape for the matching milestone):
- Score a CSR partner against an Impact Case using deterministic, configurable
  criteria: CSRProfile focus areas (SDG overlap), village/tehsil presence,
  past sponsorship history, funding appetite vs cost estimate.
- Produce a match score with a reason breakdown for explainability.
- Assist the "suggested stakeholder" feature, but the final CSR recommendation
  is deterministic backend logic rather than an LLM suggestion.
"""


class CSRMatchResult:
    """Placeholder result shape for a CSR match. Expanded in the matching milestone."""


class CSRMatchEngine:
    """Placeholder boundary for the CSR Matching Engine."""

    def match(self, impact_case: dict, profiles: list[dict]) -> list[dict]:
        raise NotImplementedError(
            "CSR Matching Engine is a boundary placeholder; implement matching."
        )