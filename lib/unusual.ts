import type { CityEvent, UnusualResult } from "@/types/city";

function average(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function standardDeviation(values: number[], mean: number): number {
  return Math.sqrt(
    values.reduce((total, value) => total + (value - mean) ** 2, 0) /
      values.length,
  );
}

/**
 * Compares an event with earlier measurements of the same signal. With three
 * or more observations it uses a z-score; otherwise it uses the documented
 * 1.5x baseline fallback.
 */
export function detectUnusual(
  current: CityEvent,
  history: CityEvent[],
  at?: string,
): UnusualResult {
  const earlier = history.filter(
    (event) =>
      event.id !== current.id &&
      event.source === current.source &&
      event.type === current.type &&
      event.area === current.area &&
      event.unit === current.unit &&
      Date.parse(event.observedAt) >=
        Date.parse(current.observedAt) - 3 * 60 * 60_000 &&
      Date.parse(event.observedAt) < Date.parse(current.observedAt),
  );
  // Keep the active incident out of its own baseline when prior history exists.
  const priorWindow = at
    ? earlier.filter(
        (event) => Date.parse(event.observedAt) < Date.parse(at) - 30 * 60_000,
      )
    : [];
  const values = (priorWindow.length ? priorWindow : earlier).map(
    (event) => event.value,
  );

  if (values.length === 0) {
    return {
      unusual: false,
      score: 0,
      baseline: current.value,
      current: current.value,
    };
  }

  const baseline = average(values);

  if (values.length >= 4) {
    const deviation = standardDeviation(values, baseline);
    const zScore =
      deviation === 0
        ? current.value > baseline
          ? 3
          : 0
        : (current.value - baseline) / deviation;

    return {
      unusual: zScore >= 2,
      score: Math.max(0, zScore),
      baseline,
      current: current.value,
    };
  }

  const ratio =
    baseline === 0 ? (current.value > 0 ? 2 : 0) : current.value / baseline;

  return {
    unusual: current.value > baseline && current.value >= baseline * 1.5,
    score: Math.max(0, ratio),
    baseline,
    current: current.value,
  };
}
