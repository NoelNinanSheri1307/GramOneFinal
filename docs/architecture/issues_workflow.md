# Issue intake, evidence & impact case workflow

The first vertical slice of GramOne: a citizen problem becomes an Issue, gains
Evidence, is verified/aggregated, is grouped into an Impact Case by a Panchayat
user, and progresses to resolution. Pure backend — the web/mobile UIs consume
this API later.

## The flow

```
Citizen / Panchayat
        ↓  POST /api/v1/issues            (backend sets source + reporter)
     Issue (REPORTED)
        ↓  evidence                       (POST /issues/{id}/evidence)
     Evidence
        ↓  verification + status PATCH    (Panchayat, controlled transitions)
     VERIFIED → OPEN → ASSIGNED → IN_PROGRESS → RESOLVED
        ↓  POST /api/v1/impact-cases      (Panchayat chooses related Issues)
     Impact Case (OPEN)
        ↓                                 (PATCH …/impact-cases/{id})
     ASSIGNED → IN_PROGRESS → RESOLVED
```

## Issue lifecycle

Issues are created in `REPORTED` state. Status changes are validated against an
explicit transition map (`app/services/workflow.py`):

```
REPORTED → VERIFIED
VERIFIED → OPEN | ASSIGNED
OPEN → ASSIGNED
ASSIGNED → IN_PROGRESS
IN_PROGRESS → RESOLVED
RESOLVED → (terminal)
```

- Every status change writes an `IssueHistory` record (previous, new, actor,
  note). The initial `REPORTED` event is recorded at creation.
- Reaching `RESOLVED` stamps `resolved_at`.
- Invalid transitions return `invalid_status_transition` (400). `IMPACT_VERIFIED`
  is **not** reachable yet — impact verification is a later milestone.

### Endpoints

| Method | Path | Who |
|--------|------|-----|
| POST | `/api/v1/issues` | CITIZEN, PANCHAYAT (CSR blocked) |
| GET | `/api/v1/issues` | scoped listing (below) |
| GET | `/api/v1/issues/{id}` | scoped read |
| PATCH | `/api/v1/issues/{id}` | owner / Panchayat |
| POST | `/api/v1/issues/{id}/evidence` | owner / Panchayat |
| GET | `/api/v1/issues/{id}/evidence` | scoped read |
| GET | `/api/v1/issues/{id}/history` | scoped read |

Create request fields: `title`, `description`, `category` (water/education/civic/
other), `subcategory`, `village_id`, `latitude`+`longitude` (a pair). The client
cannot set `source`, `status` or `reported_by` — the backend assigns source
(CITIZEN or PANCHAYAT by actor), starts status at REPORTED and links the actor.

### Listing & filters

`GET /api/v1/issues` supports `village_id`, `category`, `status`, `source`,
`limit` (max 100, default 20) and `offset`. Authorization scopes the result:

- **citizen**: only issues they reported.
- **panchayat**: issues in their own village, unassigned (no-village) issues,
  and issues they reported; a panchayat with no village sees everything.
- **csr**: read access to all issues (no modification) — visibility will be
  refined by the CSR matching milestone.

## Evidence lifecycle

`POST /issues/{id}/evidence` attaches an evidence record. Types use the existing
`EvidenceType` enum. Image/photo evidence stores **metadata/reference only**
(`source_reference`) — no file storage is built yet. Attachable types are
role-scoped:

| Role | Attachable evidence types |
|------|---------------------------|
| citizen | `citizen_report`, `uploaded_image`, `related_issue` |
| panchayat | `citizen_report`, `panchayat_verification`, `uploaded_image`, `related_issue` |
| csr | none |

`hardware_telemetry` and `multiple_citizen_reports` are reserved for the future
hardware pipeline and evidence engine — not attachable here. Evidence confidence
is **not** stored; the future Evidence Engine computes it deterministically from
these raw records.

## Impact Case lifecycle

Impact Cases are formed **manually and deterministically**: a Panchayat user
selects one or more existing Issues and the service validates them.

- All referenced Issues must exist (`issue_not_found`).
- They must share the same category as the case (`invalid_impact_case`).
- They must agree on a village (the case inherits it if not provided).
- None may already belong to another case (`issue_already_linked`, 409).
- Issues are then linked (`issues.impact_case_id = case.id`).

Case status transitions (extended native enum, values `assigned`, `in_progress`
added):

```
OPEN → ASSIGNED → IN_PROGRESS → RESOLVED
```

`RESOLVED` stamps `resolved_at`. `PRIORITIZED`, `SPONSORED` and
`IMPACT_VERIFIED` are defined in the enum but unused by this workflow — they
arrive with scoring/CSR/later milestones.

### Endpoints

| Method | Path | Who |
|--------|------|-----|
| POST | `/api/v1/impact-cases` | PANCHAYAT only |
| GET | `/api/v1/impact-cases` | PANCHAYAT (scoped), CSR (read) — citizen denied |
| GET | `/api/v1/impact-cases/{id}` | PANCHAYAT (scoped), CSR (read) |
| PATCH | `/api/v1/impact-cases/{id}` | PANCHAYAT only |

## Panchayat assignment

Issues and Impact Cases carry an optional `assigned_to` (FK → `users`).
Assignment is restricted to Panchayat actors and the assignee must be an active
`panchayat` user. This is schema-backed (migration `e457a57f8afe`), not an
ad-hoc mechanism.

## Authorization rules (summary)

- The backend is authoritative; role scope is enforced in
  `app/services/*.py`.
- Panchayat jurisdiction = the user's `village_id`; a Panchayat user without a
  village has platform-wide scope. This is a **documented limitation** until a
  real jurisdiction model exists.
- Citizens can read/create evidence only on their own issues and cannot change
  workflow fields (`status`, `assigned_to`).
- CSR cannot create issues, modify issues, attach evidence, or modify citizen
  evidence.

## Issue vs Impact Case

An **Issue** is one problem report (one observation, one reporter). An
**Impact Case** is the concluded, scored, stakeholder-facing bundle built from
related Issues. Splitting them keeps raw reports immutable and lets grouping be
re-run (or re-done) without destroying the source data.

## Current vs future correlation

**Current (implemented):** Impact Cases are created **manually** by Panchayat
users choosing Issues. `POST /api/v1/impact-cases` performs strict validation
and linking.

**Future (not implemented):** automatic issue correlation via the Correlation
Engine. This milestone makes **no** claim that correlation is automatic or
AI-driven; the deterministic matching/aggregation is the Correlation Engine
milestone.

## Error codes added

`issue_not_found`, `invalid_issue_data`, `unauthorized_issue_access`,
`invalid_status_transition`, `unauthorized_evidence_access`,
`impact_case_not_found`, `invalid_impact_case`, `issue_already_linked`,
`unauthorized_impact_case_action` — all in the standard GramOne error envelope.

## Database changes (this milestone)

Migration `e457a57f8afe`:
- added `issues.assigned_to` and `impact_cases.assigned_to` (FK → users,
  `ON DELETE RESTRICT`) — required for Panchayat assignment;
- extended native enum `impact_case_status` with `assigned` and `in_progress` —
  required for the case lifecycle.

Applied via `alembic upgrade head`; no manual DDL.