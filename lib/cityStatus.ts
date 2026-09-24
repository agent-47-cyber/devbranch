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

  // Real urban baseline friction: account for atmospheric AQI, transit delay, and daily civic intake.
  // A living city never has 100/100; healthy baseline operates realistically at ~86-90.
  const activeEvents = [...latest.values()];
  const aqiEvent = activeEvents.find((e) => e.type === "aqi");
  const delayEvent = activeEvents.find((e) => e.type === "delay");
  const reportsCount = activeEvents
    .filter((e) => e.source === "local_report")
    .reduce((sum, e) => sum + e.value, 0);

  const aqiFriction = aqiEvent
    ? Math.max(2, Math.min(16, Math.round((aqiEvent.value - 35) * 0.08)))
    : 4;
  const transitFriction = delayEvent
    ? Math.max(2, Math.min(15, Math.round(delayEvent.value * 0.7)))
    : 3;
  const civicFriction = Math.max(2, Math.min(10, Math.round(reportsCount * 0.35)));

  // Baseline urban drag naturally brings the nominal ceiling to ~87-91
  const urbanFriction = Math.max(9, Math.min(26, aqiFriction + transitFriction + civicFriction));

  const strongestLink = links[0];
  const linkImpact = strongestLink ? strongestLink.linkScore * 38 : 0;
  const signalImpact = Math.min(22, unusualEvents.length * 4);

  const score = Math.round(
    Math.max(15, Math.min(93, 100 - urbanFriction - linkImpact - signalImpact)),
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
