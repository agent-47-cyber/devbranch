import replayData from "@/data/replay.json";
import { normalizeWeatherResponse } from "@/lib/weather";
import { normalizeAirQualityResponse } from "@/lib/airQuality";
import {
  getLocalReportRecords,
  normalizeLocalReportRecords,
} from "@/lib/reports";
import {
  getTransportRecords,
  normalizeTransportRecords,
} from "@/lib/transport";
import type { CityEvent } from "@/types/city";

export const replaySteps = replayData.steps;

/** Replay uses the exact live normalizers. All fixture observations are synthetic. */
export function getReplayEvents(stepIndex: number): CityEvent[] {
  const selected = replaySteps.slice(0, Math.max(0, stepIndex) + 1);
  const at = selected.at(-1)?.at;
  if (!at) return [];
  const events = selected.flatMap((step) => [
    ...normalizeWeatherResponse(
      {
        current: {
          time: step.at,
          temperature_2m: step.weather.temperature,
          precipitation: step.weather.precipitation,
          rain: step.weather.rain,
          wind_speed_10m: step.weather.windSpeed,
          weather_code: step.weather.weatherCode,
        },
      },
      "Malviya Nagar",
      step.at,
    ),
    ...normalizeAirQualityResponse(
      {
        current: {
          time: step.at,
          us_aqi: step.airQuality.aqi,
          pm2_5: step.airQuality.pm2_5,
          pm10: step.airQuality.pm10,
        },
      },
      "Malviya Nagar",
      step.at,
    ),
  ]);
  const local = [
    ...normalizeTransportRecords(getTransportRecords(), at),
    ...normalizeLocalReportRecords(getLocalReportRecords(), at),
  ].filter((event) => Date.parse(event.observedAt) <= Date.parse(at));
  return [...events, ...local].map((event) => ({
    ...event,
    id: `replay-${event.id}`,
    simulated: true,
    metadata: { ...event.metadata, replay: true },
  }));
}
