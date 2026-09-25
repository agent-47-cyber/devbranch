import transportData from "@/data/transport.json";
import { createCityEvent } from "@/lib/normalize";
import type { CityEvent } from "@/types/city";

export interface TransportRecord {
  id: string;
  area: string;
  route: string;
  delay: number;
  observedAt: string;
  latitude: number;
  longitude: number;
}

export function getTransportRecords(): TransportRecord[] {
  return transportData as TransportRecord[];
}

/**
 * Shift simulated timestamps so the latest record is 5 minutes before now.
 * Preserves relative gaps between readings.
 */
function shiftToNow(records: TransportRecord[]): TransportRecord[] {
  if (records.length === 0) return records;
  const timestamps = records.map((r) => Date.parse(r.observedAt));
  const latest = Math.max(...timestamps);
  const anchor = Date.now() - 5 * 60_000; // 5 min ago
  const offset = anchor - latest;
  return records.map((r) => ({
    ...r,
    observedAt: new Date(Date.parse(r.observedAt) + offset).toISOString(),
  }));
}

export function normalizeTransportRecords(
  records: TransportRecord[],
  receivedAt?: string,
): CityEvent[] {
  return shiftToNow(records).map((record) =>
    createCityEvent(
      {
        id: record.id,
        source: "transport",
        type: "delay",
        area: record.area,
        latitude: record.latitude,
        longitude: record.longitude,
        observedAt: record.observedAt,
        value: record.delay,
        unit: "minutes",
        simulated: true,
        metadata: { route: record.route },
      },
      receivedAt,
    ),
  );
}
