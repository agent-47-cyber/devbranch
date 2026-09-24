import { timeLabel } from "@/lib/display";
import type { CivicAlert } from "@/types/city";

export function CivicAlerts({
  alerts,
  mode,
}: {
  alerts: CivicAlert[];
  mode: "live" | "replay";
}) {
  if (!alerts.length) return null;
  return (
    <section className="civic-alerts section-shell" aria-labelledby="alerts-title">
      <div className="alert-heading">
        <div>
          <p className="eyebrow">{mode === "replay" ? "In this moment of the replay" : "In the current 30-minute window"}</p>
          <h2 id="alerts-title">Worth a closer look.</h2>
        </div>
        <span>{alerts.length} signals to watch</span>
      </div>
      <div className="alert-grid" aria-live="polite">
        {alerts.map((alert) => (
          <article key={alert.id} className="civic-alert">
            <div className="alert-meta">
              <span>{alert.simulated ? "Simulated" : "Public feed"}</span>
              <time dateTime={alert.observedAt}>{timeLabel(alert.observedAt)} IST</time>
            </div>
            <h3>{alert.title}</h3>
            <p>{alert.summary}</p>
            {alert.linked && <span className="alert-linked">Part of a possible link ↗</span>}
            <details>
              <summary>Why is this highlighted?</summary>
              <p>
                The latest reading meets the project threshold of {alert.threshold} {alert.unit}
                {" "}and falls inside the 30-minute window. This is a prototype flag,
                not an official emergency alert.
              </p>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}
