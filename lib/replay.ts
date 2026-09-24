import replayData from "@/data/replay.json";
import days from "@/data/replayDays.json";
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
export const replayDays = days;
export const defaultReplayDay = replayDays.length - 1;

function shiftTime(at: string, offsetDays: number): string {
  return new Date(Date.parse(at) + offsetDays * 86_400_000).toISOString();
}

export function getReplaySteps(dayIndex = defaultReplayDay) {
  const day = replayDays[dayIndex];
  if (!day) throw new Error("Unknown replay day.");
  return replaySteps.map((step) => ({
    ...step,
    at: shiftTime(step.at, day.offsetDays),
    weather: {
      ...step.weather,
      rain: Number((step.weather.rain * day.rainScale).toFixed(1)),
      precipitation: Number((step.weather.precipitation * day.rainScale).toFixed(1)),
      weatherCode: day.rainScale === 0 ? 1 : step.weather.weatherCode,
    },
  }));
}

/** Replay uses the exact live normalizers. All fixture observations are synthetic. */
export function getReplayEvents(
  stepIndex: number,
  dayIndex = defaultReplayDay,
): CityEvent[] {
  const day = replayDays[dayIndex];
  const selected = getReplaySteps(dayIndex).slice(0, Math.max(0, stepIndex) + 1);
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
    ...normalizeTransportRecords(
      getTransportRecords().map((record) => ({
        ...record,
        delay: Math.min(record.delay, day.delayCap),
        observedAt: shiftTime(record.observedAt, day.offsetDays),
      })),
      at,
    ),
    ...normalizeLocalReportRecords(
      getLocalReportRecords().map((record) => ({
        ...record,
        count: Math.min(record.count, day.reportCap),
        observedAt: shiftTime(record.observedAt, day.offsetDays),
      })),
      at,
    ),
  ].filter((event) => Date.parse(event.observedAt) <= Date.parse(at));
  return [...events, ...local].map((event) => ({
    ...event,
    id: `replay-${day.date}-${event.id}`,
    simulated: true,
    metadata: { ...event.metadata, replay: true, scenarioDate: day.date },
  }));
}
