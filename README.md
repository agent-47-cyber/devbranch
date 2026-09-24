# CityPulse

## Release verification notes

- Trend charts use normalized observations from the last three hours, never generated history. Empty or single-point histories are explicitly labelled.
- Map selections and report cards use the same timestamped feed records. No neighborhood score, traffic speed, dispatch status, or sensor reading is invented.
- Weather/AQI provider failures show unavailable; no synthetic weather fallback is presented as a public reading. Transport and local reports remain intentionally simulated.
- Three replay days contain six moments each. The same normalization, rolling-window analysis, threshold checks and summary rules run for every frame without writing replay data into live storage.
- `npm test`, `npm run lint`, `npm run build`, and `npm run test:integration` cover analysis, failure handling, API contracts and storage. Integration reports upstream outages as **DEGRADED**, not as verified live readings.

CityPulse is a civic signal dashboard for Jaipur built for AmiHacks Problem Statement 2. It combines fragmented city feeds into one resident-friendly view, detects unusual changes within a rolling time window, and surfaces cautious **possible connections** between events occurring near the same place and time.

**Live application:** [citypulse-iota-bice.vercel.app](https://citypulse-iota-bice.vercel.app)

## What CityPulse does

- Combines weather, air quality, transport, and local-report signals.
- Normalizes every source into one shared `CityEvent` contract.
- Stores normalized events and source health in Supabase PostgreSQL.
- Analyses a rolling 30-minute window for unusual changes.
- Compares unusual signals by time and location.
- Shows possible links without claiming that one event caused another.
- Presents the result through an animated dashboard and interactive map.
- Includes a deterministic replay of the Malviya Nagar demonstration scenario.
- Offers three simulated days (22–24 September 2026), each with six moments and different rain, report, and delay levels.
- Highlights current readings that cross transparent project alert thresholds; expired or superseded readings stop triggering alerts.
- Keeps working when an individual source is unavailable.
- Optionally uses Groq to arrange source-grounded facts into a concise brief; deterministic template summaries remain the fallback.

## Data sources

| Feed | Source | UI label | Notes |
| --- | --- | --- | --- |
| Weather | Open-Meteo Weather API | Live | Rainfall, temperature, and wind observations |
| Air quality | Open-Meteo Air Quality API | Live | CAMS/Open-Meteo US AQI readings, explicitly labelled as US AQI |
| Transport | Local JSON fixtures | Simulated | Aggregated demonstration delays and blockages |
| Local reports | Local JSON fixtures | Simulated | Aggregated demonstration report counts with no personal data |

Open-Meteo does not require an API key. Transport and local reports are intentionally synthetic and are never presented as live observations.

## Processing flow

```text
Four civic feeds
      ↓
Normalize into CityEvent
      ↓
Store in Supabase
      ↓
Select rolling 30-minute window
      ↓
Detect unusual changes
      ↓
Compare time and location
      ↓
Calculate possible-link score
      ↓
Create cautious plain-language summary
      ↓
Serve /api/status to the dashboard
```

The prototype link score is:

```text
0.40 × time score + 0.30 × location score + 0.30 × unusual-change score
```

A score at or above `0.70` may be displayed as a **Possible Link**. It is an association score, not a probability of causation.

## Technology

- Next.js App Router and TypeScript
- React and Tailwind CSS
- GSAP/ScrollTrigger and Motion for interface animation
- React Leaflet with OpenStreetMap
- Supabase PostgreSQL
- Open-Meteo Weather and Air Quality APIs
- Groq API as an optional server-only wording enhancement
- Node test runner through `tsx`
- Vercel deployment

## Project structure

```text
CityPulse/
├── app/
│   ├── api/                 # Weather, AQI, transport, reports, and status routes
│   ├── globals.css          # Shared application styling
│   └── page.tsx             # Main dashboard entry
├── components/              # Dashboard, map, replay, and animation components
├── data/                    # Simulated feeds and deterministic replay fixtures
├── docs/                    # Approved specification and implementation rules
├── lib/                     # Collection, normalization, analysis, summaries, storage
│   └── supabase/            # Server and browser Supabase helpers
├── supabase/schema.sql      # PostgreSQL schema
├── tests/                   # Unit and end-to-end integration checks
├── types/                   # Shared CityEvent and API contracts
├── .env.local.example      # Safe environment-variable template
└── AGENTS.md                # Repository contribution instructions
```

## Run locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL editor.

Copy the environment template:

```bash
cp .env.local.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.local.example .env.local
```

Fill in `.env.local`:

| Variable | Required | Visibility | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Public configuration | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public configuration | Supabase publishable/anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server secret | Server-side event and status persistence |
| `NEXT_PUBLIC_DEFAULT_CITY` | Yes | Public configuration | Dashboard city, normally `Jaipur` |
| `NEXT_PUBLIC_DEFAULT_LAT` | Yes | Public configuration | Default map latitude |
| `NEXT_PUBLIC_DEFAULT_LON` | Yes | Public configuration | Default map longitude |
| `GROQ_API_KEY` | No | Server secret | Optional grounded summary enhancement |
| `GROQ_MODEL` | No | Server configuration | Groq model identifier |

Never commit `.env.local`. Never prefix the Supabase service-role key or Groq key with `NEXT_PUBLIC_`.

### 3. Start development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API routes

| Route | Description |
| --- | --- |
| `GET /api/weather` | Fetches and normalizes live Open-Meteo weather observations |
| `GET /api/air-quality` | Fetches and normalizes live Open-Meteo air-quality observations |
| `GET /api/transport` | Loads normalized simulated transport observations |
| `GET /api/reports` | Loads normalized simulated local-report observations |
| `GET /api/status?mode=live` | Returns the complete live dashboard contract |
| `GET /api/status?mode=replay&step=0` | Returns a replay frame; steps run from stable to linked conditions |
| `GET /api/status?mode=replay&day=0&step=5` | Selects a simulated day: `0` = 22 Sept, `1` = 23 Sept, `2` = 24 Sept (default) |

The frontend consumes the normalized `/api/status` contract instead of analysing raw provider responses.

## Demo replay

Replay demonstrates the full correlation path using the same analysis functions as live mode:

```text
4:45 PM  Normal conditions
5:05 PM  Rain becomes unusually high
5:16 PM  Waterlogging reports rise
5:24 PM  Transport delays rise
5:25 PM  Same-area, close-in-time signals produce a Possible Link
```

Use the **Live / Replay** switch, play/pause control, or timeline to inspect each stage.

Choose a date to compare a quieter day, gradually building rain, and a larger disruption. These days are synthetic profiles built from the fixtures, not historical measurements. Every day passes through the same normalizers, rolling-window analysis, summaries, alerts, and map. Replay never writes simulated history into live storage.

### In-dashboard alerts

The latest observation for each area and signal is checked against these prototype thresholds:

| Signal | Threshold |
| --- | --- |
| Rainfall | 10 mm |
| US AQI | 150 US AQI |
| Transport delay | 15 minutes |
| Waterlogging reports | 10 aggregated reports |

Only observations inside the current 30-minute window can trigger an alert. A newer reading below its threshold clears the flag. Cards preserve the observation time, public/simulated label, and any connection to an existing Possible Link. These are project rules, not official emergency thresholds; they do not send external notifications.

## Quality checks

```bash
npm test
npm run lint
npm run build
```

With the application running, the integration suite checks all routes and temporary Supabase write/read behavior:

```bash
npm run test:integration
```

The integration test deletes only the two audit records it creates.

## Deploy to Vercel

1. Import this GitHub repository into Vercel.
2. Add the variables from `.env.local.example` to Production, Preview, and Development.
3. Store `SUPABASE_SERVICE_ROLE_KEY` and `GROQ_API_KEY` as secrets.
4. Deploy with the Next.js defaults, or run:

```bash
npx vercel --prod
```

## Safety and privacy

- CityPulse reports associations, never confirmed causes.
- Summaries use cautious language such as “may be related” and “happening alongside.”
- Groq can select and order only facts already produced by CityPulse; invalid or free-form model output is rejected.
- The dashboard remains functional without Groq through deterministic template summaries.
- Simulated civic reports contain no names, phone numbers, email addresses, usernames, or personal profiles.
- One failed feed is marked unavailable without crashing the remaining dashboard.

## Project documentation

Contributors should read [`AGENTS.md`](AGENTS.md) before changing the project.

- [Project specification](docs/PROJECT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Data contracts](docs/DATA_CONTRACTS.md)
- [Constraints](docs/CONSTRAINTS.md)
- [Implementation phases](docs/IMPLEMENTATION_PHASES.md)
- [UI rules](docs/UI_RULES.md)
- [Test checklist](docs/TEST_CHECKLIST.md)

## Status

The complete dashboard, four data feeds, normalization pipeline, Supabase persistence, 30-minute analysis window, possible-link detection, replay mode, resilient failure states, optional Groq summary enhancement, and Vercel production deployment are implemented.
