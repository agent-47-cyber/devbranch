export type CitySource =
  "weather" | "air_quality" | "transport" | "local_report";

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

export interface SourceResponse {
  source: CitySource;
  status: SourceState;
  updatedAt: string | null;
  events: CityEvent[];
  message?: string;
}

export interface SourceStatusRecord {
  source: CitySource;
  status: SourceState;
  lastSuccess: string | null;
  lastAttempt: string;
  error: string | null;
  updatedAt: string;
}

export type CityStatusLabel = "Stable" | "Watch" | "Elevated" | "High";

export interface CityStatus {
  score: number;
  label: CityStatusLabel;
  area: string | null;
}

export interface CurrentSituation {
  weather: CityEvent | null;
  airQuality: CityEvent | null;
  transport: CityEvent | null;
  reports: CityEvent | null;
}

export interface RecentUpdate {
  id: string;
  at: string;
  title: string;
  detail: string;
  source: CitySource | "possible_link";
  area: string;
}

export interface CivicAlert {
  id: string;
  eventId: string;
  area: string;
  source: CitySource;
  title: string;
  summary: string;
  value: number;
  unit: string;
  threshold: number;
  observedAt: string;
  simulated: boolean;
  linked: boolean;
}

export interface CityStatusResponse {
  mode: "live" | "replay";
  city: "Jaipur";
  updatedAt: string;
  status: CityStatus;
  summary: string;
  whyItMatters: string;
  summaryMeta?: {
    provider: "groq" | "template";
    model?: string;
    generatedAt?: string;
    note: string;
  };
  current: CurrentSituation;
  possibleLinks: PossibleLink[];
  alerts: CivicAlert[];
  recentUpdates: RecentUpdate[];
  mapEvents: CityEvent[];
  sources: SourceStatusRecord[];
  analysis: {
    activeSources: number;
    baselineSources: number;
    scoreAvailable: boolean;
    explanation: string;
  };
}
