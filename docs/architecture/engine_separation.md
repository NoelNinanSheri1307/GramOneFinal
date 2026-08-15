# Engine separation: AI vs deterministic engines

GramOne deliberately splits decisions into two authorities. This doc records the
boundary so future engines never blur it.

## Principle

> **AI is not the authority for numerical or state decisions.**

| Concern | Authority |
|---------|-----------|
| Issue classification | AI suggests category + confidence |
| Structured extraction | AI extracts; deterministic layer validates |
| Summarization | AI |
| Suggested SDGs | AI suggestion |
| Suggested stakeholders | AI suggestion, CSR match validated deterministically |
| Evidence confidence | **Deterministic Evidence Engine** |
| Correlation strength | **Deterministic Correlation Engine** |
| Impact score & priority | **Deterministic Impact Scoring Engine** |
| CSR match score | **Deterministic CSR Matching Engine** |
| Hardware thresholds | **Deterministic backend rules** |
| Issue state transitions | **Deterministic backend rules** |

## Why

- A language model cannot be trusted with numbers that drive public
  infrastructure decisions or CSR money.
- Every score must be explainable to the UI ("why this priority?") — LLMs are
  not reliable sources of that explanation.
- Deterministic rules are testable, versionable and configurable.

## Engine contracts (currently boundaries only)

| Boundary | Future responsibility | Module |
|----------|----------------------|--------|
| Evidence Engine | Aggregate reports/telemetry/media; compute explainable confidence | `backend/app/services/evidence.py` |
| Correlation Engine | Match multiple records to one underlying problem | `backend/app/services/correlation.py` |
| Impact Scoring Engine | Score impact + priority with breakdown | `backend/app/services/impact.py` |
| CSR Matching Engine | Score partner-fit with reason breakdown | `backend/app/services/matching.py` |
| AI service | Language tasks; validated structured outputs | `backend/app/services/ai/` |

All four engines are implemented as honest placeholders (they raise
`NotImplementedError`) — no algorithms are claimed as done.

## Enablement rule

An AI provider only ever returns validated structured data
(`app/services/ai/contracts.py`). It is plugged in via configuration
(`AI_PROVIDER`), never hard-coded to a single vendor.