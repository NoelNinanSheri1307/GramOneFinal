# GramOne — Rural Problem-to-Impact Platform

GramOne is an integrated, multi-client rural problem-to-impact platform connecting Citizens, Gram Panchayats, Field Employees, CSR Partners, and Physical IoT Infrastructure into a unified governance ecosystem.

---

##  Architecture Overview

GramOne operates on a **Single Backend, Multi-Client** architecture where React Web, Flutter Mobile, and ESP32 Microcontrollers communicate with one shared FastAPI + PostgreSQL backend.

```
       Web (React + TS + Vite)      Mobile (Flutter - All 4 Roles)      Hardware (ESP32 IoT Nodes)
                 \                                |                                /
                  \                               ↓                               /
                                        FastAPI Backend (/api/v1)
                                         /               \
                                 PostgreSQL             OpenRouter AI Service
                               (Neon / Local)            (Language & Summarization)
                                     |
              Evidence Confidence -> Impact Scoring -> CSR Need Matching Engines
                        (100% Deterministic & Rule-Based Logic)
```

---

##  Core Supported User Roles (4 Roles)

1. **Citizen (`CITIZEN`)**:
   - Natural language problem reporting (voice/text) with AI fact extraction & category classification.
   - Interactive 5-stage vertical resolution timeline (`Reported` → `Verified` → `Assigned` → `In Progress` → `Resolved`).
   - Access to Community Hub (Government Schemes directory, Local News via NewsData.io, Drug Awareness guidelines, and Women's Safety helplines).
   - Real-time 13-language localized notifications with deep linking.

2. **Panchayat Admin (`PANCHAYAT`)**:
   - Operational Command Dashboard with real-time statistics, urgent alerts, and category filtering.
   - Issue review, verification, field worker assignment, and priority management.
   - Live employee attendance roster monitored via physical RFID card scans.
   - Content management for schemes, community announcements, and safety guides.
   - CSR matching review, sponsorship approval, Impact Case creation, and SDG tracking.

3. **Panchayat Employee / Field Worker (`PANCHAYAT_EMPLOYEE`)**:
   - Mobile and Web task queue displaying assigned field issues.
   - Work status progression (`Accepted` → `In Progress` → `Verification Requested`).
   - Mandatory before/after photo and text evidence upload directly from the field.
   - Physical RFID card attendance sign-in/out (`/hardware/rfid-scan`).

4. **CSR Sponsor (`CSR`)**:
   - Corporate CSR Profile configuration (geographic scope, annual budget range, focus areas, target SDGs).
   - Rule-based rural needs matching with explainable percentage score breakdowns (e.g. 92% match).
   - Direct sponsorship pledge pipeline for village infrastructure projects.
   - Real-time impact tracking mapped to UN Sustainable Development Goals.

---

##  Physical & IoT Hardware Ecosystem (6 Hardware Features)

GramOne integrates 6 physical IoT hardware capabilities via ESP32 microcontrollers (`hardware/water-node` and `hardware/rfid-node`) communicating over HTTP POST to FastAPI backend endpoints (`/hardware/telemetry` and `/hardware/rfid-scan`):

1. **Smart Water Tank Level Monitoring**:
   - Ultrasonic distance sensors (HC-SR04) continuously monitor village water tank levels (`water_level_percent`).
   - Automated threshold evaluation triggers a `CRITICAL` low water alert and auto-creates a deduplicated `WATER` issue when tank level drops below 20%.

2. **Environmental Monitoring Suite**:
   - Multi-sensor telemetry tracking:
     - **Temperature** (°C)
     - **Humidity** (%)
     - **Light / Day-Night Detection** (ambient lighting)
     - **Gas Anomaly Detection**: Sensor triggers an immediate `ENVIRONMENT` alert issue and notifies Panchayat admins.

3. **Panchayat Employee Sign-Ins via RFID**:
   - RC522 SPI RFID card readers log employee card scans to `/hardware/rfid-scan`.
   - The backend validates the UID against active employee records, toggles attendance (`SIGNED_IN` / `SIGNED_OUT`), prevents duplicate scans within 60 seconds, and updates the live roster.

4. **Automatic Water-Level Alert System**:
   - Automated engine pushes real-time critical warnings to Panchayat dashboards without requiring manual citizen reports.

5. **Emergency Alert Panic Button**:
   - Physical panic button (`emergency_pressed=True`) triggers immediate high-priority `DISASTER` category emergency alerts for village safety and crime situations.

6. **Smart Waste Bin Level Monitoring**:
   - Ultrasonic sensors monitor waste bin fill levels (`waste_bin_level_percent`), triggering a `WASTE` overflow risk issue when fill level exceeds 85%.

---

## 🌍 UN Sustainable Development Goals (SDG Alignment)

GramOne natively tracks and maps issues, impact cases, and CSR projects across 4 UN SDGs:

- **SDG 4 (Quality Education)**: School infrastructure, classroom repairs, and educational facilities.
- **SDG 6 (Clean Water and Sanitation)**: Water tank monitoring, pipe leakage repairs, and drinking water quality.
- **SDG 11 (Sustainable Cities and Communities)**: Civic infrastructure, road repairs, smart waste management, and community safety.
- **SDG 13 (Climate Action)**: Environmental telemetry, gas anomaly alerts, and climate resilience initiatives.

---

##  Mobile Integration & Feature Parity (Flutter)

The Flutter mobile application (`mobile/`) shares **100% API feature parity** with the web platform:

- **Authentication & Token Persistence**: Real JWT authentication (`POST /auth/login`), secure local token storage, and session restoration.
- **Citizen Portal**: Natural language problem reporting, image upload, status timeline tracking, and Community Hub discovery.
- **Panchayat Admin Console**: Action HQ dashboard, worker assignment, live RFID roster, and sponsorship tracking.
- **Field Worker Platform**: Real-time task queue, status updates, and before/after evidence uploads.
- **CSR Portal**: Profile setup, rural needs matching, and sponsorship pledges.

---

##  Unified 13-Language Notification System

- **Multi-Role RBAC Delivery**: Serves notifications tailored to Citizens, Panchayats, Employees, and CSR Partners.
- **REST Endpoints**: `GET /api/v1/notifications`, `GET /api/v1/notifications/unread-count`, `POST /api/v1/notifications/{id}/read`, and `POST /api/v1/notifications/read-all`.
- **Actionable Deep Links**: Notifications contain `target_id` and `target_type` for instant navigation to issues, projects, schemes, or notices.
- **13 Languages + Urdu RTL**: Full dynamic translation support for English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Odia, Assamese, and Urdu (with RTL layout support).

---

## 🌐 Community Information & Safety Layer

- **Government Schemes Directory** (`/community/schemes`): Eligibility, benefits, required documents, deadline, and official application reference links.
- **Local News & Notices** (`/community/news`): Panchayat announcements and live external regional news powered by the **NewsData.io** proxy.
- **Drug Awareness & Safety** (`/community/safety`): Awareness guides, prevention information, and support contacts.
- **Women's Safety** (`/community/womens-safety`): Emergency guidance, official helpline contacts, and safety resource guides.

---

##  Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, SQLAlchemy 2.0, Alembic, PyJWT, Bcrypt, Pydantic v2 |
| **Database** | PostgreSQL (Neon DB / Local PostgreSQL) |
| **Web Frontend** | React 18, TypeScript, Vite, Framer Motion, Lucide React, i18next |
| **Mobile App** | Flutter (Dart), 100% API Feature Parity |
| **Hardware Nodes**| ESP32 Dev Module (C++ / Arduino IDE), Ultrasonic (HC-SR04), RFID (MFRC522), Sensors |
| **AI Layer** | OpenRouter API (LLM for language interpretation, fact extraction, and summarization only) |
| **External APIs** | NewsData.io (Regional News API Proxy) |

---

##  Deployment Guide

### Web Frontend (Vercel)
1. Import `web/` directory to Vercel.
2. Build Command: `npm run build`
3. Environment Variable: `VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1`
4. Routing: Uses `web/vercel.json` SPA rewrite rules.

### Backend Application (Render)
1. Create Web Service for `backend/` directory on Render.
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables: `DATABASE_URL`, `JWT_SECRET_KEY`, `CORS_ALLOW_ORIGINS`, `OPENROUTER_API_KEY`, `NEWSDATA_API_KEY`.
