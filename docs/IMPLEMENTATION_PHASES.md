# CityPulse Implementation Phases

## Phase 1 — Setup

**Status: COMPLETE**

Contains only Next.js, TypeScript, Tailwind, dependencies, directories, environment variables, Supabase client/server setup, Supabase schema, MCP setup when available, API route scaffolding, and Open-Meteo reachability tests. It contains no feature implementation.

## Phase 2 — Data + Normalization

Implement `CityEvent`, synthetic transport and reports data, an initial replay structure, weather/AQI/transport/report normalization, and Supabase event storage.

Acceptance: all four feeds produce valid `CityEvent` objects.

## Phase 3 — Live Feeds + Source Status

Implement live Weather and Air Quality, simulated Transport and Local Reports, timestamps, source freshness, source status, and graceful failure.

Acceptance: all four sources can be collected and one failing real API does not break the application.

## Phase 4 — Unusual Changes + Possible Links

Implement the rolling 30-minute window, baseline, unusual-change detection, time and location comparison, link score, city status, summary, why-it-matters text, and saved possible links.

Acceptance: the Malviya Nagar rain, waterlogging, and transport scenario produces a valid Possible Link.

## Phase 5 — Dashboard + Map

Build the Header, City Status, Current Situation, What's Happening, Live Map, Recent Updates, Why It Matters, Why These May Be Linked, and Data Sources components using `/api/status`.

Acceptance: the important civic situation is understandable within approximately 10 seconds.

## Phase 6 — Replay

Implement Live/Replay, Play, Pause, timeline slider, and replay events through the same analysis functions. A simple in-dashboard alert is optional only after replay works.

## Phase 7 — Final Testing + Deployment

Resolve responsive layout, TypeScript/build errors, failed API states, replay, map, privacy, cautious wording, and deployment. Add no new features.

## Phase Gate Rule

> Future agents MUST NOT start the next phase automatically.

Every phase requires explicit user instruction to continue.
