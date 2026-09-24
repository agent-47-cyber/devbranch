import { getJaipurArea } from "@/lib/areas";
import { createCityEvent } from "@/lib/normalize";
import type { CityEvent } from "@/types/city";

export interface OpenMeteoAirQualityResponse {
  current?: {
    time: string;
    us_aqi: number;
    pm2_5: number;
    pm10: number;
  };
  current_units?: Partial<{
    us_aqi: string;
    pm2_5: string;
    pm10: string;
  }>;
}

export function normalizeAirQualityResponse(
  response: OpenMeteoAirQualityResponse,
  areaName: string,
  receivedAt?: string,
): CityEvent[] {
  const current = response.current;

  if (!current) {
    throw new Error("Open-Meteo air-quality response does not contain current conditions.");
  }

  const area = getJaipurArea(areaName);
  const idPrefix = `air-quality-${areaName.toLowerCase().replaceAll(" ", "-")}-${current.time}`;

  return [
    createCityEvent(
      {
        id: `${idPrefix}-aqi`,
        source: "air_quality",
        type: "aqi",
        area: area.name,
        latitude: area.latitude,
        longitude: area.longitude,
        observedAt: current.time,
        value: current.us_aqi,
        unit: response.current_units?.us_aqi ?? "US AQI",
        simulated: false,
      },
      receivedAt,
    ),
    createCityEvent(
      {
        id: `${idPrefix}-pm2-5`,
        source: "air_quality",
        type: "pm2_5",
        area: area.name,
        latitude: area.latitude,
        longitude: area.longitude,
        observedAt: current.time,
        value: current.pm2_5,
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
        area: area.name,
        latitude: area.latitude,
        longitude: area.longitude,
        observedAt: current.time,
        value: current.pm10,
        unit: response.current_units?.pm10 ?? "μg/m³",
        simulated: false,
      },
      receivedAt,
    ),
  ];
}
