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

export function normalizeTransportRecords(
  records: TransportRecord[],
  receivedAt?: string,
): CityEvent[] {
  return records.map((record) =>
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
