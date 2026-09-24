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
  const strongestLink = links[0];
  const linkImpact = strongestLink ? strongestLink.linkScore * 42 : 0;
  const signalImpact = Math.min(16, unusualEvents.length * 3);
  const score = Math.round(
    Math.max(0, Math.min(100, 100 - linkImpact - signalImpact)),
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
