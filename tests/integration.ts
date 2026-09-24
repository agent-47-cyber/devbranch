import assert from "node:assert/strict";
import {
  createServerSupabaseClient,
  insertEvents,
  queryRecentEvents,
  upsertPossibleLinks,
  getSourceStatuses,
} from "../lib/supabase/server";
import { getReplayEvents, replaySteps } from "../lib/replay";
import { findPossibleLinks } from "../lib/findLinks";
async function main() {
  process.loadEnvFile(".env.local");
  const base = process.env.CITYPULSE_TEST_URL ?? "http://localhost:3000";
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  for (const route of [
    "weather",
    "air-quality",
    "transport",
    "reports",
    "status?mode=live",
    "status?mode=replay&step=0",
    "status?mode=replay&step=5",
  ]) {
    const response = await fetch(`${base}/api/${route}`);
    const body = await response.text();
    assert.ok(
      !body.includes(secret),
      "Server key must not appear in API responses",
    );
    assert.equal(response.status, 200, route);
    const data = JSON.parse(body);
    console.log(
      JSON.stringify({
        route,
        http: response.status,
        state: data.status,
        sources: data.sources?.map((s: { source: string; status: string }) => ({
          source: s.source,
          status: s.status,
        })),
        events: data.events?.length,
      }),
    );
  }
  assert.equal((await fetch(`${base}/api/status?mode=bad`)).status, 400);
  assert.equal((await fetch(`${base}/api/weather?latitude=200`)).status, 400);
  const replay = getReplayEvents(replaySteps.length - 1);
  const now = new Date().toISOString();
  const id = `audit-${Date.now()}`;
  const event = { ...replay[0], id, observedAt: now, receivedAt: now };
  const link = {
    ...findPossibleLinks(
      replay,
      new Date(replaySteps.at(-1)!.at).toISOString(),
    )[0],
    id,
  };
  const client = createServerSupabaseClient();
  try {
    assert.equal((await insertEvents([event]))[0].id, id);
    assert.ok((await queryRecentEvents(now)).some((e) => e.id === id));
    assert.equal((await upsertPossibleLinks([link]))[0].id, id);
    const statuses = await getSourceStatuses();
    assert.equal(statuses.length, 4);
    assert.ok(statuses.every((s) => s.lastAttempt && s.lastSuccess));
    console.log(
      "PASS: Supabase event write/read, possible-link write, four saved source statuses.",
    );
  } finally {
    for (const table of ["events", "possible_links"]) {
      const result = await client.from(table).delete().eq("id", id);
      assert.equal(result.error, null);
    }
    console.log("Removed only the two temporary audit records.");
  }
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Integration check failed",
  );
  process.exitCode = 1;
});
