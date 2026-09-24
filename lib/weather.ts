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

let cachedWeather: { events: CityEvent[]; timestamp: number } | null = null;

export async function fetchWeatherEvents(
  location: SourceLocation,
): Promise<CityEvent[]> {
  const now = Date.now();
  if (cachedWeather && now - cachedWeather.timestamp < 5 * 60_000) {
    return cachedWeather.events;
  }

  try {
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

    if (response.ok) {
      const data = (await response.json()) as OpenMeteoWeatherResponse;
      const events = normalizeWeatherResponse(data, location);
      cachedWeather = { events, timestamp: now };
      return events;
    }
    console.warn(`Open-Meteo weather API returned HTTP ${response.status}. Serving resilient fallback.`);
  } catch (err) {
    console.warn("Open-Meteo weather fetch error:", err);
  }

  if (cachedWeather) {
    return cachedWeather.events;
  }

  // Graceful fallback baseline for Jaipur if external API is rate-limited (429)
  const fallbackTime = new Date().toISOString().slice(0, 16);
  return normalizeWeatherResponse(
    {
      current: {
        time: fallbackTime,
        temperature_2m: 26.2,
        precipitation: 0.0,
        rain: 0.0,
        wind_speed_10m: 7.8,
        weather_code: 0,
      },
      current_units: {
        temperature_2m: "°C",
        precipitation: "mm",
        rain: "mm",
        wind_speed_10m: "km/h",
      },
    },
    location,
  ).map((ev) => ({
    ...ev,
    simulated: true,
  }));
}
