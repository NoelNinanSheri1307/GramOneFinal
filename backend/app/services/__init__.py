"""Deterministic GramOne service engines and the AI abstraction.

Four independent deterministic engines:
- Evidence Engine      -> evidence confidence
- Correlation Engine   -> issue correlation
- Impact Scoring Engine-> impact score / priority
- CSR Matching Engine  -> CSR match scoring

plus the provider-agnostic AI service (language understanding only).

Engines are independent of the AI service and never delegate numerical
decisions to it. See docs/architecture/engine_separation.md.
"""