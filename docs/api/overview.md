# API documentation

Base path: `/api/v1`

## Endpoints implemented (foundation)

### `GET /api/v1/health`

Liveness check.

**Response `200`**

```json
{
  "status": "healthy",
  "database": "ok",
  "version": "0.1.0"
}
```

- `status` is `healthy` whenever the process is up.
- `database` reports PostgreSQL connectivity: `ok` or `unavailable`. The app
  stays healthy even if the database is unreachable, so the endpoint is useful
  before the DB is provisioned.

## Error envelope

All API errors return a unified envelope:

```json
{
  "detail": {
    "code": "validation_error",
    "message": "Request validation failed.",
    "details": {}
  }
}
```

`code` is stable and machine-readable; `details` varies by error.

## Authentication endpoints

Base path: `/api/v1` (routers are wired in `backend/app/api/v1/router.py`).

### `POST /api/v1/auth/register`

Request:

```json
{
  "name": "Ada",
  "email": "ada@example.com",
  "password": "StrongPass123",
  "role": "citizen"
}
```

Responses: `201` with the created user (`id`, `name`, `email`, `role`,
`is_active`); `409 email_already_registered`; `422` for invalid payloads.
`password_hash` is never returned.

### `POST /api/v1/auth/login`

Request:

```json
{ "email": "ada@example.com", "password": "StrongPass123" }
```

Responses: `200` with `{access_token, token_type: "bearer", user}`; `401
invalid_credentials` (same code for wrong password or unknown email); `403
inactive_account`.

### `GET /api/v1/auth/me`

Requires `Authorization: Bearer <token>`. Returns the authenticated user. Errors:
`401 missing_token` / `401 invalid_token` / `401 token_expired` / `403
inactive_account`.

### Role-protected demo endpoints

`GET /api/v1/demo/rbac/{citizen,panchayat,csr,staff}` demonstrate the RBAC
dependencies. They are temporary verification scaffolding and must not be
treated as product endpoints.

See [docs/architecture/authentication.md](../architecture/authentication.md) for
the full JWT/RBAC design, environment variables and local auth instructions.

## Issue workflow endpoints

Base path: `/api/v1`. Authentication via `Authorization: Bearer <token>`.

### Issues

| Method | Path | Notes |
|--------|------|-------|
| POST | `/issues` | create (CITIZEN/PANCHAYAT; backend sets `source`, `reporter`, `reference`, `status=reported`) |
| GET | `/issues` | scoped listing; filters `village_id`, `category`, `status`, `source`; `limit`/`offset` |
| GET | `/issues/{id}` | issue + village/reporter/assignee/evidence count/impact case/history |
| PATCH | `/issues/{id}` | content fields + controlled `status` transitions + `assigned_to` (Panchayat) |
| POST | `/issues/{id}/evidence` | attach evidence (owner/Panchayat, role-scoped types) |
| GET | `/issues/{id}/evidence` | list evidence |
| GET | `/issues/{id}/history` | status timeline |

### Impact cases

| Method | Path | Notes |
|--------|------|-------|
| POST | `/impact-cases` | create from `issue_ids` (PANCHAYAT only; validated linking) |
| GET | `/impact-cases` | scoped listing; filters `village_id`, `category`, `status` |
| GET | `/impact-cases/{id}` | case + linked issues |
| PATCH | `/impact-cases/{id}` | controlled `status` + `assigned_to` (PANCHAYAT only) |

Full lifecycle and authorization details:
[docs/architecture/issues_workflow.md](../architecture/issues_workflow.md).

## Not implemented

Product endpoints that arrive in later milestones: AI interpretation,
evidence/correlation/impact-scoring/CSR-matching algorithms, telemetry
ingestion, notifications, and the citizens/panchayat/CSR dashboards. The `users`,
`projects`, `csr`, `hardware` and `notifications` routers remain empty
structural placeholders.