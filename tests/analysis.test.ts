import assert from "node:assert/strict";
import { test } from "node:test";
import { createCityEvent } from "../lib/normalize";
import { detectUnusual } from "../lib/unusual";
import { findPossibleLinks } from "../lib/findLinks";
import { getReplayEvents, replaySteps } from "../lib/replay";
import { analyzeStatus, getLiveStatus, getReplayStatus } from "../lib/status";
import { inWindow, timeScore } from "../lib/timeCheck";
import { locationScore } from "../lib/locationCheck";
import { normalizeWeatherResponse } from "../lib/weather";
import { normalizeAirQualityResponse } from "../lib/airQuality";
import {
  currentIncidentCount,
  isCurrentMapEvent,
  latestAreaEvent,
} from "../lib/mapView";

const at = new Date(replaySteps.at(-1)!.at).toISOString();
const events = getReplayEvents(replaySteps.length - 1);

test("map incidents use the selected area's latest report and observation time", () => {
  const malviya = latestAreaEvent(events, "Malviya Nagar", "local_report");
  const jagatpura = latestAreaEvent(events, "Jagatpura", "local_report");
  assert.equal(malviya?.value, 12);
  assert.equal(jagatpura?.value, 3);
  assert.equal(currentIncidentCount(events, "Malviya Nagar", at), 12);
  assert.equal(currentIncidentCount(events, "Jagatpura", at), 3);
  assert.equal(isCurrentMapEvent(malviya!, at), true);
  assert.equal(
    currentIncidentCount(events, "Malviya Nagar", "2026-09-25T12:00:00.000Z"),
    0,
  );
});

