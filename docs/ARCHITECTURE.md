# CityPulse Architecture

```text
Open-Meteo Weather ───────┐
                          │
Open-Meteo Air Quality ───┤
                          │
Transport JSON ────────────┼─→ Normalize
                          │
Reports JSON ──────────────┘
                               ↓
                            CityEvent
                               ↓
                            Supabase
                               ↓
                       30-minute window
                               ↓
                    Find unusual changes
                               ↓
                       Compare location
                               ↓
                         Compare time
                               ↓
                      Find possible links
                               ↓
                       Create summaries
                               ↓
                         /api/status
                               ↓
                           Dashboard
```

## Architecture Rules

Frontend components must not perform core analysis. Core analysis belongs in `lib`, and API integration belongs in server routes or `lib`. Supabase secrets must never reach client components. `/api/status` is the primary clean frontend data source.

## Main Folders

```text
app/        Next.js pages, styles, and API routes
components/ Presentation-only dashboard components
lib/        Reusable data-source, normalization, storage, and analysis logic
data/       Synthetic and replay fixtures
types/      Shared TypeScript contracts
supabase/   PostgreSQL schema
docs/       Permanent project source of truth
```

## Responsibilities

### app/api

External and internal request handling.

### lib

Core reusable logic.

### data

Synthetic and replay fixtures.

### types

Shared TypeScript contracts.

### components

Presentation only.

### Supabase

Persistence.
