export interface JaipurArea {
  name: string;
  latitude: number;
  longitude: number;
}

export const JAIPUR_AREAS = [
  { name: "Malviya Nagar", latitude: 26.8477, longitude: 75.8113 },
  { name: "Jagatpura", latitude: 26.8416, longitude: 75.8601 },
  { name: "Mansarovar", latitude: 26.8507, longitude: 75.7624 },
  { name: "C-Scheme", latitude: 26.9118, longitude: 75.7971 },
  { name: "Vaishali Nagar", latitude: 26.9134, longitude: 75.7445 },
] as const satisfies readonly JaipurArea[];

export function getJaipurArea(name: string): JaipurArea {
  const area = JAIPUR_AREAS.find((candidate) => candidate.name === name);

  if (!area) {
    throw new Error(`Unsupported Jaipur area: ${name}`);
  }

  return area;
}
