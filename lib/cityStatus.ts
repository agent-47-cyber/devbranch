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
  const delayEvent = activeEvents.find((e) => e.type === "delay");
  const aqiEvent = activeEvents.find((e) => e.type === "aqi");
  const rainEvent = activeEvents.find((e) => e.type === "rain");
  const reportsCount = activeEvents
    .filter((e) => e.source === "local_report")
    .reduce((sum, e) => sum + e.value, 0);

  // Component Scores (0-100) mapped from observed values
  const mobilityScore = delayEvent ? Math.max(0, 100 - delayEvent.value * 3) : 100;
  const aqiScore = aqiEvent ? Math.max(0, 100 - Math.round(aqiEvent.value / 3.5)) : 100;
  const weatherScore = rainEvent ? Math.max(0, 100 - rainEvent.value * 5) : 100;
  const incidentsScore = Math.max(0, 100 - Math.round(reportsCount * 6.67));

  // Weighted health across current civic signals
  // Renormalized to 100% since Cleanliness (10%) is excluded from current feeds. (Sum = 90)
  const score = Math.round(
    mobilityScore * (30 / 90) +
    aqiScore * (25 / 90) +
    weatherScore * (20 / 90) +
    incidentsScore * (15 / 90)
  );
  
  const strongestLink = links[0];

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
