# CityPulse Data Contracts

These structures are deliberate contracts. Do not casually change them.

## CitySource

```ts
export type CitySource =
  | "weather"
  | "air_quality"
  | "transport"
  | "local_report";
```

## CityEvent

```ts
export interface CityEvent {
  id: string;
  source: CitySource;
  type: string;
  area: string;
  latitude: number;
  longitude: number;
  observedAt: string;
  receivedAt: string;
  value: number;
  unit: string;
  simulated: boolean;
  metadata?: Record<string, unknown>;
}
```

`id` uniquely identifies the event. `source` identifies the approved feed. `type` names the source-specific measurement or report type. `area`, `latitude`, and `longitude` identify the civic area. `observedAt` is when the event occurred or was measured; `receivedAt` is when CityPulse processed it. `value` and `unit` represent the comparable primary signal. `simulated` distinguishes synthetic feeds. `metadata` preserves relevant source-specific context without replacing the common fields.

## Timestamp Rules

All application timestamps use ISO 8601. Keep `observedAt` separate from `receivedAt`; never overwrite an observation time with ingestion time.

## Source Labels

```text
weather      → Live
air_quality  → Live
transport    → Simulated
local_report → Simulated
```

Live feeds become unavailable only when their retrieval fails.

## Possible Link

```ts
export interface PossibleLink {
  id: string;
  area: string;
  eventIds: string[];
  signals: string[];
  startTime: string;
  endTime: string;
  timeScore: number;
  locationScore: number;
  unusualScore: number;
  linkScore: number;
  summary: string;
}
```

All scores use a `0` to `1` range and describe association signals, never causation probability.

## UnusualResult

```ts
export interface UnusualResult {
  unusual: boolean;
  score: number;
  baseline: number;
  current: number;
}
```

## Source Status

```ts
export type SourceState = "live" | "simulated" | "unavailable";
```

## Status API Contract

The intended `/api/status` response is:

```json
{
  "mode": "live",
  "city": "Jaipur",
  "updatedAt": "...",
  "status": { "score": 67, "label": "Elevated" },
  "summary": "...",
  "whyItMatters": "...",
  "current": { "weather": {}, "airQuality": {}, "transport": {}, "reports": {} },
  "possibleLinks": [],
  "recentUpdates": [],
  "mapEvents": [],
  "sources": []
}
```

This contract can be refined only when implementation requires it, not casually replaced.

### Final release additions

`observationHistory: CityEvent[]` contains normalized primary observations from
the three hours ending at `updatedAt`, excludes future readings and unavailable
sources, and provides the chart history. Charts must not synthesize missing points.
`alerts: CivicAlert[]` contains current threshold crossings with the originating
event ID, source, value, unit, threshold, timestamp, and simulation label.
`analysis.scoreAvailable` is the display gate for the internal score everywhere.
The full implemented response type is maintained in `types/city.ts`.
