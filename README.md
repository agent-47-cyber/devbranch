# CityPulse

CityPulse is a 24-hour hackathon prototype for a live civic health dashboard for Jaipur.

## Configuration and API keys

Keep all local credentials in `.env.local` at the project root. This file is ignored by Git and must never be committed. Copy `.env.local.example` to create it.

```text
.env.local.example   # Safe-to-share list of required environment variables
.env.local           # Your local Supabase values only - never commit this file
```

Open-Meteo does not need an API key. The only environment variables currently required are:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_DEFAULT_CITY=Jaipur
NEXT_PUBLIC_DEFAULT_LAT=
NEXT_PUBLIC_DEFAULT_LON=
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never prefix it with `NEXT_PUBLIC_` and never place it in a React client component.

## Project structure

```text
CityPulse/
├── app/                    # Next.js pages, styling, and API routes
│   └── api/                # weather, air-quality, transport, reports, status
├── components/             # Dashboard UI components, added in Phase 5
├── data/                   # Simulated transport, reports, and replay JSON
├── lib/                    # Data-source and analysis utilities
│   └── supabase/           # Separate browser and server Supabase clients
├── supabase/               # PostgreSQL schema for the three approved tables
├── types/                  # Shared TypeScript types, including CityEvent in Phase 2
├── public/                 # Static assets when required
├── .env.local.example      # Environment-variable template
├── .gitignore              # Excludes secrets, dependencies, and build output
├── package.json            # Commands and dependencies
└── README.md               # Setup and navigation guide
```

## Phase 1

This phase contains only the Next.js foundation, dependency setup, directory scaffold, Supabase helpers, schema, and placeholder API routes. It intentionally does not include data normalization, detection logic, replay, or a dashboard.

## Run locally

1. Copy `.env.local.example` to `.env.local` and add your Supabase values when available.
2. Run `npm run dev`.
3. Visit `http://localhost:3000`.
