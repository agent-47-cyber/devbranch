import type { CitySource } from "@/types/city";
const paths: Record<CitySource, string> = {
  weather:
    "M7 16H6a4 4 0 0 1 0-8 6 6 0 0 1 11-1 4.5 4.5 0 0 1 1 9h-1 M8 19l-1 2m5-2-1 2m5-2-1 2",
  air_quality:
    "M3 8h12a3 3 0 1 0-3-3 M3 12h16a3 3 0 1 1-3 3 M3 16h5a3 3 0 1 1-3 3",
  transport:
    "M6 17h12V5c0-2-12-2-12 0v12Zm0-6h12M8 20v-3m8 3v-3M9 14h.01M15 14h.01",
  local_report: "m12 3 10 18H2L12 3Zm0 6v5m0 3h.01",
};
export function SignalIcon({ source }: { source: CitySource }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[source]} />
    </svg>
  );
}
