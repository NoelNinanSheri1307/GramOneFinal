# GramOne Web

TypeScript + React + Vite web application for the GramOne platform.

## Foundation status

Minimal, buildable scaffold only. **No dashboards or features are implemented.**
The eventual web roles are Citizen, Panchayat and CSR; none of those views exist
yet and will be built against the shared FastAPI backend in later milestones.

## Stack

- TypeScript (strict)
- React 18
- Vite

## Structure

```
web/
├── index.html
├── src/
│   ├── main.tsx        # app bootstrapping
│   ├── App.tsx         # (temporary) placeholder screen
│   ├── config.ts       # environment-based shared configuration
│   └── vite-env.d.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Setup

```bash
npm install
npm run dev            # http://localhost:5173
```

Checks:

```bash
npm run typecheck      # tsc --noEmit
npm run build
```

## Configuration

Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` to the backend
root (default `http://localhost:8000/api/v1`). No business logic lives in the
web app; it only renders what the backend returns.