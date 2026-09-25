"use client";
import type { CityEvent, CityStatusResponse } from "@/types/city";
import { timeLabel } from "@/lib/display";
import { isCurrentMapEvent } from "@/lib/mapView";

function formatDuration(ms: number): string {
  const totalMins = Math.round(ms / 60_000);
  if (totalMins < 60) return `${totalMins}m`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function ObservationChart({
  events,
  title,
  unit,
  color,
  at,
}: {
  events: CityEvent[];
  title: string;
  unit: string;
  color: string;
  at: string;
}) {
  const points = [
    ...new Map(events.map((event) => [event.observedAt, event])).values(),
  ].sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));

  const last = points.at(-1);
  const first = points[0];

  // Compute actual observed range from data, not a fixed 3h window
  const nowMs = Date.parse(at);
  const firstMs = first ? Date.parse(first.observedAt) : nowMs;
  const lastMs = last ? Date.parse(last.observedAt) : nowMs;
  const dataSpanMs = lastMs - firstMs;

  // Add 10% padding on each side, minimum 10 min total window
  const padding = Math.max(dataSpanMs * 0.1, 5 * 60_000);
  const windowStart = firstMs - padding;
  const windowEnd = Math.max(lastMs + padding, windowStart + 10 * 60_000);
  const totalWindow = windowEnd - windowStart;

  const maximum = Math.max(1, ...points.map((event) => event.value)) * 1.15;
  const coords = points.map((event) => {
    const t = Date.parse(event.observedAt);
    const progress = Math.max(0, Math.min(1, (t - windowStart) / totalWindow));
    return {
      event,
      x: 44 + progress * 390,
      y: 160 - (event.value / maximum) * 130,
    };
  });

  // Compute trend direction for display
  let trend = "";
  if (points.length >= 2) {
    const diff = last!.value - first!.value;
    const pct = first!.value !== 0 ? Math.abs((diff / first!.value) * 100) : 0;
    if (Math.abs(diff) < 0.01) trend = "Steady";
    else if (diff > 0) trend = `↑ +${pct.toFixed(0)}%`;
    else trend = `↓ −${pct.toFixed(0)}%`;
  }

  const spanLabel = dataSpanMs > 0 ? formatDuration(dataSpanMs) : "";

  return (
    <article className="trend-card">
      <div className="trend-card-top">
        <h3 className="trend-card-title">{title}</h3>
        <span className="kpi-card-badge">
          {last
            ? last.simulated
              ? "Simulated"
              : "Public feed"
            : "Unavailable"}
        </span>
      </div>
      <p className="trend-card-desc">
        {last?.area ?? "Malviya Nagar"}
        {points.length >= 2
          ? ` · ${spanLabel} observed (${timeLabel(first!.observedAt)} – ${timeLabel(last!.observedAt)} IST)`
          : points.length === 1
            ? ` · Single reading at ${timeLabel(last!.observedAt)} IST`
            : " · Awaiting observations"}
        {trend ? ` · ${trend}` : ""}
      </p>
      {points.length ? (
        <svg
          viewBox="0 0 480 200"
          className="observation-chart"
          role="img"
          aria-label={`${title}: ${points.length} observations, latest ${last!.value} ${unit} at ${timeLabel(last!.observedAt)} IST`}
        >
          {[0, 0.5, 1].map((ratio) => (
            <g key={ratio}>
              <line
                x1="44"
                x2="434"
                y1={160 - ratio * 130}
                y2={160 - ratio * 130}
                stroke="#e2e8f0"
              />
              <text
                x="36"
                y={164 - ratio * 130}
                textAnchor="end"
                fontSize="11"
                fill="#64748b"
              >
                {(ratio * maximum).toFixed(1)}
              </text>
            </g>
          ))}
          {points.length > 1 && (
            <polyline
              points={coords.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={color}
              strokeWidth="3"
            />
          )}
          {coords.map(({ event, x, y }) => (
            <circle key={event.id} cx={x} cy={y} r="4" fill={color}>
              <title>
                {timeLabel(event.observedAt)} IST: {event.value} {unit}
              </title>
            </circle>
          ))}
          <text x="44" y="187" fontSize="10" fill="#64748b">
            {timeLabel(new Date(windowStart).toISOString())} IST
          </text>
          <text x="239" y="187" textAnchor="middle" fontSize="10" fill="#64748b">
            {timeLabel(new Date(windowStart + totalWindow / 2).toISOString())} IST
          </text>
          <text x="434" y="187" textAnchor="end" fontSize="10" fill="#64748b">
            {timeLabel(new Date(windowEnd).toISOString())} IST
          </text>
        </svg>
      ) : (
        <p className="observation-empty">
          No observations available in this window.
        </p>
      )}
      <div className="trend-card-footer">
        <span>
          {points.length} recorded point{points.length === 1 ? "" : "s"}
          {points.length === 1 ? " · trend needs more history" : ""}
        </span>
        <span>
          Latest:{" "}
          {last
            ? `${last.value} ${unit} (${timeLabel(last.observedAt)} IST)`
            : "—"}
        </span>
      </div>
      {points.length > 0 && (
        <details className="chart-readings">
          <summary>View timestamped readings</summary>
          <ul>
            {points.map((event) => (
              <li key={event.id}>
                {timeLabel(event.observedAt)} IST — {event.value} {unit}
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

export function CivicTelemetryDashboard({
  data,
}: {
  data: CityStatusResponse;
}) {
  const aq = data.current.airQuality;
  const delay = data.current.transport;
  const sourceNote = (event: CityEvent | null) =>
    event
      ? `${event.simulated ? "Simulated" : "Public feed"} · ${isCurrentMapEvent(event, data.updatedAt) ? "Current" : "Older"} · ${timeLabel(event.observedAt)} IST`
      : "No reading available";
  const cards = [
    {
      title: "City change score",
      value: data.analysis.scoreAvailable
        ? data.status.score
        : data.status.score > 0
          ? data.status.score
          : "—",
      unit: "/ 100",
      note: data.analysis.scoreAvailable
        ? `${data.status.label} · internal prototype score`
        : data.status.score > 0
          ? `${data.analysis.activeSources} of 4 feeds · partial estimate`
          : `${data.analysis.activeSources} of 4 feeds active · awaiting data`,
    },
    {
      title: "Air quality",
      value: aq?.value ?? "—",
      unit: aq?.unit ?? "US AQI",
      note: sourceNote(aq),
    },
    {
      title: "Transport delay",
      value: delay?.value ?? "—",
      unit: delay?.unit ?? "minutes",
      note: sourceNote(delay),
    },
    {
      title: "Threshold flags",
      value: data.alerts.length,
      unit: "in 30 min",
      note: "Available feeds only · not official alerts",
    },
  ];
  const history = data.observationHistory ?? [];
  return (
    <section
      className="telemetry-cockpit-shell"
      aria-label="City readings and observed trends"
    >
      <div className="kpi-grid">
        {cards.map((card) => (
          <article key={card.title} className="kpi-card">
            <h3 className="kpi-card-title">{card.title}</h3>
            <div className="kpi-card-value-wrap">
              <strong className="kpi-card-value">{card.value}</strong>
              <span className="kpi-card-unit">{card.unit}</span>
            </div>
            <p className="kpi-card-footer">{card.note}</p>
          </article>
        ))}
      </div>
      <div className="trend-charts-grid">
        <ObservationChart
          title="Rainfall over time"
          unit="mm"
          color="#2455cf"
          at={data.updatedAt}
          events={history.filter(
            (e) =>
              e.source === "weather" &&
              e.type === "rain" &&
              e.unit === "mm" &&
              e.area === data.current.weather?.area,
          )}
        />
        <ObservationChart
          title="Air quality over time"
          unit="US AQI"
          color="#b37721"
          at={data.updatedAt}
          events={history.filter(
            (e) =>
              e.source === "air_quality" &&
              e.type === "aqi" &&
              e.unit === "US AQI" &&
              e.area === aq?.area,
          )}
        />
      </div>
    </section>
  );
}
