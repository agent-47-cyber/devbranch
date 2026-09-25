import { fetchAirQualityEvents } from "@/lib/airQuality";
import { getJaipurArea } from "@/lib/areas";
import { createCityStatus } from "@/lib/cityStatus";
import { findPossibleLinks } from "@/lib/findLinks";
import {
  defaultReplayDay,
  getReplayEvents,
  getReplaySteps,
  replaySteps,
} from "@/lib/replay";
import { createAlerts } from "@/lib/alerts";
import {
  getLocalReportRecords,
  normalizeLocalReportRecords,
} from "@/lib/reports";
import {
  createSourceResponse,
  persistSourceResponse,
} from "@/lib/sourceResponse";
import {
  getSourceStatuses,
  hasServerSupabaseConfig,
  queryRecentEvents,
  upsertPossibleLinks,
} from "@/lib/supabase/server";
import { createSummary, createWhyItMatters } from "@/lib/summary";
import {
  getTransportRecords,
  normalizeTransportRecords,
} from "@/lib/transport";
import { inWindow } from "@/lib/timeCheck";
import { detectUnusual } from "@/lib/unusual";
import { fetchWeatherEvents } from "@/lib/weather";
import type {
  CityEvent,
  CitySource,
  CityStatusResponse,
  CurrentSituation,
  RecentUpdate,
  SourceResponse,
  SourceStatusRecord,
} from "@/types/city";

const primaryTypes = [
  "rain",
  "aqi",
  "delay",
  "waterlogging",
  "road blockage",
  "traffic signal problem",
  "power outage",
  "fallen tree",
];
const sources: CitySource[] = [
  "weather",
  "air_quality",
  "transport",
  "local_report",
];

function latest(
  events: CityEvent[],
  source: CitySource,
  type?: string,
): CityEvent | null {
  return (
    events
      .filter(
        (event) => event.source === source && (!type || event.type === type),
      )
      .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt))[0] ??
    null
  );
}

