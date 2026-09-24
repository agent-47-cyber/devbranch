import { locationScore } from "@/lib/locationCheck";
import { inWindow, timeScore } from "@/lib/timeCheck";
import { detectUnusual } from "@/lib/unusual";
import type { CityEvent, PossibleLink } from "@/types/city";

const average = (values: number[]) =>
  values.reduce((a, b) => a + b, 0) / values.length;

/** Latest observations in the rolling window must be unusual across three feeds. */
export function findPossibleLinks(
  events: CityEvent[],
  at = new Date().toISOString(),
): PossibleLink[] {
  const active = inWindow(events, at);
  const links: PossibleLink[] = [];
  for (const area of new Set(active.map((event) => event.area))) {
    const candidates = ["rain", "waterlogging", "delay"].map(
      (type) =>
        active
          .filter((event) => event.area === area && event.type === type)
          .sort(
            (a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt),
          )[0],
    );
    if (
      candidates.some(
        (event) => !event || !detectUnusual(event, events, at).unusual,
      )
    )
      continue;
    if (new Set(candidates.map((event) => event.source)).size !== 3) continue;
    const pairs = candidates.flatMap((event, i) =>
      candidates.slice(i + 1).map((other) => [event, other] as const),
    );
    const time = average(pairs.map(([a, b]) => timeScore(a, b)));
    const location = average(pairs.map(([a, b]) => locationScore(a, b)));
    const unusual = average(
      candidates.map((event) =>
        Math.min(1, detectUnusual(event, events, at).score / 3),
      ),
    );
    const score = 0.4 * time + 0.3 * location + 0.3 * unusual;
    if (score < 0.7) continue;
    const times = candidates.map((event) => event.observedAt).sort();
    const eventIds = candidates.map((event) => event.id).sort();
    links.push({
      id: `link-${eventIds.join("-")}`,
      area,
      eventIds,
      signals: ["Heavy rain", "Waterlogging reports", "Transport delays"],
      startTime: times[0],
      endTime: times[times.length - 1],
      timeScore: time,
      locationScore: location,
      unusualScore: unusual,
      linkScore: score,
      summary: `Heavy rain in ${area} is happening alongside increased waterlogging reports and transport delays. These events may be related.`,
    });
  }
  return links.sort((a, b) => b.linkScore - a.linkScore);
}
