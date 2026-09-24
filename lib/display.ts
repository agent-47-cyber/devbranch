import type { CityEvent } from "@/types/city";
export function timeLabel(at: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(at));
}
export function eventLabel(event: CityEvent): string {
  const labels: Record<string, string> = {
    rain: "Rainfall",
    aqi: "US air quality index",
    delay: "Average delay",
    waterlogging: "Waterlogging",
  };
  return labels[event.type] ?? event.type.replaceAll("_", " ");
}