test("all four normalizers produce finite, zoned, synthetic replay events", () => {
  assert.equal(new Set(events.map((e) => e.source)).size, 4);
  for (const e of events) {
    assert.ok(e.observedAt.endsWith("Z") && e.receivedAt.endsWith("Z"));
    assert.ok(Number.isFinite(e.value) && e.simulated);
    assert.ok(Date.parse(e.observedAt) <= Date.parse(at));
  }
});
test("normalization preserves instants and rejects invalid measurements", () => {
  const e = createCityEvent({ ...events[0], observedAt: "2026-09-24T12:00" });
  assert.equal(e.observedAt, "2026-09-24T12:00:00.000Z");
  assert.throws(() => createCityEvent({ ...e, value: NaN }));
  assert.throws(() => createCityEvent({ ...e, observedAt: "yesterday" }));
  assert.throws(() => normalizeWeatherResponse({}, "Malviya Nagar"));
  assert.throws(() => normalizeAirQualityResponse({}, "Malviya Nagar"));
});
test("zero baseline is stable at zero; spikes and recent z-score baselines work", () => {
  const e = events[0];
  const history = [0, 1, 2, 3].map((n) => ({
    ...e,
    id: `h-${n}`,
    value: 0,
    observedAt: new Date(Date.parse(at) - (10 + n) * 60_000).toISOString(),
  }));
  assert.equal(
    detectUnusual({ ...e, id: "now", value: 0, observedAt: at }, history)
      .unusual,
    false,
  );
  assert.equal(
    detectUnusual({ ...e, id: "now", value: 10, observedAt: at }, history)
      .unusual,
    true,
  );
  assert.equal(
    detectUnusual(
      { ...e, id: "now", value: 10, observedAt: at },
      history.map((e) => ({ ...e, observedAt: "2025-01-01T00:00:00Z" })),
    ).unusual,
    false,
  );
});
test("window excludes expired and future observations, including old links", () => {
  const within = inWindow(events, at);
  assert.ok(
    within.every(
      (e) => Date.parse(at) - Date.parse(e.observedAt) <= 30 * 60_000,
    ),
  );
  assert.equal(
    inWindow(
      [
        {
          ...events[0],
          observedAt: new Date(Date.parse(at) + 1).toISOString(),
        },
      ],
      at,
    ).length,
    0,
  );
  assert.equal(
    findPossibleLinks(
      events,
      new Date(Date.parse(at) + 31 * 60_000).toISOString(),
    ).length,
    0,
  );
});
test("rain + waterlogging + delay creates a bounded association", () => {
  const links = findPossibleLinks(events, at);
  assert.equal(links.length, 1);
  assert.equal(links[0].area, "Malviya Nagar");
  for (const key of [
    "timeScore",
    "locationScore",
    "unusualScore",
    "linkScore",
  ] as const)
    assert.ok(links[0][key] >= 0 && links[0][key] <= 1);
  assert.ok(links[0].summary.includes("may be related"));
});
test("unrelated areas, distant times and non-waterlogging reports cannot link", () => {
  assert.equal(
    findPossibleLinks(
      events.map((e) =>
        e.source === "transport"
          ? { ...e, area: "Jagatpura", longitude: 75.86 }
          : e,
      ),
      at,
    ).length,
    0,
  );
  assert.equal(
    findPossibleLinks(
      events.map((e) =>
        e.source === "transport"
          ? { ...e, observedAt: "2026-09-24T10:00:00Z" }
          : e,
      ),
      at,
    ).length,
    0,
  );
  assert.equal(
    findPossibleLinks(
      events.map((e) =>
        e.type === "waterlogging" ? { ...e, type: "power outage" } : e,
      ),
      at,
    ).length,
    0,
  );
  assert.equal(timeScore(events[0], { ...events[0], observedAt: at }), 0);
  assert.equal(
    locationScore(events[0], {
      ...events[0],
      area: "Elsewhere",
      latitude: 0,
      longitude: 0,
    }),
    0,
  );
});
test("replay starts stable, ends linked and never writes to storage", async () => {
  const start = await getReplayStatus(0);
  const end = await getReplayStatus(replaySteps.length - 1);
  assert.equal(start.status.label, "Stable");
  assert.equal(start.possibleLinks.length, 0);
  assert.ok(
    start.current.weather &&
      start.current.airQuality &&
      start.current.transport &&
      start.current.reports,
  );
  assert.equal(end.possibleLinks.length, 1);
  assert.equal(end.analysis.scoreAvailable, true);
  assert.ok(end.status.score < start.status.score);
  assert.ok(end.sources.every((s) => s.status === "simulated"));
  assert.equal(end.current.weather?.type, "rain");
  assert.equal(end.mapEvents.find((e) => e.source === "weather")?.type, "rain");
});
test("one failed feed preserves the other feeds; all-down summary is explicit", () => {
  const result = analyzeStatus(
    "live",
    [
      { source: "weather", status: "unavailable", events: [], updatedAt: null },
      {
        source: "transport",
        status: "simulated",
        events: events.filter((e) => e.source === "transport"),
        updatedAt: at,
      },
    ],
    events,
    at,
  );
  assert.equal(result.current.weather, null);
  assert.ok(result.current.transport);
  assert.equal(result.possibleLinks.length, 0);
  assert.equal(result.sources[0].status, "unavailable");
  const allDown = analyzeStatus(
    "live",
    (["weather", "air_quality", "transport", "local_report"] as const).map(
      (source) => ({
        source,
        status: "unavailable",
        events: [],
        updatedAt: null,
      }),
    ),
    events,
    at,
  );
  assert.ok(allDown.summary.includes("cannot be assessed"));
  assert.equal(allDown.mapEvents.length, 0);
  assert.equal(allDown.possibleLinks.length, 0);
  assert.equal(allDown.analysis.scoreAvailable, false);
  assert.equal(allDown.analysis.activeSources, 0);
});

test("a successful fetch is not enough evidence for a city score", () => {
  const weather = events.filter((event) => event.source === "weather");
  const result = analyzeStatus(
    "live",
    [{ source: "weather", status: "live", events: weather, updatedAt: at }],
    [],
    at,
  );
  assert.equal(result.analysis.activeSources, 1);
  assert.equal(result.analysis.scoreAvailable, false);
  assert.ok(result.summary.includes("partial"));
  const expired = analyzeStatus(
    "live",
    [{ source: "weather", status: "live", events: weather, updatedAt: at }],
    [],
    new Date(Date.parse(at) + 60 * 60_000).toISOString(),
  );
  assert.equal(expired.analysis.activeSources, 0);
  assert.equal(expired.analysis.scoreAvailable, false);
  assert.ok(
    expired.current.weather,
    "Older observations remain visible with their original timestamps",
  );
});
test("actual source collection survives both external APIs failing", async () => {
  const originalFetch = globalThis.fetch;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  globalThis.fetch = async () => {
    throw new Error("Injected upstream outage");
  };
  try {
    const result = await getLiveStatus();
    assert.equal(
      result.sources.filter((s) => s.status === "unavailable").length,
      2,
    );
    assert.equal(
      result.sources.filter((s) => s.status === "simulated").length,
      2,
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (key) process.env.SUPABASE_SERVICE_ROLE_KEY = key;
  }
});
