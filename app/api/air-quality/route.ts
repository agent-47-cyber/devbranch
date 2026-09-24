import { fetchAirQualityEvents } from "@/lib/airQuality";
import { getSourceLocation } from "@/lib/sourceRequest";
import {
  createSourceResponse,
  getErrorMessage,
  persistSourceResponse,
} from "@/lib/sourceResponse";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  let location;

  try {
    location = getSourceLocation(request);
  } catch (error) {
    return NextResponse.json(
      createSourceResponse("air_quality", "unavailable", [], getErrorMessage(error)),
      { status: 400 },
    );
  }

  try {
    const response = createSourceResponse(
      "air_quality",
      "live",
      await fetchAirQualityEvents(location),
    );

    await persistSourceResponse(response);

    return NextResponse.json(response);
  } catch (error) {
    const response = createSourceResponse(
      "air_quality",
      "unavailable",
      [],
      getErrorMessage(error),
    );

    await persistSourceResponse(response);

    return NextResponse.json(response, { status: 502 });
  }
}
