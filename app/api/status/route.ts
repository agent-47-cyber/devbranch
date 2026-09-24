import { getLiveStatus, getReplayStatus, replayStepCount } from "@/lib/status";
import { NextResponse } from "next/server";
import { z } from "zod";
import { addGroqBrief } from "@/lib/groq.server";

const querySchema = z.object({
  mode: z.enum(["live", "replay"]).default("live"),
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
    });
    const status =
      query.mode === "replay"
        ? await getReplayStatus(query.step)
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
