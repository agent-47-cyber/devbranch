import type { CityEvent } from "@/types/city";

const WINDOW_MS = 30 * 60_000;

export function isCurrentMapEvent(event: CityEvent, at: string): boolean {
  const age = Date.parse(at) - Date.parse(event.observedAt);
  return Number.isFinite(age) && age >= 0 && age <= WINDOW_MS;
}

export function latestAreaEvent(
  events: CityEvent[],
  area: string,
  source: CityEvent["source"],
): CityEvent | null {
  return (
    events
      .filter((event) => event.area === area && event.source === source)
      .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt))[0] ??
    null
  );
}

export function currentIncidentCount(
  events: CityEvent[],
  area: string,
  at: string,
): number {
  const report = latestAreaEvent(events, area, "local_report");
  return report && isCurrentMapEvent(report, at) ? report.value : 0;
}

export function incidentTitle(event: CityEvent): string {
  const labels: Record<string, string> = {
    waterlogging: "Waterlogging reports",
    "road blockage": "Road blockage reports",
    "traffic signal problem": "Traffic signal reports",
    "power outage": "Power outage reports",
    "fallen tree": "Fallen tree reports",
    delay: "Transport delay",
  };
  return labels[event.type] ?? `${event.type} reports`;
}
