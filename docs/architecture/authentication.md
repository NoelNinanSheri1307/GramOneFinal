# Authentication & authorization (RBAC)

Self-contained identity for GramOne. There is **no external identity provider**:
passwords are hashed with bcrypt and sessions use signed JWT access tokens. The
backend is the sole authority for authorization; frontend route guards are never
security.

## Implemented (this milestone)

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- Reusable RBAC dependencies (below)
- Temporary RBAC verification endpoints under `/api/v1/demo/rbac/*`
- Minimal web client transport (`web/src/lib/api.ts`, `web/src/lib/auth.ts`);
  no UI.

**Not implemented:** email verification, password reset, refresh tokens, social
login, account management endpoints.

## Roles

Defined in `backend/app/models/enums.py` (`UserRole`), reused by the `users.role`
column (native PostgreSQL enum):

| Role      | Meaning                                       |
|-----------|-----------------------------------------------|
| `citizen` | Reports problems, receives notifications.      |
| `panchayat`| Village administration; verifies/acts on issues. |
| `csr`     | Corporate partner linked to a `CSRProfile`.    |

Roles are exclusive — `require_role` enforces exact membership, so CSR does not
inherit Panchayat permissions and vice versa.

## Authentication flow

1. **Register** — client sends `name`, `email`, `password`, `role`. Email is
   normalized (trim + lowercase) and validated; a duplicate raises
   `email_already_registered` (409). The password is bcrypt-hashed and the
   `password_hash` is never returned by any endpoint.
2. **Login** — credentials checked against the stored hash. Success returns
   `{access_token, token_type: "bearer", user}`; the same generic
   `invalid_credentials` (401) is returned for a wrong password or an unknown
   email so responses do not leak which one was wrong. Inactive accounts get
   `inactive_account` (403).
3. **Authenticated requests** — client sends `Authorization: Bearer <token>`.

## JWT flow

- Tokens are signed **HS256** with `JWT_SECRET_KEY` and carry `sub` (user id),
  `role`, `iat` and `exp`.
- Expiry: `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` (default 30).
- `GET /auth/me` and every protected endpoint decode + verify the token, load
  the user, and reject missing/expired/invalid tokens or inactive users.

### Environment variables

Add these to the repository-root `.env` (documented in `.env.example`):

| Variable                         | Meaning                              |
|----------------------------------|--------------------------------------|
| `JWT_SECRET_KEY`                 | Required signing secret. Backend fails fast to start without it (outside `ENVIRONMENT=test`). |
| `JWT_ALGORITHM`                  | Signing algorithm (default `HS256`). |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`| Access token lifetime (default 30).   |

Generate a secret locally, e.g.:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

Never commit a real value.

## RBAC dependencies

`backend/app/api/deps.py` provides the shared guardrails:

| Dependency              | Effect |
|-------------------------|--------|
| `get_current_user`      | Resolves the authenticated `User` or raises 401/403. |
| `require_authenticated_user` | Alias: any signed-in user. |
| `require_role(role)`    | Only the exact role may proceed. |
| `require_any_role(*roles)` | Any listed role may proceed. |

Usage:

```python
router.get("/panchayat-only", dependencies=[Depends(require_role(UserRole.PANCHAYAT))])
# or
def handler(user: User = Depends(require_role(UserRole.PANCHAYAT))): ...
```

## Error codes

All authentication errors use the standard GramOne envelope
(`{"detail": {"code", "message", "details"}}`):

| Code                       | HTTP | Meaning |
|----------------------------|------|---------|
| `missing_token`            | 401  | No/incorrect Bearer header. |
| `invalid_token`            | 401  | Malformed, tampered or unknown-subject token. |
| `token_expired`            | 401  | Signature valid but `exp` passed. |
| `invalid_credentials`      | 401  | Login: wrong password or unknown email. |
| `inactive_account`         | 403  | Account disabled. |
| `insufficient_permissions` | 403  | Role gate denied access. |
| `email_already_registered` | 409  | Register with an existing normalized email. |

## Local development authentication quick start

1. Add `JWT_SECRET_KEY` to `.env` (see above). Without it the backend refuses
   to start — this is intentional.
2. `cd backend && .venv\Scripts\python -m uvicorn app.main:app --port 8000`
3. Exercise it:

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada","email":"ada@example.com","password":"StrongPass123","role":"citizen"}'

curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"StrongPass123"}'
# -> {"access_token":"...","token_type":"bearer","user":{...}}

curl http://localhost:8000/api/v1/auth/me -H "Authorization: Bearer <token>"
```

## Temporary RBAC demo endpoints

`/api/v1/demo/rbac/{citizen,panchayat,csr,staff}` exist only to prove role
enforcement at the HTTP layer (`staff` = citizen OR panchayat via
`require_any_role`). They are **not** product endpoints and should be removed
before production.