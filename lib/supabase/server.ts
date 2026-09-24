import { createClient } from "@supabase/supabase-js";
import type {
  CityEvent,
  CitySource,
  PossibleLink,
  SourceState,
  SourceStatusRecord,
} from "@/types/city";

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

interface SourceStatusRow {
  source: CitySource;
  status: SourceState;
  last_success: string | null;
  last_attempt: string;
  error: string | null;
  updated_at: string;
}

interface PossibleLinkRow {
  id: string;
  area: string;
  event_ids: string[];
  signals: string[];
  start_time: string;
  end_time: string;
  time_score: number;
  location_score: number;
  unusual_score: number;
  link_score: number;
  summary: string;
}

export interface SourceStatusInput {
  source: CitySource;
  status: SourceState;
  lastSuccess?: string | null;
  lastAttempt?: string;
  error?: string | null;
}

export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing server Supabase environment variables.");
  }

  return createClient(url, serviceRoleKey);
}

export function hasServerSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
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

function fromSourceStatusRow(row: SourceStatusRow): SourceStatusRecord {
  return {
    source: row.source,
    status: row.status,
    lastSuccess: row.last_success,
    lastAttempt: row.last_attempt,
    error: row.error,
    updatedAt: row.updated_at,
  };
}

function toPossibleLinkRow(link: PossibleLink): PossibleLinkRow {
  return {
    id: link.id,
    area: link.area,
    event_ids: link.eventIds,
    signals: link.signals,
    start_time: link.startTime,
    end_time: link.endTime,
    time_score: link.timeScore,
    location_score: link.locationScore,
    unusual_score: link.unusualScore,
    link_score: link.linkScore,
    summary: link.summary,
  };
}

function fromPossibleLinkRow(row: PossibleLinkRow): PossibleLink {
  return {
    id: row.id,
    area: row.area,
    eventIds: row.event_ids,
    signals: row.signals,
    startTime: row.start_time,
    endTime: row.end_time,
    timeScore: row.time_score,
    locationScore: row.location_score,
    unusualScore: row.unusual_score,
    linkScore: row.link_score,
    summary: row.summary,
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

export async function updateSourceStatus(
  input: SourceStatusInput,
): Promise<SourceStatusRecord> {
  const supabase = createServerSupabaseClient();
  const { data: existing, error: existingError } = await supabase
    .from("source_status")
    .select("last_success")
    .eq("source", input.source)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Unable to read CityPulse source status: ${existingError.message}`);
  }

  const attemptedAt = input.lastAttempt ?? new Date().toISOString();
  const lastSuccess =
    input.lastSuccess === undefined
      ? ((existing as { last_success: string | null } | null)?.last_success ?? null)
      : input.lastSuccess;
  const { data, error } = await supabase
    .from("source_status")
    .upsert(
      {
        source: input.source,
        status: input.status,
        last_success: lastSuccess,
        last_attempt: attemptedAt,
        error: input.error ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "source" },
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Unable to update CityPulse source status: ${error.message}`);
  }

  return fromSourceStatusRow(data as SourceStatusRow);
}

export async function getSourceStatuses(): Promise<SourceStatusRecord[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("source_status")
    .select("*")
    .order("source", { ascending: true });

  if (error) {
    throw new Error(`Unable to query CityPulse source statuses: ${error.message}`);
  }

  return (data as SourceStatusRow[]).map(fromSourceStatusRow);
}

export async function upsertPossibleLinks(
  links: PossibleLink[],
): Promise<PossibleLink[]> {
  if (links.length === 0) return [];

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("possible_links")
    .upsert(links.map(toPossibleLinkRow), { onConflict: "id" })
    .select();

  if (error) {
    throw new Error(`Unable to store CityPulse possible links: ${error.message}`);
  }

  return (data as PossibleLinkRow[]).map(fromPossibleLinkRow);
}
