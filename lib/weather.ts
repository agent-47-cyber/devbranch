import { getJaipurArea } from "@/lib/areas";
import { createCityEvent } from "@/lib/normalize";
import type { CityEvent } from "@/types/city";

export interface OpenMeteoWeatherResponse {
  current?: {
    time: string;
    temperature_2m: number;
    precipitation: number;
    rain: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  current_units?: Partial<{
    temperature_2m: string;
    precipitation: string;
    rain: string;
    wind_speed_10m: string;
  }>;
}

export function normalizeWeatherResponse(
  response: OpenMeteoWeatherResponse,
  areaName: string,
  receivedAt?: string,
): CityEvent[] {
  const current = response.current;

  if (!current) {
    throw new Error("Open-Meteo weather response does not contain current conditions.");
  }

  const area = getJaipurArea(areaName);
  const metadata = { weatherCode: current.weather_code };

  return [
    createCityEvent(
      {
        id: `weather-${areaName.toLowerCase().replaceAll(" ", "-")}-${current.time}-temperature`,
        source: "weather",
        type: "temperature",
        area: area.name,
        latitude: area.latitude,
        longitude: area.longitude,
        observedAt: current.time,
        value: current.temperature_2m,
        unit: response.current_units?.temperature_2m ?? "°C",
        simulated: false,
        metadata,
      },
      receivedAt,
    ),
    createCityEvent(
      {
        id: `weather-${areaName.toLowerCase().replaceAll(" ", "-")}-${current.time}-rain`,
        source: "weather",
        type: "rain",
        area: area.name,
        latitude: area.latitude,
        longitude: area.longitude,
        observedAt: current.time,
        value: current.rain,
        unit: response.current_units?.rain ?? "mm",
        simulated: false,
        metadata,
      },
      receivedAt,
    ),
    createCityEvent(
      {
        id: `weather-${areaName.toLowerCase().replaceAll(" ", "-")}-${current.time}-precipitation`,
        source: "weather",
        type: "precipitation",
        area: area.name,
        latitude: area.latitude,
        longitude: area.longitude,
        observedAt: current.time,
        value: current.precipitation,
        unit: response.current_units?.precipitation ?? "mm",
        simulated: false,
        metadata,
      },
      receivedAt,
    ),
    createCityEvent(
      {
        id: `weather-${areaName.toLowerCase().replaceAll(" ", "-")}-${current.time}-wind-speed`,
        source: "weather",
        type: "wind_speed",
        area: area.name,
        latitude: area.latitude,
        longitude: area.longitude,
        observedAt: current.time,
        value: current.wind_speed_10m,
        unit: response.current_units?.wind_speed_10m ?? "km/h",
        simulated: false,
        metadata,
      },
      receivedAt,
    ),
  ];
}