export function analyzeStatus(
  mode: "live" | "replay",
  responses: SourceResponse[],
  history: CityEvent[],
  at: string,
): CityStatusResponse {
  const available = new Set(
    responses
      .filter((source) => source.status !== "unavailable")
      .map((source) => source.source),
  );
  const events = [
    ...new Map(
      [...history, ...responses.flatMap((response) => response.events)]
        .filter(
          (event) =>
            available.has(event.source) &&
            !(
              mode === "live" &&
              event.simulated &&
              ["weather", "air_quality"].includes(event.source)
            ) &&
            Date.parse(event.observedAt) <= Date.parse(at),
        )
        .map((event) => [event.id, event]),
    ).values(),
  ];
  const active = inWindow(events, at);
  const possibleLinks = findPossibleLinks(events, at);
  const status = createCityStatus(events, possibleLinks, at);
  // Display latest source readings even when older than the analysis window; timestamps are visible.
  const readings = responses
    .flatMap((response) => response.events)
    .filter((event) => Date.parse(event.observedAt) <= Date.parse(at));
  const focus = readings.filter(
    (event) => event.area === (status.area ?? "Malviya Nagar"),
  );
  const current: CurrentSituation = {
    weather:
      latest(focus, "weather", "rain") ?? latest(readings, "weather", "rain"),
    airQuality:
      latest(focus, "air_quality", "aqi") ??
      latest(readings, "air_quality", "aqi"),
    transport: latest(focus, "transport"),
    reports: latest(focus, "local_report"),
  };
  const titles: Record<string, string> = {
    rain: "Rain increased",
    aqi: "Air quality changed",
    delay: "Transport delays increased",
    waterlogging: "Waterlogging reports increased",
  };
  const updates: RecentUpdate[] = active
    .filter(
      (event) =>
        primaryTypes.includes(event.type) &&
        detectUnusual(event, events, at).unusual,
    )
    .filter((event) => {
      const previous = events
        .filter(
          (other) =>
            other.area === event.area &&
            other.type === event.type &&
            other.source === event.source &&
            Date.parse(other.observedAt) < Date.parse(event.observedAt),
        )
        .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt))[0];
      return !previous || event.value > previous.value;
    })
    .map((event) => ({
      id: event.id,
      at: event.observedAt,
      area: event.area,
      source: event.source,
      title: titles[event.type] ?? `${event.type} reports increased`,
      detail: `${event.value} ${event.unit} · ${event.area}`,
    }));
  updates.push(
    ...possibleLinks.map((link) => ({
      id: link.id,
      at: link.endTime,
      area: link.area,
      source: "possible_link" as const,
      title: "Possible Link found",
      detail: "Unusual signals, close in time and location.",
    })),
  );
  const mapped = new Map<string, CityEvent>();
  for (const event of readings
    .filter((event) => primaryTypes.includes(event.type))
    .sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt))) {
    mapped.set(`${event.area}-${event.source}-${event.type}`, event);
  }
  const unavailable = responses.filter(
    (response) => response.status === "unavailable",
  ).length;
  const primaryActive = active.filter((event) =>
    primaryTypes.includes(event.type),
  );
  const activeSources = new Set(primaryActive.map((event) => event.source))
    .size;
  const baselineSources = new Set(
    primaryActive
      .filter((event) =>
        events.some(
          (prior) =>
            prior.source === event.source &&
            prior.type === event.type &&
            prior.area === event.area &&
            prior.unit === event.unit &&
            Date.parse(prior.observedAt) < Date.parse(event.observedAt) &&
            Date.parse(prior.observedAt) >=
              Date.parse(event.observedAt) - 3 * 60 * 60_000,
        ),
      )
      .map((event) => event.source),
  ).size;
  const scoreAvailable = activeSources >= 3 && baselineSources >= 3;
  const explanation = scoreAvailable
    ? "An internal change score, not an official city health rating. Higher means fewer unusual changes in the available feeds."
    : `Only ${activeSources} of 4 feeds have observations inside the 30-minute window; ${baselineSources} have comparison history. A city score is withheld until at least 3 feeds have both.`;
  return {
    mode,
    city: "Jaipur",
    updatedAt: at,
    status,
    analysis: { activeSources, baselineSources, scoreAvailable, explanation },
    summary:
      unavailable === 4
        ? "All four feeds are temporarily unavailable. Current conditions cannot be assessed."
        : !scoreAvailable
          ? mode === "replay"
            ? "This scenario is still building comparison history. Move through the timeline to see which changes become unusual and when a possible link appears."
            : `The live picture is partial.${current.weather ? ` Latest rainfall: ${current.weather.value} ${current.weather.unit} in ${current.weather.area}.` : ""}${current.airQuality ? ` Latest US AQI: ${current.airQuality.value} in ${current.airQuality.area}.` : ""} Readings have different timestamps; older observations are excluded from the analysis.`
          : createSummary(status, possibleLinks[0]) +
            (unavailable
              ? " Some feeds are unavailable; this view is incomplete."
              : ""),
    whyItMatters: scoreAvailable
      ? createWhyItMatters(status, possibleLinks[0])
      : "Missing evidence is not an all-clear. Use the timestamped public readings as context; simulated reports do not describe current road conditions.",
    current,
    possibleLinks,
    alerts: createAlerts(events, at, possibleLinks),
    recentUpdates: updates
      .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
      .slice(-8),
    mapEvents: [...mapped.values()],
    observationHistory: events.filter(
      (event) =>
        primaryTypes.includes(event.type) &&
        Date.parse(event.observedAt) >= Date.parse(at) - 3 * 60 * 60_000,
    ),
    sources: responses.map((response) => ({
      source: response.source,
      status: response.status,
      lastSuccess:
        response.status === "unavailable" ? null : response.updatedAt,
      lastAttempt: at,
      updatedAt: at,
      error: response.message ?? null,
    })),
  };
}

async function collect(
  source: CitySource,
  state: SourceResponse["status"],
  fn: () => Promise<CityEvent[]>,
): Promise<SourceResponse> {
  let response: SourceResponse;
  try {
    const events = await fn();
    const isSimulated = events.some((event) => event.simulated);
    response = createSourceResponse(
      source,
      isSimulated && state === "live" ? "simulated" : state,
      events,
    );
  } catch {
    response = createSourceResponse(
      source,
      "unavailable",
      [],
      "Temporarily unavailable. CityPulse is continuing with the other feeds.",
    );
  }
  await persistSourceResponse(response);
  return response;
}

