import { getSourceLocation } from "@/lib/sourceRequest";
import {
  createSourceResponse,
  getErrorMessage,
  persistSourceResponse,
} from "@/lib/sourceResponse";
import { fetchWeatherEvents } from "@/lib/weather";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  let location;

  try {
    location = getSourceLocation(request);
  } catch (error) {
    return NextResponse.json(
      createSourceResponse("weather", "unavailable", [], getErrorMessage(error)),
      { status: 400 },
    );
  }

  try {
    const response = createSourceResponse(
      "weather",
      "live",
      await fetchWeatherEvents(location),
    );

    await persistSourceResponse(response);

    return NextResponse.json(response);
  } catch (error) {
    const response = createSourceResponse(
      "weather",
      "unavailable",
      [],
      getErrorMessage(error),
    );

    await persistSourceResponse(response);

    return NextResponse.json(response, { status: 502 });
  }
}
