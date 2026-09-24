import assert from "node:assert/strict";
import { test } from "node:test";
import { createAlerts } from "../lib/alerts";
import { getReplayEvents, getReplaySteps, replayDays } from "../lib/replay";
import { getReplayStatus } from "../lib/status";

test("three replay days keep distinct observations and the same four normalized feeds", async () => {
  const allIds = new Set<string>();
  for (let day = 0; day < replayDays.length; day++) {
    const events = getReplayEvents(5, day);
    const at = getReplaySteps(day)[5].at;
    assert.equal(new Set(events.map((event) => event.source)).size, 4);
    for (const event of events) {
      assert.ok(event.simulated);
      assert.ok(event.observedAt.startsWith(replayDays[day].date));
      assert.ok(Date.parse(event.observedAt) <= Date.parse(at));
      assert.ok(!allIds.has(event.id));
      allIds.add(event.id);
    }
    const status = await getReplayStatus(5, day);
    assert.equal(status.updatedAt, at);
    assert.ok(status.sources.every((source) => source.status === "simulated"));
  }
  const quiet = await getReplayStatus(5, 0);
  const building = await getReplayStatus(5, 1);
  const disruption = await getReplayStatus(5, 2);
  assert.equal(quiet.current.weather?.value, 0);
  assert.equal(quiet.alerts.length, 0);
  assert.equal(quiet.possibleLinks.length, 0);
  assert.equal(building.current.weather?.value, 7.2);
  assert.equal(building.current.reports?.value, 6);
  assert.equal(building.current.transport?.value, 9);
  assert.equal(building.alerts.length, 0);
  assert.equal(disruption.alerts.length, 3);
  assert.equal(disruption.possibleLinks.length, 1);
  assert.ok(disruption.alerts.every((alert) => alert.simulated));
});

test("alerts expire and newer below-threshold readings clear a previous flag", () => {
  const at = getReplaySteps(2)[5].at;
  const rain = getReplayEvents(5, 2).find(
    (event) => event.type === "rain" && event.value === 18,
  )!;
  assert.equal(createAlerts([rain], at).length, 1);
  assert.equal(
    createAlerts([rain], new Date(Date.parse(rain.observedAt) + 31 * 60_000).toISOString()).length,
    0,
  );
  const lower = {
    ...rain,
    id: "newer-lower-rain",
    value: 1,
    observedAt: at,
  };
  assert.equal(createAlerts([rain, lower], at).length, 0);
});

test("thresholds respect units, exact boundary, future timestamps and source labels", () => {
  const at = getReplaySteps(2)[5].at;
  const rain = getReplayEvents(5, 2).find((event) => event.type === "rain")!;
  const event = { ...rain, observedAt: at, value: 10, simulated: false };
  const alert = createAlerts([event], at)[0];
  assert.equal(alert.threshold, 10);
  assert.equal(alert.simulated, false);
  assert.equal(createAlerts([{ ...event, value: 9.9 }], at).length, 0);
  assert.equal(createAlerts([{ ...event, unit: "inches" }], at).length, 0);
  assert.equal(createAlerts([{ ...event, source: "transport" }], at).length, 0);
  assert.equal(createAlerts([{
    ...event,
    observedAt: new Date(Date.parse(at) + 60_000).toISOString(),
  }], at).length, 0);
});
