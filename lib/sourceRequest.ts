import { findNearestJaipurArea, getJaipurArea } from "@/lib/areas";
import type { SourceLocation } from "@/lib/weather";
import { z } from "zod";

const querySchema = z
  .object({
    area: z.string().trim().min(1).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
  })
  .superRefine((value, context) => {
    const hasLatitude = value.latitude !== undefined;
    const hasLongitude = value.longitude !== undefined;

    if (hasLatitude !== hasLongitude) {
      context.addIssue({
        code: "custom",
        message: "latitude and longitude must be provided together.",
      });
    }
  });

export function getSourceLocation(request: Request): SourceLocation {
  const searchParams = new URL(request.url).searchParams;
  const query = querySchema.parse({
    area: searchParams.get("area") ?? undefined,
    latitude: searchParams.get("latitude") ?? undefined,
    longitude: searchParams.get("longitude") ?? undefined,
  });

  if (query.area) {
    const area = getJaipurArea(query.area);

    return {
      area: area.name,
      latitude: query.latitude ?? area.latitude,
      longitude: query.longitude ?? area.longitude,
    };
  }

  if (query.latitude !== undefined && query.longitude !== undefined) {
    const nearestArea = findNearestJaipurArea(query.latitude, query.longitude);

    return {
      area: nearestArea.name,
      latitude: query.latitude,
      longitude: query.longitude,
    };
  }

  const defaultArea = getJaipurArea("Malviya Nagar");

  return {
    area: defaultArea.name,
    latitude: defaultArea.latitude,
    longitude: defaultArea.longitude,
  };
}
