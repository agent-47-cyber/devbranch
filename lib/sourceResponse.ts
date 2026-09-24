import {
  hasServerSupabaseConfig,
  insertEvents,
  updateSourceStatus,
} from "@/lib/supabase/server";
import type { CityEvent, CitySource, SourceResponse, SourceState } from "@/types/city";

export function createSourceResponse(
  source: CitySource,
  status: SourceState,
  events: CityEvent[],
  message?: string,
): SourceResponse {
  return {
    source,
    status,
    updatedAt: events[0]?.receivedAt ?? null,
    events,
    ...(message ? { message } : {}),
  };
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The source is temporarily unavailable.";
}

export async function persistSourceResponse(response: SourceResponse): Promise<void> {
  if (!hasServerSupabaseConfig()) return;

  const statusUpdate = updateSourceStatus({
    source: response.source,
    status: response.status,
    ...(response.status === "unavailable"
      ? { error: response.message ?? "The source is temporarily unavailable." }
      : { lastSuccess: response.updatedAt, error: null }),
  });
  const tasks = [statusUpdate, ...(response.events.length > 0 ? [insertEvents(response.events)] : [])];
  const results = await Promise.allSettled(tasks);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("CityPulse storage is unavailable:", result.reason);
    }
  }
}
