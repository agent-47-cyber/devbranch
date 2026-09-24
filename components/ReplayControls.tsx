"use client";
import replayDays from "@/data/replayDays.json";

interface ReplayControlsProps {
  step: number;
  totalSteps: number;
  isPlaying: boolean;
  labels: string[];
  day: number;
  onDayChange: (day: number) => void;
  onStepChange: (step: number) => void;
  onPlayToggle: () => void;
}

export function ReplayControls({
  step,
  totalSteps,
  isPlaying,
  labels,
  day,
  onDayChange,
  onStepChange,
  onPlayToggle,
}: ReplayControlsProps) {
  return (
    <div className="replay-history section-shell">
      <div className="replay-history-heading">
        <div>
          <p className="eyebrow">A city, over time</p>
          <h2>Three days. Different stories.</h2>
        </div>
        <p>Simulated history · 22–24 September 2026</p>
      </div>
      <div className="replay-days" role="group" aria-label="Choose a replay day">
        {replayDays.map((entry, index) => (
          <button
            key={entry.date}
            aria-pressed={day === index}
            onClick={() => onDayChange(index)}
          >
            <span>{entry.label}</span>
            <strong>{entry.title}</strong>
            <small>{day === index ? "Selected day" : "Explore this day"} ↗</small>
          </button>
        ))}
      </div>
      <p className="replay-day-description">{replayDays[day].description}</p>
    <section className="replay-controls" aria-label="Replay controls">
      <div>
        <p className="eyebrow">{replayDays[day].label} · {replayDays[day].title}</p>
        <p className="replay-time">{labels[step] ?? ""}</p>
      </div>
      <button className="play-button" type="button" onClick={onPlayToggle}>
        {isPlaying ? "Pause" : "Play"}
      </button>
      <input
        aria-label="Replay timeline"
        aria-valuetext={labels[step]}
        type="range"
        min="0"
        max={totalSteps - 1}
        value={step}
        onChange={(event) => onStepChange(Number(event.target.value))}
      />
      <div className="replay-stops" aria-hidden="true">
        {labels.map((label, index) => (
          <span className={index <= step ? "seen" : ""} key={label}>
            {label}
          </span>
        ))}
      </div>
      <p className="replay-explainer">
        All observations are simulated. Move through this day to see readings,
        alerts and possible links change together.
      </p>
    </section>
    </div>
  );
}
