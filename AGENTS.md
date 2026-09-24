# CityPulse Agent Instructions

> Before modifying this repository, read this file completely.

## Mandatory Reading Order

```text
1. AGENTS.md
2. docs/PROJECT_SPEC.md
3. docs/ARCHITECTURE.md
4. docs/DATA_CONTRACTS.md
5. docs/CONSTRAINTS.md
6. docs/IMPLEMENTATION_PHASES.md
7. docs/UI_RULES.md when working on frontend
8. docs/TEST_CHECKLIST.md before declaring any phase complete
```

## Source of Truth

The project requirements come from the AmiHacks Problem Statement 2 — CityPulse. The repository documentation represents the approved implementation interpretation of that problem statement.

Do not change project scope, architecture, terminology, data contracts, or phases without explicit user approval.

If instructions conflict, this order wins:

1. User's latest explicit instruction
2. AGENTS.md
3. PROJECT_SPEC.md
4. ARCHITECTURE.md
5. DATA_CONTRACTS.md
6. Phase document
7. Existing implementation

## Project Goal

CityPulse combines different civic data sources into one understandable view. It must ingest multiple civic feeds, normalize them into one common format, detect unusual changes, compare events by time and location, identify possible links, explain results in simple resident-friendly language, and display them through a dashboard and map.

The project is not simply a weather dashboard or smart-city visualization. The key problem is cross-source civic data normalization and correlation.

## Fixed Technology Stack

```text
Next.js
TypeScript
Tailwind CSS
Supabase PostgreSQL
React Leaflet
OpenStreetMap
Open-Meteo Weather API
Open-Meteo Air Quality API
Local JSON simulated Transport data
Local JSON simulated Local Reports data
Vercel
```

Do not replace these technologies unless explicitly instructed. Do not add Express, MongoDB, a Python backend, Firebase, Kafka, a Docker requirement, microservices, Google Maps, paid APIs, an authentication framework, a mobile app, blockchain, or a separate ML service.

## Fixed Data Sources

Exactly four main feeds are approved:

```text
Weather       → real → Open-Meteo
Air Quality   → real → Open-Meteo
Transport     → simulated JSON
Local Reports → simulated JSON
```

Do not add feeds unless explicitly requested. The problem statement values correlation quality over feed count.

## Core Processing Flow

```text
DATA
↓
NORMALIZE
↓
STORE
↓
30-MINUTE WINDOW
↓
FIND UNUSUAL CHANGES
↓
CHECK LOCATION
↓
CHECK TIME
↓
FIND POSSIBLE LINKS
↓
CREATE SIMPLE SUMMARY
↓
DISPLAY RESULT
```

Raw API responses must not be directly analysed by frontend components.

## Common Data Rule

Every feed must become a `CityEvent` before analysis. See `docs/DATA_CONTRACTS.md`. No analysis function may depend directly on raw Open-Meteo responses or raw simulated JSON structures.

## Correlation Safety Rule

CityPulse detects associations, not confirmed causes. Allowed language includes `Possible Link`, `may be related`, `happening alongside`, `coinciding with`, and `possible connection`.

Never say `X caused Y`, `X definitely led to Y`, `Because of X, Y happened`, or `Confirmed cause`. A link score is CityPulse's internal association score, not a probability of causation.

## Privacy Rule

Never store or create simulated civic reports containing person names, phone numbers, emails, usernames, identities, or personal profiles. Only aggregated civic-event information is allowed. CityPulse analyses events, not people.

## Simulated Data Rule

Transport and Local Reports are intentionally simulated and must be labelled `Simulated` in the frontend. Weather and Air Quality are labelled `Live` when successfully retrieved.

## Failure Rule

One failing feed must never crash the dashboard. Mark the feed unavailable, update source status, continue with remaining feeds, and communicate the issue calmly in the UI.

## Phase Rule

Never skip phases or implement future-phase features unless the user explicitly requests them. At every phase end: run the application and relevant checks, run TypeScript/build checks when appropriate, fix errors, verify acceptance criteria, report changed files, and stop. Do not automatically begin the next phase.

## Scope Rule

Do not add login, signup, profiles, an admin dashboard, chatbot, complaint-submission portal, payment, social network, role-based dashboards, SMS, email alerts, push notifications, complex ML training, AI agents, extra analytics pages, or extra APIs unless explicitly requested.

## Coding Style

Prefer straightforward names such as `unusual.ts`, `timeCheck.ts`, `locationCheck.ts`, `findLinks.ts`, and `summary.ts`. Avoid unnecessarily elaborate names such as `FusionEngine`, `IntelligenceEngine`, `CorrelationEngine`, `AgentOrchestrator`, or `CivicBrain`. Use readable TypeScript and do not overengineer.