export async function getLiveStatus(
  areaName = "Malviya Nagar",
): Promise<CityStatusResponse> {
  // Fetch weather + AQ for the 3 primary areas simultaneously.
  const liveAreas = ["Malviya Nagar", "Mansarovar", "Vaishali Nagar"] as const;

  const [weatherResults, aqResults] = await Promise.all([
    Promise.allSettled(
      liveAreas.map((name) => {
        const a = getJaipurArea(name);
        return fetchWeatherEvents({ area: a.name, latitude: a.latitude, longitude: a.longitude });
      }),
    ),
    Promise.allSettled(
      liveAreas.map((name) => {
        const a = getJaipurArea(name);
        return fetchAirQualityEvents({ area: a.name, latitude: a.latitude, longitude: a.longitude });
      }),
    ),
  ]);

  const allWeatherEvents = weatherResults.flatMap((r) =>
    r.status === "fulfilled" ? r.value : [],
  );
  const allAqEvents = aqResults.flatMap((r) =>
    r.status === "fulfilled" ? r.value : [],
  );
  const weatherOk = allWeatherEvents.length > 0;
  const aqOk = allAqEvents.length > 0;

  const responses: SourceResponse[] = [
    createSourceResponse("weather", weatherOk ? "live" : "unavailable", allWeatherEvents,
      weatherOk ? undefined : "Temporarily unavailable. CityPulse is continuing with the other feeds."),
    createSourceResponse("air_quality", aqOk ? "live" : "unavailable", allAqEvents,
      aqOk ? undefined : "Temporarily unavailable. CityPulse is continuing with the other feeds."),
    await collect("transport", "simulated", async () =>
      normalizeTransportRecords(getTransportRecords()),
    ),
    await collect("local_report", "simulated", async () =>
      normalizeLocalReportRecords(getLocalReportRecords()),
    ),
  ];
  // Persist weather + AQ responses
  await Promise.allSettled([
    persistSourceResponse(responses[0]),
    persistSourceResponse(responses[1]),
  ]);
  const at = new Date().toISOString();
  let history: CityEvent[] = [];
  let storedStatuses: SourceStatusRecord[] = [];
  if (hasServerSupabaseConfig()) {
    const stored = await Promise.allSettled([
      queryRecentEvents(
        new Date(Date.parse(at) - 3 * 60 * 60_000).toISOString(),
        1000,
      ),
      getSourceStatuses(),
    ]);
    if (stored[0].status === "fulfilled")
      history = stored[0].value.filter(
        (event) => !event.id.startsWith("replay-"),
      );
    if (stored[1].status === "fulfilled") storedStatuses = stored[1].value;
  }
  const result = analyzeStatus("live", responses, history, at);
  result.sources = result.sources.map((source) => ({
    ...source,
    lastSuccess:
      source.lastSuccess ??
      storedStatuses.find((saved) => saved.source === source.source)
        ?.lastSuccess ??
      null,
  }));
  if (hasServerSupabaseConfig() && result.possibleLinks.length) {
    try {
      await upsertPossibleLinks(result.possibleLinks);
    } catch {
      console.warn(
        "CityPulse could not save possible links; current results remain available.",
      );
    }
  }
  return result;
}

export async function getReplayStatus(
  stepIndex: number,
  dayIndex = defaultReplayDay,
): Promise<CityStatusResponse> {
  const step = Math.max(0, Math.min(stepIndex, replaySteps.length - 1));
  const events = getReplayEvents(step, dayIndex);
  const responses = sources.map((source) =>
    createSourceResponse(
      source,
      "simulated",
      events.filter((event) => event.source === source),
    ),
  );
  return analyzeStatus(
    "replay",
    responses,
    [],
    getReplaySteps(dayIndex)[step].at,
  );
}

export const replayStepCount = replaySteps.length;
