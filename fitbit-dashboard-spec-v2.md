# Fitbit Air Health Dashboard — Project Spec v2

## Overview

A personal health dashboard for the Google Fitbit Air. The app uses real Google OAuth 2.0 to fetch live data from the Google Health API, proxied through a FastAPI backend. The frontend is Next.js 14 + TypeScript + Tailwind CSS.

**Phase 1 goal:** Get every available Google Health API data type rendering on a single long scrollable page with real data. No UI polish yet — just get everything visible so I can brainstorm how I want to organize and display the data in Phase 2.

---

## Architecture

```
[ Next.js 14 Frontend ]  <-->  [ FastAPI Backend ]  <-->  [ Google Health API ]
      (port 3000)                  (port 8000)                (OAuth 2.0)
```

- **Frontend** handles the OAuth redirect initiation and displays data
- **FastAPI** handles the full OAuth token exchange, token storage, and all Google Health API requests
- **No database yet in Phase 1** — tokens stored in memory or a local file for now, PostgreSQL added in Phase 2

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (functional only, no design polish in Phase 1)
- **Charts:** Recharts
- **Icons:** Lucide React

### Backend
- **Framework:** FastAPI (Python)
- **OAuth:** `authlib` or `httpx` + manual OAuth 2.0 flow
- **HTTP Client:** `httpx` (async)
- **Token Storage (Phase 1):** In-memory dict or local JSON file — simple, no DB needed yet
- **CORS:** `fastapi.middleware.cors` configured for `localhost:3000`

---

## Google Cloud Setup (Starting from Scratch)

Steps to complete before writing any code:

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a new project (e.g. `fitbit-dashboard`)
2. Enable the **Google Health API** in APIs & Services → Library
3. Go to APIs & Services → OAuth consent screen:
   - User type: External
   - Add scopes (see below)
   - Add your Google account as a test user
4. Go to APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URI: `http://localhost:8000/auth/callback`
5. Download the credentials JSON — you'll need `client_id` and `client_secret`
6. Store them in a `.env` file in the FastAPI project root (never commit this)

### OAuth Scopes to Request

```
https://www.googleapis.com/auth/health.activity_and_fitness
https://www.googleapis.com/auth/health.health_metrics_and_measurements
https://www.googleapis.com/auth/health.sleep
https://www.googleapis.com/auth/health.nutrition
https://www.googleapis.com/auth/health.ecg
https://www.googleapis.com/auth/health.irn
```

---

## Project Structure

```
/fitbit-dashboard
  /frontend                        # Next.js 14 app
    /app
      /page.tsx                    # Single scrollable page — all data rendered here
      /api
        /health/route.ts           # Proxy calls to FastAPI (keeps API URL off the client)
    /components
      /sections
        /ActivitySection.tsx       # All activity_and_fitness metrics
        /HealthMetricsSection.tsx  # All health_metrics_and_measurements metrics
        /SleepSection.tsx          # Sleep data
        /NutritionSection.tsx      # Nutrition + hydration
        /AdvancedSection.tsx       # ECG + IRN
      /charts
        /SimpleLineChart.tsx       # Reusable Recharts line chart wrapper
        /SimpleBarChart.tsx        # Reusable Recharts bar chart wrapper
      /ui
        /RawDataBlock.tsx          # Shows raw JSON for a data type (useful for brainstorming)
        /MetricRow.tsx             # Label + value in a simple row layout
    /lib
      /api.ts                      # Functions to call FastAPI endpoints
      /types.ts                    # TypeScript types matching Google Health API response shapes

  /backend                         # FastAPI app
    /main.py                       # App entry point, CORS config
    /routers
      /auth.py                     # OAuth flow: /auth/login, /auth/callback, /auth/status
      /health.py                   # Google Health API proxy routes — one per data type
    /services
      /google_health.py            # Functions that call the Google Health API with stored token
      /token_store.py              # Simple in-memory or file-based token storage for Phase 1
    /.env                          # GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI
    /requirements.txt
```

---

## FastAPI Backend — Key Routes

### Auth Router (`/auth`)

| Route | Method | Description |
|---|---|---|
| `/auth/login` | GET | Builds Google OAuth URL and redirects user |
| `/auth/callback` | GET | Handles redirect from Google, exchanges code for tokens, stores them |
| `/auth/status` | GET | Returns whether a valid token is currently stored |

### Health Router (`/health`)

One endpoint per Google Health API data type. All return raw JSON from the API — no transformation in Phase 1.

