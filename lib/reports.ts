import reportData from "@/data/reports.json";
import { createCityEvent } from "@/lib/normalize";
import type { CityEvent } from "@/types/city";

export type LocalReportType =
  | "waterlogging"
  | "road blockage"
  | "traffic signal problem"
  | "power outage"
  | "fallen tree";

export interface LocalReportRecord {
  id: string;
  type: LocalReportType;
  area: string;
  count: number;
  observedAt: string;
  latitude: number;
  longitude: number;
}

export function getLocalReportRecords(): LocalReportRecord[] {
  return reportData as LocalReportRecord[];
}

/**
 * Shift simulated timestamps so the latest record is 5 minutes before now.
 */
function shiftToNow(records: LocalReportRecord[]): LocalReportRecord[] {
  if (records.length === 0) return records;
  const timestamps = records.map((r) => Date.parse(r.observedAt));
  const latest = Math.max(...timestamps);
  const anchor = Date.now() - 5 * 60_000;
  const offset = anchor - latest;
  return records.map((r) => ({
    ...r,
    observedAt: new Date(Date.parse(r.observedAt) + offset).toISOString(),
  }));
}

export function normalizeLocalReportRecords(
  records: LocalReportRecord[],
  receivedAt?: string,
  shouldShiftToNow = false,
): CityEvent[] {
  const prepared = shouldShiftToNow ? shiftToNow(records) : records;
  return prepared.map((record) =>
    createCityEvent(
      {
        id: record.id,
        source: "local_report",
        type: record.type,
        area: record.area,
        latitude: record.latitude,
        longitude: record.longitude,
        observedAt: record.observedAt,
        value: record.count,
        unit: "reports",
        simulated: true,
      },
      receivedAt,
    ),
  );
}
