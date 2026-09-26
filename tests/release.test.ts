import test from "node:test";
import assert from "node:assert/strict";
import { analyzeStatus, getReplayStatus } from "../lib/status";
import { getReplayEvents, getReplaySteps } from "../lib/replay";

test("missing neighbourhood readings never borrow another area's data", () => {
  const at = getReplaySteps(2)[5].at;
  const events = getReplayEvents(5, 2).filter((event) => event.area === "Malviya Nagar");
  const result = analyzeStatus("replay", [
    { source: "weather", status: "simulated", updatedAt: at, events: events.filter((e) => e.source === "weather") },
  ], [], at, "Vaishali Nagar");
  assert.ok(Object.values(result.current).every((event) => event === null));
  assert.ok(result.mapEvents.length > 0, "Other neighbourhoods remain available on the map");
});

test("old synthetic weather cannot contaminate live analysis or charts", () => {
  const at = getReplaySteps(2)[5].at;
  const replay = getReplayEvents(5, 2);
  const real = {
    ...replay.find((event) => event.type === "rain")!,
    id: "public-rain",
    simulated: false,
    observedAt: at,
  };
  const result = analyzeStatus(
    "live",
    [{ source: "weather", status: "live", updatedAt: at, events: [real] }],
    replay,
    at,
  );
  assert.deepEqual(
    result.observationHistory.map((event) => event.id),
    ["public-rain"],
  );
  assert.equal(result.analysis.baselineSources, 0);
  assert.equal(result.possibleLinks.length, 0);
});

test("all 18 replay frames expose only ingested history through the chosen instant", async () => {
  for (let day = 0; day < 3; day++) {
    const signatures = new Set<string>();
    for (let step = 0; step < 6; step++) {
      const status = await getReplayStatus(step, day);
      const input = new Map(
        getReplayEvents(step, day).map((event) => [event.id, event]),
      );
      assert.equal(status.updatedAt, getReplaySteps(day)[step].at);
      assert.equal(status.sources.length, 4);
      assert.ok(
        status.sources.every((source) => source.status === "simulated"),
      );
      for (const event of status.observationHistory) {
        assert.equal(event.value, input.get(event.id)?.value);
        assert.equal(event.observedAt, input.get(event.id)?.observedAt);
        assert.ok(Date.parse(event.observedAt) <= Date.parse(status.updatedAt));
        assert.ok(
          Date.parse(event.observedAt) >=
            Date.parse(status.updatedAt) - 3 * 60 * 60_000,
        );
      }
      for (const alert of status.alerts) {
        assert.equal(input.get(alert.eventId)?.value, alert.value);
        assert.ok(alert.simulated);
      }
      signatures.add(
        JSON.stringify(
          Object.values(status.current).map((event) => [
            event?.value,
            event?.observedAt,
          ]),
        ),
      );
    }
    assert.ok(
      signatures.size > 1,
      "Replay changes observations, not just a UI clock",
    );
  }
});
