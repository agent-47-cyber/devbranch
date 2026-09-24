import assert from "node:assert/strict";
import { test } from "node:test";
import { createGroqSummarizer } from "../lib/groq.server";
import { getReplayStatus } from "../lib/status";

async function fixture() {
  return { ...(await getReplayStatus(5)), mode: "live" as const };
}
const response = (content: unknown) =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
    { status: 200 },
  );

test("Groq selects verified facts, preserves inputs and caches identical evidence", async () => {
  let calls = 0;
  const data = await fixture();
  const original = JSON.stringify(data);
  const summarize = createGroqSummarizer({
    apiKey: "test-only",
    fetcher: async (url, init) => {
      calls++;
      assert.equal(url, "https://api.groq.com/openai/v1/chat/completions");
      assert.ok(init?.signal);
      assert.ok(!String(init?.body).includes("test-only"));
      return response({ factIds: ["weather", "possible_link"] });
    },
  });
  const [first, second] = await Promise.all([summarize(data), summarize(data)]);
  const cached = await summarize({
    ...data,
    updatedAt: new Date(Date.parse(data.updatedAt) + 1000).toISOString(),
  });
  assert.equal(calls, 1);
  assert.equal(first.summaryMeta?.provider, "groq");
  assert.equal(first.summary, second.summary);
  assert.equal(first.summary, cached.summary);
  assert.match(first.summary, /Simulated Rainfall/);
  assert.match(first.summary, /not proof of cause/);
  assert.equal(JSON.stringify(data), original);
  assert.ok(!JSON.stringify(first).includes("test-only"));
});

test("missing key and replay never call Groq", async () => {
  const fetcher: typeof fetch = async () => {
    throw new Error("Must not fetch");
  };
  const data = await fixture();
  const missing = await createGroqSummarizer({ fetcher })(data);
  const replay = await createGroqSummarizer({ apiKey: "test", fetcher })({
    ...data,
    mode: "replay",
  });
  assert.equal(missing.summary, data.summary);
  assert.match(missing.summaryMeta!.note, /not configured/);
  assert.match(replay.summaryMeta!.note, /scenario/);
});

test("unknown, duplicate and free-form model output is rejected", async () => {
  const data = await fixture();
  for (const content of [
    { factIds: ["invented"] },
    { factIds: ["weather", "weather"] },
    { factIds: [] },
    { factIds: ["weather"], summary: "Invented rain caused flooding" },
  ]) {
    const result = await createGroqSummarizer({
      apiKey: "test",
      fetcher: async () => response(content),
    })(data);
    assert.equal(result.summaryMeta?.provider, "template");
    assert.equal(result.summary, data.summary);
  }
});

test("provider errors and timeouts fall back with a retry cooldown", async () => {
  const data = await fixture();
  for (const status of [401, 429, 500]) {
    let calls = 0;
    const summarize = createGroqSummarizer({
      apiKey: "test",
      fetcher: async () => {
        calls++;
        return new Response("private provider error", { status });
      },
    });
    const result = await summarize(data);
    await summarize(data);
    assert.equal(calls, 1);
    assert.equal(result.summary, data.summary);
    assert.ok(!JSON.stringify(result).includes("private provider error"));
  }
  const result = await createGroqSummarizer({
    apiKey: "test",
    fetcher: async () => {
      throw new DOMException("Timeout", "TimeoutError");
    },
  })(data);
  assert.equal(result.summaryMeta?.provider, "template");
});
