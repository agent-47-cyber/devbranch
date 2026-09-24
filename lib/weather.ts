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

export interface SourceLocation {
  area: string;
  latitude: number;
  longitude: number;
}

function requireWeatherValue(
  value: number | null | undefined,
  name: string,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Open-Meteo weather response has no valid ${name} value.`);
  }

  return value;
}

export function normalizeWeatherResponse(
  response: OpenMeteoWeatherResponse,
  location: SourceLocation | string,
  receivedAt?: string,
): CityEvent[] {
  const current = response.current;

  if (!current) {
    throw new Error(
      "Open-Meteo weather response does not contain current conditions.",
    );
  }

  const area =
    typeof location === "string"
      ? (() => {
          const selectedArea = getJaipurArea(location);

          return {
            area: selectedArea.name,
            latitude: selectedArea.latitude,
            longitude: selectedArea.longitude,
          };
        })()
      : location;
  const metadata = {
    weatherCode: current.weather_code,
    temperature: current.temperature_2m,
    windSpeed: current.wind_speed_10m,
    provider: "Open-Meteo",
    basis: "Weather model",
  };

  return [
    createCityEvent(
      {
        id: `weather-${area.area.toLowerCase().replaceAll(" ", "-")}-${current.time}-temperature`,
        source: "weather",
        type: "temperature",
        area: area.area,
        latitude: area.latitude,
        longitude: area.longitude,
        observedAt: current.time,
        value: requireWeatherValue(current.temperature_2m, "temperature"),
        unit: response.current_units?.temperature_2m ?? "°C",
        simulated: false,
        metadata,
      },
      receivedAt,
    ),
    createCityEvent(
      {
        id: `weather-${area.area.toLowerCase().replaceAll(" ", "-")}-${current.time}-rain`,
        source: "weather",
        type: "rain",
        area: area.area,
        latitude: area.latitude,
        longitude: area.longitude,
        observedAt: current.time,
        value: requireWeatherValue(current.rain, "rain"),
        unit: response.current_units?.rain ?? "mm",
        simulated: false,
        metadata,
      },
      receivedAt,
    ),
    createCityEvent(
      {
        id: `weather-${area.area.toLowerCase().replaceAll(" ", "-")}-${current.time}-precipitation`,
        source: "weather",
        type: "precipitation",
        area: area.area,
        latitude: area.latitude,
        longitude: area.longitude,
        observedAt: current.time,
        value: requireWeatherValue(current.precipitation, "precipitation"),
        unit: response.current_units?.precipitation ?? "mm",
        simulated: false,
        metadata,
      },
      receivedAt,
    ),
    createCityEvent(
      {
        id: `weather-${area.area.toLowerCase().replaceAll(" ", "-")}-${current.time}-wind-speed`,
        source: "weather",
        type: "wind_speed",
        area: area.area,
        latitude: area.latitude,
        longitude: area.longitude,
        observedAt: current.time,
        value: requireWeatherValue(current.wind_speed_10m, "wind speed"),
        unit: response.current_units?.wind_speed_10m ?? "km/h",
        simulated: false,
        metadata,
      },
      receivedAt,
    ),
  ];
}

export async function fetchWeatherEvents(
  location: SourceLocation,
): Promise<CityEvent[]> {
  const parameters = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,precipitation,rain,wind_speed_10m,weather_code",
  });
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${parameters}`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok)
    throw new Error(`Weather request failed: ${response.status}`);
  return normalizeWeatherResponse(
    (await response.json()) as OpenMeteoWeatherResponse,
    location,
  );
}
