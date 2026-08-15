"""Impact Scoring Engine — deterministic, explainable priority & impact scoring.

Combines deterministic factors (severity/urgency, affected population, evidence
confidence, time unresolved, domain category) to produce a 0-100 score and an
itemized breakdown for full UI transparency.
"""
from dataclasses import dataclass
from datetime import datetime, timezone
import math
from typing import Any


@dataclass
class ImpactScoreResult:
    overall_score: float
    severity_component: float
    population_component: float
    evidence_component: float
    time_component: float
    infrastructure_component: float
    scoring_version: str = "v1.0.0"
    factors: dict[str, Any] = None


class ImpactScoringEngine:
    """Deterministic explainable impact & priority scoring engine."""

    SCORING_VERSION = "v1.0.0"

    def calculate_score(
        self,
        category: str,
        urgency: str | None = "medium",
        affected_population: int | None = 0,
        evidence_count: int = 1,
        created_at: datetime | None = None,
        is_emergency: bool = False,
    ) -> ImpactScoreResult:
        # 1. Severity component (0 - 30 pts)
        if is_emergency or category.lower() in ("disaster", "emergency"):
            severity = 30.0
        else:
            urgency_map = {"high": 25.0, "medium": 15.0, "low": 5.0}
            severity = urgency_map.get((urgency or "medium").lower(), 15.0)

        # 2. Population component (0 - 25 pts)
        pop = affected_population or 0
        if pop <= 0:
            population = 5.0
        elif pop >= 1000:
            population = 25.0
        else:
            # Logarithmic scaling between 5 and 25
            population = round(5.0 + (20.0 * (math.log10(pop) / 3.0)), 2)

        # 3. Evidence component (0 - 15 pts)
        evidence = min(15.0, max(5.0, float(evidence_count * 5.0)))

        # 4. Time component (freshness/staleness) (0 - 15 pts)
        if created_at:
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            hours_old = (datetime.now(timezone.utc) - created_at).total_seconds() / 3600.0
            time_score = min(15.0, round(hours_old * 0.25, 2))
        else:
            time_score = 0.0

        # 5. Infrastructure component (domain specific weight) (0 - 15 pts)
        infra_map = {
            "water": 15.0,
            "disaster": 15.0,
            "health": 14.0,
            "sanitation": 12.0,
            "waste": 10.0,
            "education": 10.0,
            "civic": 8.0,
            "agriculture": 8.0,
            "environment": 8.0,
            "other": 5.0,
        }
        infrastructure = infra_map.get(category.lower(), 5.0)

        overall = min(100.0, round(severity + population + evidence + time_score + infrastructure, 2))

        factors = {
            "severity_rationale": f"Base severity from urgency ('{urgency}', emergency={is_emergency})",
            "population_rationale": f"Affected population count: {pop}",
            "evidence_rationale": f"Evidence items count: {evidence_count}",
            "time_rationale": f"Unresolved duration accumulation",
            "domain_rationale": f"Domain category weight for '{category}'",
        }

        return ImpactScoreResult(
            overall_score=overall,
            severity_component=severity,
            population_component=population,
            evidence_component=evidence,
            time_component=time_score,
            infrastructure_component=infrastructure,
            scoring_version=self.SCORING_VERSION,
            factors=factors,
        )