| Route | Method | Data Type |
|---|---|---|
| `/health/steps` | GET | `steps` |
| `/health/distance` | GET | `distance` |
| `/health/active-energy-burned` | GET | `active_energy_burned` |
| `/health/active-minutes` | GET | `active_minutes` |
| `/health/active-zone-minutes` | GET | `active_zone_minutes` |
| `/health/activity-level` | GET | `activity_level` |
| `/health/altitude` | GET | `altitude` |
| `/health/calories-in-hr-zone` | GET | `calories_in_heart_rate_zone` |
| `/health/daily-vo2-max` | GET | `daily_vo2_max` |
| `/health/run-vo2-max` | GET | `run_vo2_max` |
| `/health/vo2-max` | GET | `vo2_max` |
| `/health/floors` | GET | `floors` |
| `/health/sedentary-period` | GET | `sedentary_period` |
| `/health/swim-lengths` | GET | `swim_lengths_data` |
| `/health/time-in-hr-zone` | GET | `time_in_heart_rate_zone` |
| `/health/total-calories` | GET | `total_calories` |
| `/health/exercise` | GET | `exercise` |
| `/health/heart-rate` | GET | `heart_rate` |
| `/health/hrv` | GET | `heart_rate_variability` |
| `/health/daily-hrv` | GET | `daily_heart_rate_variability` |
| `/health/resting-heart-rate` | GET | `daily_resting_heart_rate` |
| `/health/daily-hr-zones` | GET | `daily_heart_rate_zones` |
| `/health/spo2` | GET | `oxygen_saturation` |
| `/health/daily-spo2` | GET | `daily_oxygen_saturation` |
| `/health/respiratory-rate` | GET | `daily_respiratory_rate` |
| `/health/respiratory-rate-sleep` | GET | `respiratory_rate_sleep_summary` |
| `/health/body-temp` | GET | `core_body_temperature` |
| `/health/sleep-temp` | GET | `daily_sleep_temperature_derivations` |
| `/health/blood-glucose` | GET | `blood_glucose` |
| `/health/body-fat` | GET | `body_fat` |
| `/health/height` | GET | `height` |
| `/health/weight` | GET | `weight` |
| `/health/sleep` | GET | `sleep` |
| `/health/nutrition` | GET | `nutrition_log` |
| `/health/hydration` | GET | `hydration_log` |
| `/health/food` | GET | `food` |
| `/health/ecg` | GET | `electrocardiogram` |
| `/health/irn` | GET | `irregular_rhythm_notification` |

All endpoints accept optional `start_date` and `end_date` query params (ISO format). Default to last 7 days if not provided.

---

## Frontend — Single Scrollable Page

`/app/page.tsx` is the entire Phase 1 UI. It:

1. On load, checks `/auth/status` — if not authenticated, shows a **"Connect Fitbit"** button that hits `/auth/login`
2. Once authenticated, fetches all data types in parallel
3. Renders everything in one long scrollable page grouped by section

### Page Layout (Phase 1 — functional, no polish)

```
[ Connect Fitbit button OR "Connected" status ]

━━━ ACTIVITY & FITNESS ━━━━━━━━━━━━━━━━━━━━
Steps                  [bar chart — 7 days]
Distance               [line chart — 7 days]
Active Energy Burned   [bar chart — 7 days]
Active Minutes         [bar chart — 7 days]
Active Zone Minutes    [stacked bar — zones]
Activity Level         [simple breakdown]
Altitude               [line chart]
Calories in HR Zone    [stacked bar]
Daily VO2 Max          [line chart]
Run VO2 Max            [line chart]
VO2 Max                [stat value]
Floors                 [bar chart]
Sedentary Period       [bar chart]
Swim Lengths           [table]
Time in HR Zone        [stacked bar]
Total Calories         [line chart]
Exercise Sessions      [table: type, duration, HR avg, calories]

━━━ HEALTH METRICS ━━━━━━━━━━━━━━━━━━━━━━━
Heart Rate             [line chart — today]
HRV                    [line chart — 7 days]
Daily HRV              [stat + trend]
Resting Heart Rate     [line chart — 30 days]
Daily HR Zones         [stacked bar]
SpO2                   [line chart]
Daily SpO2             [stat value]
Respiratory Rate       [line chart]
Respiratory Rate Sleep [stat value]
Core Body Temp         [line chart]
Sleep Temp Deviation   [bar chart]
Blood Glucose          [line chart]
Body Fat               [line chart]
Height                 [stat value]
Weight                 [line chart]

━━━ SLEEP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sleep Score            [stat value]
Sleep Stages           [stacked bar — nightly]
Sleep Duration         [line chart — 7 days]

━━━ NUTRITION ━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nutrition Log          [table: calories, macros]
Hydration Log          [progress bar — daily]
Food Log               [list]

━━━ ADVANCED ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ECG                    [line chart — waveform]
Irregular Rhythm       [status / event list]
```

Each metric block is a simple card: title, the chart or value, and a small raw JSON toggle (collapsible) so I can inspect exactly what the API is returning while brainstorming.

