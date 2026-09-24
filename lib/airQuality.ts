import { getJaipurArea } from "@/lib/areas";
import { createCityEvent } from "@/lib/normalize";
import type { SourceLocation } from "@/lib/weather";
import type { CityEvent } from "@/types/city";

export interface OpenMeteoAirQualityResponse {
  current?: {
    time: string;
    us_aqi: number | null;
    pm2_5: number | null;
    pm10: number | null;
  };
  current_units?: Partial<{
    us_aqi: string;
    pm2_5: string;
    pm10: string;
  }>;
}

function requireAirQualityValue(
  value: number | null | undefined,
  name: string,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(
      `Open-Meteo air-quality response has no valid ${name} value.`,
    );
  }

  return value;
}

export function normalizeAirQualityResponse(
  response: OpenMeteoAirQualityResponse,
  location: SourceLocation | string,
  receivedAt?: string,
): CityEvent[] {
  const current = response.current;

  if (!current) {
    throw new Error(
      "Open-Meteo air-quality response does not contain current conditions.",
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
  const idPrefix = `air-quality-${area.area.toLowerCase().replaceAll(" ", "-")}-${current.time}`;

  return [
    createCityEvent(
      {
        id: `${idPrefix}-aqi`,
        source: "air_quality",
        type: "aqi",
        area: area.area,
        latitude: area.latitude,
        longitude: area.longitude,
        observedAt: current.time,
        value: requireAirQualityValue(current.us_aqi, "US AQI"),
        unit: "US AQI",
        simulated: false,
      },
      receivedAt,
    ),
    createCityEvent(
      {
        id: `${idPrefix}-pm2-5`,
        source: "air_quality",
        type: "pm2_5",
        area: area.area,
        latitude: area.latitude,
        longitude: area.longitude,
        observedAt: current.time,
        value: requireAirQualityValue(current.pm2_5, "PM2.5"),
        unit: response.current_units?.pm2_5 ?? "μg/m³",
        simulated: false,
      },
      receivedAt,
    ),
    createCityEvent(
      {
        id: `${idPrefix}-pm10`,
        source: "air_quality",
        type: "pm10",
        area: area.area,
        latitude: area.latitude,
        longitude: area.longitude,
        observedAt: current.time,
        value: requireAirQualityValue(current.pm10, "PM10"),
        unit: response.current_units?.pm10 ?? "μg/m³",
        simulated: false,
      },
      receivedAt,
    ),
  ];
}

export async function fetchAirQualityEvents(
  location: SourceLocation,
): Promise<CityEvent[]> {
  const parameters = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "us_aqi,pm2_5,pm10",
  });
  const response = await fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?${parameters}`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Open-Meteo air-quality request failed with HTTP ${response.status}.`,
    );
  }

  return normalizeAirQualityResponse(
    (await response.json()) as OpenMeteoAirQualityResponse,
    location,
  );
}
