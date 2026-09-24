export type CitySource =
  | "weather"
  | "air_quality"
  | "transport"
  | "local_report";

export interface CityEvent {
  id: string;
  source: CitySource;
  type: string;
  area: string;
  latitude: number;
  longitude: number;
  observedAt: string;
  receivedAt: string;
  value: number;
  unit: string;
  simulated: boolean;
  metadata?: Record<string, unknown>;
}

export interface PossibleLink {
  id: string;
  area: string;
  eventIds: string[];
  signals: string[];
  startTime: string;
  endTime: string;
  timeScore: number;
  locationScore: number;
  unusualScore: number;
  linkScore: number;
  summary: string;
}

export interface UnusualResult {
  unusual: boolean;
  score: number;
  baseline: number;
  current: number;
}

export type SourceState = "live" | "simulated" | "unavailable";
