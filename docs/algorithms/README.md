# Algorithm specifications

This directory will hold the deterministic algorithm specifications for the
intelligence engines.

## Planned specifications

| Document | Engines |
|----------|---------|
| evidence-confidence.md   | Evidence Engine |
| correlation.md           | Correlation Engine |
| impact-and-priority.md   | Impact Scoring Engine |
| csr-matching.md          | CSR Matching Engine |

## Current state

None are written yet. Engine boundaries exist in
`backend/app/services/` as honest placeholders (`NotImplementedError`), and no
algorithm is claimed as implemented.

All future algorithms share two hard requirements:

1. **Deterministic** — same inputs, same output; no LLM in the decision path.
2. **Explainable** — each score is produced with an itemised factor breakdown so
   the UI can answer "why this score/priority/match?".