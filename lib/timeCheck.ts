import type { CityEvent } from "@/types/city";

const WINDOW_MINUTES = 30;

export function inWindow(events: CityEvent[], at: string): CityEvent[] {
  const end = Date.parse(at);
  return events.filter((event) => {
    const time = Date.parse(event.observedAt);
    return time <= end && time >= end - WINDOW_MINUTES * 60_000;
  });
}

export function minutesBetween(first: CityEvent, second: CityEvent): number {
  return (
    Math.abs(Date.parse(first.observedAt) - Date.parse(second.observedAt)) /
    60_000
  );
}

export function timeScore(first: CityEvent, second: CityEvent): number {
  return Math.max(
    0,
    Math.min(1, 1 - minutesBetween(first, second) / WINDOW_MINUTES),
  );
}

export function areCloseInTime(first: CityEvent, second: CityEvent): boolean {
  return minutesBetween(first, second) <= WINDOW_MINUTES;
}
