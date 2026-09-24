import { getLiveStatus, getReplayStatus, replayStepCount } from "@/lib/status";
import { NextResponse } from "next/server";
import { z } from "zod";
import { addGroqBrief } from "@/lib/groq.server";
import { defaultReplayDay, replayDays } from "@/lib/replay";

const querySchema = z.object({
  mode: z.enum(["live", "replay"]).default("live"),
  day: z.coerce.number().int().min(0).max(replayDays.length - 1).default(defaultReplayDay),
  step: z.coerce
    .number()
    .int()
    .min(0)
    .max(replayStepCount - 1)
    .default(replayStepCount - 1),
});

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const query = querySchema.parse({
      mode: searchParams.get("mode") ?? undefined,
      step: searchParams.get("step") ?? undefined,
      day: searchParams.get("day") ?? undefined,
    });
    const status =
      query.mode === "replay"
        ? await getReplayStatus(query.step, query.day)
        : await getLiveStatus();

    return NextResponse.json(await addGroqBrief(status), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "CityPulse status is temporarily unavailable.",
      },
      { status: error instanceof z.ZodError ? 400 : 503 },
    );
  }
}
