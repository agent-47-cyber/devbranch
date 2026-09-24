import { inWindow } from "@/lib/timeCheck";
import type { CityEvent, CivicAlert, PossibleLink } from "@/types/city";

// Demonstration thresholds only; these are not official emergency limits.
const rules = [
  { source: "weather", type: "rain", unit: "mm", threshold: 10, title: "Rainfall is elevated" },
  { source: "air_quality", type: "aqi", unit: "US AQI", threshold: 150, title: "Air quality needs attention" },
  { source: "transport", type: "delay", unit: "minutes", threshold: 15, title: "Longer transport delays" },
  { source: "local_report", type: "waterlogging", unit: "reports", threshold: 10, title: "Waterlogging reports are elevated" },
] as const;

export function createAlerts(
  events: CityEvent[],
  at: string,
  links: PossibleLink[] = [],
): CivicAlert[] {
  const latest = new Map<string, CityEvent>();
  for (const event of events) {
    if (Date.parse(event.observedAt) > Date.parse(at)) continue;
    const key = `${event.area}|${event.source}|${event.type}|${event.unit}`;
    const prior = latest.get(key);
    if (!prior || Date.parse(event.observedAt) > Date.parse(prior.observedAt))
      latest.set(key, event);
  }
  return inWindow([...latest.values()], at)
    .flatMap((event): CivicAlert[] => {
      const rule = rules.find(
        (candidate) =>
          candidate.source === event.source &&
          candidate.type === event.type &&
          candidate.unit === event.unit &&
          event.value >= candidate.threshold,
      );
      if (!rule) return [];
      return [{
        id: `alert-${event.id}`,
        eventId: event.id,
        source: event.source,
        area: event.area,
        title: rule.title,
        summary: `${event.value} ${event.unit} observed in ${event.area}.`,
        value: event.value,
        unit: event.unit,
        threshold: rule.threshold,
        observedAt: event.observedAt,
        simulated: event.simulated,
        linked: links.some((link) => link.eventIds.includes(event.id)),
      }];
    })
    .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt));
}
