"""Tests that the foundation boundaries exist and are honest placeholders."""
import asyncio

import pytest

from app.services.ai import AIProvider, get_ai_provider
from app.services.ai.contracts import IssueInterpretation
from app.services.correlation import CorrelationEngine
from app.services.evidence import EvidenceEngine, EvidenceInput
from app.services.impact import ImpactScoreResult, ImpactScoringEngine
from app.services.matching import CSRMatchEngine


def test_ai_provider_factory_returns_a_provider() -> None:
    provider = get_ai_provider()
    assert isinstance(provider, AIProvider)
    assert provider.name == "unconfigured"


def test_unconfigured_ai_provider_raises_not_implemented() -> None:
    provider = get_ai_provider()
    with pytest.raises(NotImplementedError):
        asyncio.run(provider.interpret_issue("sample report"))


def test_engines_are_honest_placeholders() -> None:
    with pytest.raises(NotImplementedError):
        EvidenceEngine().assess(EvidenceInput(issue_id="x"))
    with pytest.raises(NotImplementedError):
        CorrelationEngine().correlate([])
    with pytest.raises(NotImplementedError):
        CSRMatchEngine().match({}, [])


def test_impact_engine_exposes_public_scoring_interface() -> None:
    engine = ImpactScoringEngine()
    result = engine.calculate_score(category="water")
    assert isinstance(result, ImpactScoreResult)
    assert isinstance(result.overall_score, float)
    assert isinstance(result.severity_component, float)
    assert isinstance(result.population_component, float)
    assert isinstance(result.evidence_component, float)
    assert isinstance(result.time_component, float)
    assert isinstance(result.infrastructure_component, float)


def test_impact_score_is_deterministic() -> None:
    engine = ImpactScoringEngine()
    kwargs = dict(
        category="water",
        urgency="high",
        affected_population=340,
        evidence_count=3,
        is_emergency=False,
    )
    first = engine.calculate_score(**kwargs)
    second = engine.calculate_score(**kwargs)
    assert first.overall_score == second.overall_score
    assert first.severity_component == second.severity_component
    assert first.population_component == second.population_component
    assert first.evidence_component == second.evidence_component
    assert first.time_component == second.time_component
    assert first.infrastructure_component == second.infrastructure_component
    assert first.factors == second.factors


def test_impact_score_stays_within_documented_range() -> None:
    engine = ImpactScoringEngine()
    samples = [
        dict(category="water"),
        dict(category="water", urgency="high", affected_population=5000, evidence_count=20, is_emergency=True),
        dict(category="other", urgency="low", affected_population=0, evidence_count=0),
        dict(category="disaster", urgency="low", affected_population=1, evidence_count=1, is_emergency=True),
        dict(category="health", urgency="medium", affected_population=1000, evidence_count=5),
    ]
    for kwargs in samples:
        result = engine.calculate_score(**kwargs)
        assert 0.0 <= result.overall_score <= 100.0


def test_impact_score_returns_factor_breakdown_and_reasons() -> None:
    engine = ImpactScoringEngine()
    result = engine.calculate_score(
        category="water",
        urgency="high",
        affected_population=340,
        evidence_count=3,
    )
    assert isinstance(result.factors, dict)
    assert result.factors.get("severity_rationale")
    assert result.factors.get("population_rationale")
    assert result.factors.get("evidence_rationale")
    assert result.factors.get("time_rationale")
    assert result.factors.get("domain_rationale")


def test_ai_layer_is_not_responsible_for_numerical_scoring() -> None:
    assert not hasattr(ImpactScoringEngine, "score")
    score_field_names = [
        name
        for name in IssueInterpretation.model_fields
        if "score" in name or "priority" in name or "impact" in name
    ]
    assert score_field_names == []