---

## Data Types Reference

### Activity & Fitness (`activity_and_fitness` scope)

| Metric | API Key | Record Type |
|---|---|---|
| Steps | `steps` | Interval |
| Distance | `distance` | Interval |
| Active Energy Burned | `active_energy_burned` | Interval |
| Active Minutes | `active_minutes` | Interval |
| Active Zone Minutes | `active_zone_minutes` | Interval |
| Activity Level | `activity_level` | Interval |
| Altitude | `altitude` | Interval |
| Calories in HR Zone | `calories_in_heart_rate_zone` | Interval |
| Daily VO2 Max | `daily_vo2_max` | Daily |
| Run VO2 Max | `run_vo2_max` | Sample |
| VO2 Max | `vo2_max` | Sample |
| Floors | `floors` | Interval |
| Sedentary Period | `sedentary_period` | Interval |
| Swim Lengths Data | `swim_lengths_data` | Interval |
| Time in HR Zone | `time_in_heart_rate_zone` | Interval |
| Total Calories | `total_calories` | Interval |
| Exercise | `exercise` | Session |

### Health Metrics & Measurements (`health_metrics_and_measurements` scope)

| Metric | API Key | Record Type |
|---|---|---|
| Heart Rate | `heart_rate` | Sample |
| Heart Rate Variability | `heart_rate_variability` | Sample |
| Daily HRV | `daily_heart_rate_variability` | Daily |
| Daily Resting Heart Rate | `daily_resting_heart_rate` | Daily |
| Daily HR Zones | `daily_heart_rate_zones` | Daily |
| Oxygen Saturation | `oxygen_saturation` | Sample |
| Daily Oxygen Saturation | `daily_oxygen_saturation` | Daily |
| Daily Respiratory Rate | `daily_respiratory_rate` | Daily |
| Respiratory Rate Sleep Summary | `respiratory_rate_sleep_summary` | Sample |
| Core Body Temperature | `core_body_temperature` | Sample |
| Daily Sleep Temp Derivations | `daily_sleep_temperature_derivations` | Daily |
| Blood Glucose | `blood_glucose` | Sample |
| Body Fat | `body_fat` | Sample |
| Height | `height` | Sample |
| Weight | `weight` | Sample |

### Sleep (`sleep` scope)

| Metric | API Key | Record Type |
|---|---|---|
| Sleep | `sleep` | Session |

### Nutrition (`nutrition` scope)

| Metric | API Key | Record Type |
|---|---|---|
| Nutrition Log | `nutrition_log` | Sample |
| Hydration Log | `hydration_log` | Session |
| Food | `food` | Food |
| Food Measurement Unit | `food_measurement_unit` | Food (internal, no viz) |

### Advanced Health (`ecg` + `irn` scopes)

| Metric | API Key | Record Type |
|---|---|---|
| Electrocardiogram | `electrocardiogram` | Session |
| Irregular Rhythm Notification | `irregular_rhythm_notification` | Session |

---

## Build Order for Claude Code

### Step 1 — FastAPI Backend

1. Scaffold FastAPI project with folder structure above
2. Set up `.env` loading (`python-dotenv`)
3. Build `auth.py` router: `/auth/login` → `/auth/callback` → `/auth/status`
4. Build `token_store.py` (simple in-memory dict for Phase 1)
5. Build `google_health.py` service with a generic `fetch_data_type(token, data_type, start_date, end_date)` function
6. Build `health.py` router wiring every endpoint to `google_health.py`
7. Add CORS middleware for `localhost:3000`
8. Test the full OAuth flow manually using the browser before touching the frontend

### Step 2 — Next.js Frontend

1. Scaffold Next.js 14 + TypeScript + Tailwind project
2. Build `lib/types.ts` with TypeScript types for each Google Health API response shape
3. Build `lib/api.ts` with fetch functions for each backend endpoint
4. Build reusable components: `SimpleLineChart`, `SimpleBarChart`, `RawDataBlock`, `MetricRow`
5. Build each section component (Activity, Health, Sleep, Nutrition, Advanced)
6. Wire everything into `/app/page.tsx` — auth check → fetch all → render sections

### Step 3 — Test End to End

1. Run FastAPI: `uvicorn main:app --reload --port 8000`
2. Run Next.js: `npm run dev`
3. Hit `localhost:3000`, click Connect Fitbit, complete OAuth, verify data loads

---

## Phase 2 (After Data is Visible)

Once all data is rendering and I've decided how I want to organize and display it:

1. Add PostgreSQL — store tokens properly and cache historical data
2. Build proper UI design (layout, typography, color system, charts polish)
3. Add webhook subscriptions for background sync
4. Consider mobile layout
