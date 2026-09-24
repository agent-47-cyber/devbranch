import type {
  CityEvent,
  CityStatus,
  CityStatusLabel,
  PossibleLink,
} from "@/types/city";
import { detectUnusual } from "@/lib/unusual";
import { inWindow } from "@/lib/timeCheck";

function labelForScore(score: number): CityStatusLabel {
  if (score >= 80) return "Stable";
  if (score >= 65) return "Watch";
  if (score >= 45) return "Elevated";
  return "High";
}

export function createCityStatus(
  events: CityEvent[],
  links: PossibleLink[],
  at = new Date().toISOString(),
): CityStatus {
  const latest = new Map<string, CityEvent>();
  for (const event of inWindow(events, at).sort(
    (a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt),
  )) {
    if (
      [
        "rain",
        "aqi",
        "delay",
        "waterlogging",
        "road blockage",
        "traffic signal problem",
        "power outage",
        "fallen tree",
      ].includes(event.type)
    )
      latest.set(`${event.area}-${event.source}-${event.type}`, event);
  }
  const unusualEvents = [...latest.values()]
    .map((event) => ({ event, result: detectUnusual(event, events, at) }))
    .filter(({ result }) => result.unusual);

  const activeEvents = [...latest.values()];
  const strongest = (type: string) =>
    activeEvents
      .filter((e) => e.type === type)
      .sort((a, b) => b.value - a.value)[0];
  const delayEvent = strongest("delay");
  const aqiEvent = strongest("aqi");
  const rainEvent = strongest("rain");
  const reportsCount = activeEvents
    .filter((e) => e.source === "local_report")
    .reduce((sum, e) => sum + e.value, 0);

  // Prototype weights apply only to observed signals. Missing feeds add no invented penalty;
  // analyzeStatus separately withholds the score when comparable coverage is insufficient.
  const aqiFriction = aqiEvent
    ? Math.max(0, Math.min(18, Math.round((aqiEvent.value - 30) * 0.1)))
    : 0;
  const transitFriction = delayEvent
    ? Math.max(0, Math.min(20, Math.round(delayEvent.value * 0.8)))
    : 0;
  const rainFriction = rainEvent
    ? Math.min(15, Math.round(rainEvent.value * 2.5))
    : 0;
  const civicFriction = Math.max(
    0,
    Math.min(15, Math.round(reportsCount * 0.4)),
  );

  const urbanFriction = Math.min(
    30,
    aqiFriction + transitFriction + rainFriction + civicFriction,
  );

  const strongestLink = links[0];
  const linkImpact = strongestLink ? strongestLink.linkScore * 35 : 0;
  const signalImpact = Math.min(25, unusualEvents.length * 4.5);

  // Score Formula: 100 Base - Natural Friction - Active Anomalies - Linked Cascades
  const score = Math.round(
    Math.max(
      15,
      Math.min(100, 100 - urbanFriction - linkImpact - signalImpact),
    ),
  );

  return {
    score,
    label: labelForScore(score),
    area:
      strongestLink?.area ??
      unusualEvents.sort(
        (first, second) => second.result.score - first.result.score,
      )[0]?.event.area ??
      null,
  };
}
