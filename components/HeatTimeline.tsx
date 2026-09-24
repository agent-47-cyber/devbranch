"use client";
import { useMemo } from "react";
import { timeLabel } from "@/lib/display";
import type { CityStatusResponse } from "@/types/city";

interface CellData {
  source: string;
  label: string;
  stepIndex: number;
  time: string;
  value: number | null;
  unit: string;
  intensity: number; // 0-1, normalized
}

const SOURCE_CONFIG = [
  { key: "weather", label: "Rain", unit: "mm" },
  { key: "air_quality", label: "Air", unit: "AQI" },
  { key: "transport", label: "Delays", unit: "min" },
  { key: "local_report", label: "Reports", unit: "reports" },
] as const;

// Normalization thresholds for intensity mapping
const THRESHOLDS: Record<string, { low: number; high: number }> = {
  weather: { low: 2, high: 20 },
  air_quality: { low: 50, high: 200 },
  transport: { low: 5, high: 20 },
  local_report: { low: 3, high: 15 },
};

function normalize(source: string, value: number): number {
  const t = THRESHOLDS[source] ?? { low: 0, high: 100 };
  return Math.min(1, Math.max(0, (value - t.low) / (t.high - t.low)));
}

export function HeatTimeline({
  frames,
  currentStep,
  onStepChange,
}: {
  frames: CityStatusResponse[];
  currentStep: number;
  onStepChange?: (step: number) => void;
}) {
  const grid = useMemo(() => {
    const cells: CellData[][] = [];
    for (const config of SOURCE_CONFIG) {
      const row: CellData[] = [];
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const current = frame.current;
        const event =
          config.key === "weather"
            ? current.weather
            : config.key === "air_quality"
              ? current.airQuality
              : config.key === "transport"
                ? current.transport
                : current.reports;
        const value = event?.value ?? null;
        row.push({
          source: config.key,
          label: config.label,
          stepIndex: i,
          time: timeLabel(frame.updatedAt),
          value,
          unit: event?.unit ?? config.unit,
          intensity: value !== null ? normalize(config.key, value) : 0,
        });
      }
      cells.push(row);
    }
    return cells;
  }, [frames]);

  if (!frames.length) return null;

  const hasLink = frames.some((f) => f.possibleLinks.length > 0);

  return (
    <section
      className="heat-timeline section-shell"
      aria-labelledby="heat-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">Signal intensity over time</p>
          <h2 id="heat-title">
            Four feeds.
            <br />
            <span>One timeline.</span>
          </h2>
        </div>
        <p>
          Color intensity shows signal strength.
          <br />
          Tap any cell to jump to that moment.
        </p>
      </div>

      <div className="heat-grid-container" style={{ "--heat-cols": frames.length } as React.CSSProperties}>
        {/* Time axis header */}
        <div className="heat-time-axis">
          <span className="heat-source-label" />
          {frames.map((frame, i) => (
            <button
              key={i}
              className={`heat-time-label ${i === currentStep ? "is-current" : ""}`}
              onClick={() => onStepChange?.(i)}
            >
              {timeLabel(frame.updatedAt)}
            </button>
          ))}
        </div>

        {/* Heat map rows */}
        {grid.map((row, rowIndex) => (
          <div key={SOURCE_CONFIG[rowIndex].key} className="heat-row">
            <span className="heat-source-label">
              <i className={`heat-dot heat-dot-${SOURCE_CONFIG[rowIndex].key}`} />
              {SOURCE_CONFIG[rowIndex].label}
            </span>
            {row.map((cell, colIndex) => {
              const isActive = colIndex === currentStep;
              const linkAtStep = frames[colIndex]?.possibleLinks?.[0];
              const ev =
                cell.source === "weather"
                  ? frames[colIndex].current.weather
                  : cell.source === "air_quality"
                    ? frames[colIndex].current.airQuality
                    : cell.source === "transport"
                      ? frames[colIndex].current.transport
                      : frames[colIndex].current.reports;
              const isLinked = Boolean(linkAtStep && ev && linkAtStep.eventIds.includes(ev.id));

              return (
                <button
                  key={colIndex}
                  className={`heat-cell ${isActive ? "is-active" : ""} ${isLinked ? "is-linked" : ""}`}
                  style={{
                    "--cell-intensity": cell.intensity,
                    "--cell-hue": cell.source === "weather" ? "220" : cell.source === "air_quality" ? "150" : cell.source === "transport" ? "40" : "20",
                  } as React.CSSProperties}
                  onClick={() => onStepChange?.(colIndex)}
                  aria-label={`${cell.label}: ${cell.value ?? "—"} ${cell.unit} at ${cell.time}`}
                  title={`${cell.value ?? "—"} ${cell.unit}`}
                >
                  {cell.value !== null && cell.intensity > 0.3 && (
                    <span className="heat-value">{cell.value}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* Link indicator row */}
        {hasLink && (
          <div className="heat-row heat-link-row">
            <span className="heat-source-label">
              <i className="heat-dot heat-dot-link" />
              Link
            </span>
            {frames.map((frame, i) => {
              const link = frame.possibleLinks[0];
              return (
                <button
                  key={i}
                  className={`heat-cell heat-link-cell ${i === currentStep ? "is-active" : ""} ${link ? "has-link" : ""}`}
                  onClick={() => onStepChange?.(i)}
                  aria-label={
                    link
                      ? `Possible link: ${Math.round(link.linkScore * 100)}%`
                      : "No link"
                  }
                >
                  {link && (
                    <span className="heat-link-score">
                      {Math.round(link.linkScore * 100)}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="heat-legend">
        <span className="heat-legend-label">Intensity</span>
        <div className="heat-legend-scale">
          <span>Low</span>
          <div className="heat-legend-gradient" />
          <span>High</span>
        </div>
        {hasLink && (
          <span className="heat-legend-link">
            <i /> Possible link detected
          </span>
        )}
      </div>
    </section>
  );
}
