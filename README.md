# GramOne

GramOne is a rural problem-to-impact platform connecting citizens, Panchayats, CSR partners and physical infrastructure. Citizens and hardware report problems; AI assists in interpreting language; deterministic backend engines decide evidence confidence, impact scoring, priority and CSR matching; and the resulting Impact Cases are carried to resolution with tracked impact.

> **Status: Working platform.** GramOne is a working civic-tech MVP covering citizen problem reporting, Panchayat administration, CSR partnership and the Community Information & Safety layer. See [Implementation status](#implementation-status).

---

## Hackathon context

Built for a 24-hour hackathon. The MVP concentrates on three domains:

1. **Water & Sanitation**
2. **Education Infrastructure**
3. **Civic Infrastructure**

### Common workflow

```
Citizen / Hardware
        ↓
Data / Problem Report
        ↓
AI-assisted interpretation        (language understanding only)
        ↓
Evidence aggregation
        ↓
Issue correlation
        ↓
Deterministic impact / priority scoring
        ↓
Impact Case
        ↓
Panchayat / CSR / stakeholder
        ↓
Resolution
        ↓
Impact tracking
```

## High-level architecture

One shared FastAPI backend serves the web app, the mobile app and the ESP32 hardware.

```
Web (React+TS)   Mobile (Flutter)   Hardware (ESP32)
        \              |              /
         \             ↓             /
                    FastAPI
                     /    \
                   PostgreSQL    AI Service (LLM)
                    |             (language only)
                    |
   Evidence -> Correlation -> Impact -> CSR Matching engines
   (deterministic numerical decisions & business rules)
```

Guiding principles:

- **One backend.** Web, mobile and hardware talk to the same API.
- **Business logic in the backend.** No GramOne business rules in React, Flutter or ESP32 code.
- **PostgreSQL** is the primary application database.
- **AI is not the authority** for numerical or state decisions. AI handles language tasks (classification, structured extraction, summarization, suggested stakeholders, suggested SDG). Deterministic backend logic controls evidence confidence, impact score, priority, CSR matching, hardware thresholds and issue state transitions.
- **Explainability.** Every important calculation must be explainable to the UI.
- **Hardware as a client.** The ESP32 reads sensors, validates basic readings, transmits telemetry and shows local status; the backend does the actual GramOne logic.
- **Modular monolith.** No microservices, no Kubernetes, no message brokers for the hackathon.

See [docs/architecture/](docs/architecture/).

## Technology stack

| Layer      | Technology                                        |
|------------|---------------------------------------------------|
| Backend    | Python 3.10+, FastAPI, SQLAlchemy 2.x, Alembic     |
| Database   | PostgreSQL                                        |
| Web        | TypeScript, React, Vite                            |
| Mobile     | Flutter (Dart)                                     |
| Hardware   | ESP32 (C / ESP-IDF friendly layout)                |
| AI         | Provider-agnostic service abstraction (no calls yet) |

## Repository structure

```
GramOne/
│
├── web/                  # Web application (TypeScript + React + Vite)
├── mobile/               # Mobile application (Flutter, citizen-facing)
├── backend/
│   ├── app/
│   │   ├── api/          # API versioning, v1 endpoints
│   │   ├── core/         # Config, errors, logging, security base
│   │   ├── models/       # SQLAlchemy models + domain enums
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── services/     # AI + deterministic engine boundaries
│   │   └── main.py       # Application entry point
│   └── tests/            # Pytest suite
├── hardware/
│   └── water-node/       # ESP32 water monitoring node foundation
├── database/
│   ├── migrations/       # Alembic migration environment
│   └── seeds/            # Seed scripts (future)
├── docs/
│   ├── architecture/     # Architecture & engine separation docs
│   ├── api/              # API documentation
│   └── algorithms/       # Deterministic algorithm specifications (future)
└── .github/              # Issue-driven development workflow notes
```

## Development setup

### Prerequisites

- Python 3.10+
- PostgreSQL (for anything beyond the health endpoint)
- Node.js 18+ (web)
- Flutter 3.x (mobile)
- ESP-IDF or PlatformIO (hardware, optional)

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows
# source .venv/bin/activate       # macOS / Linux
pip install -r requirements-dev.txt

# Copy environment file (root of repo), then adjust values
cp ../.env.example ../.env
# Authentication requires a JWT signing secret (absent by design). Generate one:
# python -c "import secrets; print(secrets.token_urlsafe(64))"
# and set JWT_SECRET_KEY in ../.env. See docs/architecture/authentication.md.
#
# External NewsData.io integration requires registering at newsdata.io and setting:
# NEWSDATA_API_KEY=your_api_key_here
# in the backend environment.

# Run tests
pytest

# Run the server
uvicorn app.main:app --reload --port 8000
```

Health check: `GET http://localhost:8000/api/v1/health`

### Database

Based on the `DATABASE_URL` from `.env`. Create the database manually first, then:

```bash
cd backend
alembic revision --autogenerate -m "message"
alembic upgrade head
```

The core domain schema (revision `94138b2c890c`) and later migrations —
including the Community Information & Safety content (revision `b8c9d0e1f2a3`) —
are applied to the configured database. See [docs/architecture/data_model.md](docs/architecture/data_model.md).

### Web (Citizen Portal)

```bash
cd web
npm install
npm run dev
```

**Environment Variables:**
- `VITE_API_BASE_URL`: Base URL for the FastAPI backend (defaults to `http://localhost:8000/api/v1`).

### Hackathon Judge Live Demo Flow

Judges can run through the complete citizen problem-reporting workflow locally:

1. **Launch App**: Open `http://localhost:5173/`.
2. **Sign In / Demo Seed**:
   - Use the **⚡ Quick Demo: Seed 3 Rural Issues & Log In** button on `/login` to instantly populate sample rural issues (Water, Education, Civic) and sign in as `Ramesh Patel`.
   - Or sign in using `ramesh.citizen@gramone.org` / `GramOne2026!`.
3. **Citizen Dashboard (`/dashboard`)**:
   - View welcoming greeting, real-time issue statistics counters (Open, In Progress, Resolved), and recent issue cards.
4. **Report a Problem (`/report`)**:
   - Click sample prompt chips (e.g. *💧 Water Leakage*) or type a natural language problem report.
   - Click **Analyze with GramOne AI**.
   - Review extracted facts, category classification, urgency rating, SDG 6/4/11 tags, and explicit facts.
   - Confirm & create the official Panchayat issue to receive an issue reference ID (e.g. `ISS-2026-0042`).
5. **Issue Tracking & Timeline (`/issues/:id`)**:
   - View the transparent vertical resolution timeline (`Reported` → `Verified` → `Assigned` → `In Progress` → `Resolved`).
   - Inspect AI facts analysis, attached evidence logs, and Panchayat Impact Case linkage.
6. **Filterable Issue Directory (`/issues`)**:
   - Filter issues by status chips, domain categories (Water, Education, Civic), and search by reference or title.
7. **Live Hardware Telemetry Demo (`/panchayat`)**:
   - Log in as Panchayat Officer (`panchayat.officer@gramone.org` / `GramOne2026!`).
   - Observe real-time ESP32 water node telemetry on the Hardware Monitoring card.
   - Test critical warnings (<20% threshold) using **⚡ DEV ONLY: Simulate Water 18% (Critical)** to display the red critical alert banner.
   - See [docs/hardware_demo.md](docs/hardware_demo.md) for ESP32 Arduino sketch details and wiring diagrams.

## Implementation status

**Implemented:**

- **Citizen Web MVP & Completed Experience:**
  - Polished React + Vite + TypeScript web application with a custom rural-accessible design system.
  - Authentication flow with JWT (`/login`, `/signup`) and 1-click demo helpers.
  - Completed Citizen Dashboard (`/dashboard`) with statistics, recent issues, recent notifications/alerts, published notices, active schemes, safety guides, and live data refresh.
  - Natural Language Problem Reporting (`/report`) with AI interpretation, structured review, editability, and issue creation.
  - Dedicated Citizen Issue Directory (`/issues`) with status/category filtering and search.
  - Detailed Issue Tracking (`/issues/:id`) with vertical history timeline, AI facts, evidence logs, and readonly CSR Impact Project/Case details.
- **Community Information & Safety layer:**
  - **Government schemes** — Panchayat-published scheme listings (`/community/schemes`) with category, title, short/detailed description, eligibility, benefits, required documents, application instructions, official application URL (treated as a reference, never fabricated), deadline, state/district/village scope, and target groups. Citizens can browse, search, filter by category / target group / active-expired, and open details.
  - **Local news & notices** (`/community/news`) — Panchayat announcements and community notices with title, summary, content, category, publication date, optional expiry, village scope, and a clean published/unpublished lifecycle. The architecture supports a future external news provider behind a `source_type` boundary (external items are references only — no fabricated "live news").
  - **Community safety / drug awareness** (`/community/safety`) — awareness articles, prevention info, warning signs, where to seek help, Panchayat-published awareness notices, and official/public health resources. Reports about substance/drug activity route through the normal private issue-reporting flow (no public accusations, no naming individuals).
  - **Women's safety** (`/community/womens-safety`) — safety resources, emergency guidance, official support contacts/helplines, Panchayat safety notices, and awareness content. The physical emergency button and response tracking are a **future milestone**; this section is designed as the integration point and intentionally does not fake emergency functionality.
  - **Panchayat community management** (`/panchayat/community`) — tabbed management for schemes, announcements, and safety resources: create, edit, publish/unpublish, and archive. The Panchayat dashboard links to this area. No new roles were created.
  - **Unified Notification System (new):**
  - **Centralized Service:** Single source of truth backend notification service managing generation, retrieval, paginated listing, unread counts, and safe role-aware RBAC delivery for Citizens, Panchayats, Employees, and CSR partners.
  - **Authenticated REST APIs:** Exposes clean REST endpoints: `GET /api/v1/notifications` (with pagination, read/unread status, and type filtering), `GET /api/v1/notifications/unread-count`, `POST /api/v1/notifications/{id}/read`, and `POST /api/v1/notifications/read-all`.
  - **Automatic Event Integration:** Hooks into core lifecycle events:
    - *Citizens* receive updates on issue validation, assignment, status updates, and resolution.
    - *Panchayats* receive alerts for new/urgent/emergency issues, completed field work (verification required), and CSR sponsorships.
    - *Employees* receive assignment and priority updates.
    - *CSR partners* get sponsorship and project status updates.
    - *Community notice/scheme/safety publication* notifies relevant citizens in jurisdiction.
    - Includes automatic duplicate notification prevention.
  - **Frontend Notification Center:** Elegant header indicator with live unread badge, hover/click popover preview, and a dedicated, paginated Notifications page (`/notifications`).
  - **Actionable Deep Links:** Notifications carry backend-provided metadata payloads (`target_id`, `target_type`) allowing instant navigation to the corresponding issue, project, sponsorship, scheme, notice, or safety resource.
  - **Full 13-language i18n & RTL Support:** Leverages translation keys and parameter payload interpolation to translate notification content dynamically in all 13 languages, fully respecting Urdu RTL layout behavior.
  - **Multilingual** — all new UI text uses translation keys and the existing dynamic-content translation pipeline, so Panchayat content follows the same 13-language architecture (English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Odia, Assamese, Urdu — including Urdu RTL).
- **Backend:**
  - FastAPI application with `/api/v1` versioning and `GET /api/v1/health`.
  - Environment-based configuration (`.env` via pydantic-settings), CORS, central error handling, SQLAlchemy session/engine foundation, and Alembic migrations.
  - Core domain models: User, Village, Issue, IssueEvidence, IssueHistory, ImpactCase, ImpactScore, Project, CSRProfile, CSRMatch, Sponsorship, Device, Telemetry, Notification, Attendance, and the community models `Scheme`, `CommunityNotice`, `SafetyResource`.
  - Authentication: bcrypt hashing, JWT access tokens (`POST /auth/register`, `POST /auth/login`, `GET /auth/me`).
  - Issue workflow: create/list/get/update issues, AI interpretation (`POST /issues/interpret`), creation from interpretation (`POST /issues/from-interpretation`), evidence attachment, IssueHistory timeline.
  - Deterministic engines: evidence confidence, impact/priority scoring, and CSR-Rural needs matching platform based on budget range, focus areas, preferred SDGs, geographical scope, support types (financial, equipment, training, etc.) and contribution domains (no LLM is used for matching scores).
  - SDG coverage: Native mapping and tracking for SDG 4 (Quality Education), SDG 6 (Clean Water), SDG 11 (Sustainable Cities), and expanded SDG 13 (Climate Action) environment-related telemetry and initiatives.
  - Hardware telemetry ingestion + deterministic threshold alerts, RFID employee attendance, and Panchayat employee field-workflow.
  - CSR partnership workflow: profiles, contribution preferences, explainable matching scores, opportunity lists with unfunded needs filters, sponsorships, projects, notifications.
  - Multilingual platform: 13-language UI, dynamic content translation (`POST /translations/store`, `POST /translations/translate-batch`), and pre-authored demo content.
  - Community API (`/api/v1/community/*`): schemes, notices, and safety resources with backend-authoritative RBAC — citizens read published content; Panchayat manages content; CSR and Panchayat/CSR admins manage/track sponsorships.

**Roles:** `citizen`, `panchayat`, `csr`, `panchayat_employee` (no new roles added).

**Not implemented (later, via GitHub Issues):** email verification, password reset, refresh tokens, the physical ESP32 emergency button and Panchayat emergency-response tracking, automatic issue correlation, external news-provider integration (a provider/service boundary exists but no live news API is connected), and a citizen notification/subscription model (notifications are currently scoped to Panchayat officers).

## Role Workflows

GramOne supports four distinct roles with dedicated interfaces, dashboard controls, and workflow pathways:

### 1. Citizen Workflow
- **Dashboard Hub**: Direct visual summaries of active reported issues, government schemes, local notices, and safety guidelines.
- **Problem Reporting**: Reports are processed via natural language interpretation, categorizing problems into domains (Water, Sanitation, Education, Agriculture, Healthcare, Waste, Environment, Women's Safety, Civic Infrastructure).
- **Issue Tracking**: A detailed interactive vertical timeline showing real-time updates (validation, assignment, field progress, and resolution history), along with linked CSR sponsorships and impact statistics.
- **Community Hub Discovery**: Citizens browse published local resources, active/expired schemes, drug awareness guidelines, and women's safety helplines.

### 2. Panchayat Admin Workflow
- **Operational Intelligence Dashboard**: Operational views of total open issues, urgent issues, workload roster, and live RFID clock-in logs of field employees.
- **Category Filtering & Action Queues**: Admin filters reports by domain, status, or queue (Needs Immediate Attention, Needs Assignment, Field Verification, Awaiting Resolution) for fast verification and assignment.
- **Content Management**: Complete creation, modification, and publication control for announcements, government schemes, and safety resource articles.
- **CSR matching & Sponsorships**: Review matches, approve pending CSR sponsorships, track active supported projects, and create Impact Cases mapping to SDGs 4, 6, 11, and 13.

### 3. Panchayat Employee Workflow
- **Field Operations**: Direct dashboard with lists of assigned issues, work status tracking (Accept, Start, In-Progress, Verification Requested).
- **Evidence Verification**: Uploading before/after evidence directly from the field.
- **RFID Integration**: Physical attendance tracking logged through card clock-ins (represented cleanly in backend/database models and live roster feeds).

### 4. CSR Partner Workflow
- **Profile Preferences**: Companies edit geographic scope, budgets, preferred SDGs, focus domains, and support type categories.
- **Rural Needs Matching**: High-impact rural needs matched deterministically with detailed match breakdown explanations (e.g. 92% match).
- **Sponsorship Pathway**: CSR partners submit funding commitments or material/training proposals, which Panchayat Admins review and track through to completion.

## Mobile Integration & Feature Parity

We have completed the full production integration between the mobile client app and the unified GramOne backend, establishing complete feature parity:

1. **Authentication & Token Flow**:
   * **Real JWT Flow**: Authenticates using backend JWT credentials (`POST /auth/login` and `GET /auth/me`).
   * **Token Persistence**: Persists JWT tokens to a secure local file on device and restores session state automatically on app restart.
   * **Unauthorized Catching**: Intercepts `401`/`403` status responses globally to trigger clean re-login cascades.
2. **Citizen Portal**:
   * **Real reporting**: Multi-step wizard submits issues to backend `/issues` with category enums and handles picture attachments.
   * **Dynamic timeline**: Fetches and parses real status change histories (`timelineSteps`) directly from the database.
   * **Community Hub**: Features live cached regional news (NewsData.io proxy), Panchayat notices, and Safety Resource directories.
3. **Panchayat Admin Console**:
   * **Action HQ**: Visual statistics cards populated dynamically using `Future.wait` aggregates.
   * ** Roster & Assignments**: Lists live staff counts and logs worker assignments via `/issues/{id}/assign` requests.
4. **CSR Portal**:
   * **Preference matching**: Coordinates opportunities and funding commitments dynamically.
   * **Sponsorship pipeline**: Pledges commitments via `POST /csr/sponsor`, dynamically creating matching village projects if not already initialized.
5. **Field Worker Platform**:
   * **Task queue**: Real-time task cards populated directly from worker assignment filters.

## Development workflow

Development is tracked through the existing GitHub Issues in this repository. See [.github/README.md](.github/README.md). One issue is completed at a time; this foundation is the starting point and no product features were added alongside it.