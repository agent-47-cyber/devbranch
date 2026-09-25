import { getLocalReportRecords, normalizeLocalReportRecords } from "@/lib/reports";
import { createSourceResponse, persistSourceResponse } from "@/lib/sourceResponse";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = createSourceResponse(
      "local_report",
      "simulated",
      normalizeLocalReportRecords(getLocalReportRecords(), undefined, true),
    );

    await persistSourceResponse(response);

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Local report data is unavailable.";
    const response = createSourceResponse("local_report", "unavailable", [], message);

    await persistSourceResponse(response);

    return NextResponse.json(response, { status: 502 });
  }
}
