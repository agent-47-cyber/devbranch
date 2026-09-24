"use client";
import type { CityEvent, CityStatusResponse } from "@/types/city";
import { timeLabel } from "@/lib/display";
import { isCurrentMapEvent } from "@/lib/mapView";

function ObservationChart({
  events,
  title,
  unit,
  color,
}: {
  events: CityEvent[];
  title: string;
  unit: string;
  color: string;
}) {
  const points = [
    ...new Map(events.map((event) => [event.observedAt, event])).values(),
  ].sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));
  const first = points[0];
  const last = points.at(-1);
  const maximum = Math.max(1, ...points.map((event) => event.value)) * 1.15;
  const duration =
    first && last
      ? Date.parse(last.observedAt) - Date.parse(first.observedAt)
      : 0;
  const coords = points.map((event) => ({
    event,
    x: duration
      ? 44 +
        ((Date.parse(event.observedAt) - Date.parse(first.observedAt)) /
          duration) *
          390
      : 240,
    y: 160 - (event.value / maximum) * 130,
  }));
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
        {last?.area ?? "Malviya Nagar"} · available observations from the last 3
        hours. No generated history.
      </p>
      {points.length ? (
        <svg
          viewBox="0 0 480 200"
          className="observation-chart"
          role="img"
          aria-label={`${title}: ${points.length} observations, latest ${last!.value} ${unit}`}
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
          <text x="44" y="187" fontSize="11" fill="#64748b">
            {timeLabel(first.observedAt)} IST
          </text>
          {duration > 0 && (
            <text x="434" y="187" textAnchor="end" fontSize="11" fill="#64748b">
              {timeLabel(last!.observedAt)} IST
            </text>
          )}
        </svg>
      ) : (
        <p className="observation-empty">
          No observations available in this window.
        </p>
      )}
      <div className="trend-card-footer">
        <span>
          {points.length} recorded points
          {points.length === 1 ? " · trend needs more history" : ""}
        </span>
        <span>Latest: {last ? `${last.value} ${unit}` : "—"}</span>
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
      value: data.analysis.scoreAvailable ? data.status.score : "—",
      unit: "/ 100",
      note: data.analysis.scoreAvailable
        ? `${data.status.label} · internal prototype score`
        : "Insufficient comparable feeds",
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
