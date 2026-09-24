import { createSourceResponse, persistSourceResponse } from "@/lib/sourceResponse";
import { getTransportRecords, normalizeTransportRecords } from "@/lib/transport";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = createSourceResponse(
      "transport",
      "simulated",
      normalizeTransportRecords(getTransportRecords()),
    );

    await persistSourceResponse(response);

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transport data is unavailable.";
    const response = createSourceResponse("transport", "unavailable", [], message);

    await persistSourceResponse(response);

    return NextResponse.json(response, { status: 502 });
  }
}
