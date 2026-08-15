# GramOne architecture

## System diagram

```
Web (React+TS)     Mobile (Flutter)     Hardware (ESP32 water-node)
        \                |                      /
         --------------- | --------------------
                         ↓
                  FastAPI (modular monolith)
                        /  \
                       /    \
             PostgreSQL      AI Service (LLM abstraction)
                 (primary DB)    (language understanding only)
                 |
   ┌─────────────┼───────────────┐
   ↓             ↓               ↓
Evidence    Correlation    Impact Scoring
 Engine        Engine           Engine        CSR Matching Engine
   |             |                |                   |
   └─────────────┴────────────────┴──────┬────────────┘
                                         ↓
                 Deterministic business rules & explainable scores
```

## Layers

| Layer | Owns |
|-------|------|
| Clients (web/mobile/hardware) | Rendering, UX, input capture, display of explanations. No GramOne business rules. |
| FastAPI backend | All business logic: authz, evidence confidence, correlation, impact/priority scoring, CSR matching, issue state transitions, telemetry ingestion. |
| PostgreSQL | Primary application storage. |
| AI service | Language tasks only: classification, structured extraction, summarization, SDG/stakeholder suggestions. |

## The two decision authorities

```
AI (language understanding)         Deterministic engines (authority)
---------------------------------   ---------------------------------
- classify issue category          - evidence confidence
- extract structured facts         - impact score
- summarize reports                - priority
- suggest SDGs                     - CSR matching
- suggest stakeholders             - hardware thresholds
                                    - issue state transitions
```

AI output is **suggested, validated structure**. Numerical/state decisions are
made only by deterministic backend logic, and every such decision must be
explainable (an itemised breakdown the UI can render).

## One backend for every client

The website, the mobile app and the ESP32 all talk to the same FastAPI service.
This keeps a single source of truth for GramOne rules and avoids duplicating
business logic in React, Flutter or firmware.

## Backend module map

```
app/
├── api/         versioned HTTP layer (/api/v1) + shared dependencies
├── core/        settings, error handling, logging
├── models/      SQLAlchemy models + domain enums
├── schemas/     Pydantic request/response contracts
└── services/    AI abstraction + Evidence/Correlation/Impact/Matching engines
```

See [engine_separation.md](engine_separation.md) and
[data_model.md](data_model.md).