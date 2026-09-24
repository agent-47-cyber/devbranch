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
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`${field} must be a valid ISO 8601 timestamp.`);
  }

  return value;
}

export function createCityEvent(
  input: CityEventInput,
  receivedAt = new Date().toISOString(),
): CityEvent {
  return {
    ...input,
    observedAt: assertIsoTimestamp(input.observedAt, "observedAt"),
    receivedAt: assertIsoTimestamp(receivedAt, "receivedAt"),
  };
}
