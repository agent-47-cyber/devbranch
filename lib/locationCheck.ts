import type { CityEvent } from "@/types/city";

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function distanceInKilometres(first: CityEvent, second: CityEvent): number {
  const latitudeDistance = toRadians(second.latitude - first.latitude);
  const longitudeDistance = toRadians(second.longitude - first.longitude);
  const a =
    Math.sin(latitudeDistance / 2) ** 2 +
    Math.cos(toRadians(first.latitude)) *
      Math.cos(toRadians(second.latitude)) *
      Math.sin(longitudeDistance / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function locationScore(first: CityEvent, second: CityEvent): number {
  if (first.area === second.area) {
    return 1;
  }

  return Math.max(0, Math.min(1, 1 - distanceInKilometres(first, second) / 5));
}
