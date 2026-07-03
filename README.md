# Fitbit Air Health Dashboard — Phase 1

Personal health dashboard that pulls **live** data from your Google Fitbit Air via the
**Google Health API** (the official successor to the Fitbit Web API; the legacy Fitbit Web
API shuts down September 2026). Phase 1 renders every available data type on one long
scrollable page so you can decide how to organize it in Phase 2.

```
Next.js 16 frontend (:3000)  ->  FastAPI backend (:8000)  ->  Google Health API (OAuth2)
```

- The backend owns the entire OAuth flow and all Google calls (client secret never reaches
  the browser).
- Tokens are stored in `backend/.tokens.json` (gitignored) for Phase 1 — no database yet.
- Every data card has a **Raw JSON** toggle: the key tool for Phase 2 brainstorming.

---

## Step 0 — Google Cloud setup (do this first; required for any data)

The legacy Fitbit scopes in the original spec are outdated — these are the real ones.

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com) (e.g. `fitbit-dashboard`).
2. **APIs & Services → Library →** enable **Google Health API**.
3. **APIs & Services → OAuth consent screen:** User type **External**, publishing status
   **Testing**, and add **your own Google account as a test user**.
4. **Data Access → Add or remove scopes →** search "Google Health API" and add all six
   `.readonly` scopes (activity_and_fitness, health_metrics_and_measurements, sleep,
   nutrition, ecg, irn).
5. **Credentials → Create credentials → OAuth client ID →** type **Web application**.
6. Add Authorized redirect URI **exactly**: `http://localhost:8000/auth/callback`
7. Copy the client ID + secret into `backend/.env` (see below).
8. Make sure your Fitbit Air has synced recently in the Fitbit app, or the API returns empty.

> If scopes don't appear or calls return **403**, that's an account/allowlist issue (the
> Fitbit→Google migration window), not a code bug — the dashboard surfaces the raw error
> on each card so it's visible.

---

## Backend (FastAPI)

```bash
cd backend
cp .env.example .env          # then fill in GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --reload --port 8000
```

Endpoints: `/auth/login`, `/auth/callback`, `/auth/status`, `/auth/logout`,
`/health/all`, `/health/{slug}`, `/health/types`. Interactive docs at
`http://localhost:8000/docs`.

## Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

`.env.local` already points the frontend at `http://localhost:8000`.

## Connect & verify

1. Start both servers.
2. Open `http://localhost:3000` → click **Connect Fitbit** → complete Google consent.
3. You're redirected back and the full page loads: every section, charts where data exists,
   "No data" cards otherwise, and a Raw JSON toggle on each card.

---

## How data is fetched

All 38 data types are read through one Google endpoint shape
(`GET https://health.googleapis.com/v4/users/me/dataTypes/{kebab-type}/dataPoints`), so the
backend has a single generic `fetch_data_type` (see `backend/services/google_health.py`)
driven by a `DATA_TYPES` registry mapping each route slug to its Google data type, record
kind, and default lookback window. Time filtering uses the API's `filter` param, with the
field path chosen per record kind (interval / sample / daily); if a filter is rejected the
call retries unfiltered so a card never hard-fails.

On the frontend, because real payload shapes vary per type, `lib/extract.ts` does a
best-effort walk to chart a representative numeric series — but the Raw JSON view is always
the source of truth for Phase 2 modeling.
