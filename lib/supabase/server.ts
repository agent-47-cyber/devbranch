import { createClient } from "@supabase/supabase-js";
import type { CityEvent, CitySource } from "@/types/city";

interface EventRow {
  id: string;
  source: CitySource;
  type: string;
  area: string;
  latitude: number;
  longitude: number;
  observed_at: string;
  received_at: string;
  value: number;
  unit: string;
  simulated: boolean;
  metadata: Record<string, unknown> | null;
}

export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing server Supabase environment variables.");
  }

  return createClient(url, serviceRoleKey);
}

function toEventRow(event: CityEvent): EventRow {
  return {
    id: event.id,
    source: event.source,
    type: event.type,
    area: event.area,
    latitude: event.latitude,
    longitude: event.longitude,
    observed_at: event.observedAt,
    received_at: event.receivedAt,
    value: event.value,
    unit: event.unit,
    simulated: event.simulated,
    metadata: event.metadata ?? {},
  };
}

function fromEventRow(row: EventRow): CityEvent {
  return {
    id: row.id,
    source: row.source,
    type: row.type,
    area: row.area,
    latitude: row.latitude,
    longitude: row.longitude,
    observedAt: row.observed_at,
    receivedAt: row.received_at,
    value: row.value,
    unit: row.unit,
    simulated: row.simulated,
    metadata: row.metadata ?? undefined,
  };
}

export async function insertEvent(event: CityEvent): Promise<CityEvent> {
  const [storedEvent] = await insertEvents([event]);

  if (!storedEvent) {
    throw new Error("Supabase did not return the inserted event.");
  }

  return storedEvent;
}

export async function insertEvents(events: CityEvent[]): Promise<CityEvent[]> {
  if (events.length === 0) {
    return [];
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .upsert(events.map(toEventRow), { onConflict: "id" })
    .select();

  if (error) {
    throw new Error(`Unable to store CityPulse events: ${error.message}`);
  }

  return (data as EventRow[]).map(fromEventRow);
}

export async function queryRecentEvents(
  since: string,
  limit = 100,
): Promise<CityEvent[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .gte("observed_at", since)
    .order("observed_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Unable to query CityPulse events: ${error.message}`);
  }

  return (data as EventRow[]).map(fromEventRow);
}
