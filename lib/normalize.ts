import type { CityEvent, CitySource } from "@/types/city";

export interface CityEventInput {
  id: string;
  source: CitySource;
  type: string;
  area: string;
  latitude: number;
  longitude: number;
  observedAt: string;
  value: number;
  unit: string;
  simulated: boolean;
  metadata?: Record<string, unknown>;
}

function assertIsoTimestamp(value: string, field: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new Error(`${field} must be a valid ISO 8601 timestamp.`);
  }

  const zoned = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
  return new Date(zoned).toISOString();
}

export function createCityEvent(
  input: CityEventInput,
  receivedAt = new Date().toISOString(),
): CityEvent {
  if (
    ![input.value, input.latitude, input.longitude].every(Number.isFinite) ||
    Math.abs(input.latitude) > 90 ||
    Math.abs(input.longitude) > 180
  ) {
    throw new Error("CityEvent needs a finite value and valid coordinates.");
  }
  return {
    ...input,
    observedAt: assertIsoTimestamp(input.observedAt, "observedAt"),
    receivedAt: assertIsoTimestamp(receivedAt, "receivedAt"),
  };
}
