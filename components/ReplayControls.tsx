"use client";

interface ReplayControlsProps {
  step: number;
  totalSteps: number;
  isPlaying: boolean;
  labels: string[];
  onStepChange: (step: number) => void;
  onPlayToggle: () => void;
}

export function ReplayControls({
  step,
  totalSteps,
  isPlaying,
  labels,
  onStepChange,
  onPlayToggle,
}: ReplayControlsProps) {
  return (
    <section className="replay-controls" aria-label="Replay controls">
      <div>
        <p className="eyebrow">Jaipur rain situation</p>
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
        Recorded scenario · all observations are simulated. Scrub through the
        same analysis, moment by moment.
      </p>
    </section>
  );
}
