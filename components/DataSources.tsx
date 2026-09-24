import type { SourceStatusRecord } from "@/types/city";
import { timeLabel } from "@/lib/display";
const labels: Record<SourceStatusRecord["source"], string> = {
  weather: "Weather",
  air_quality: "Air Quality",
  transport: "Transport",
  local_report: "Local Reports",
};
export function DataSources({
  sources,
  mode,
  at,
}: {
  sources: SourceStatusRecord[];
  mode: "live" | "replay";
  at: string;
}) {
  return (
    <section className="sources section-shell" aria-labelledby="sources-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Data sources</p>
          <h2 id="sources-title">
            A clear view starts
            <br />
            with clear sources.
          </h2>
        </div>
        <p>
          {mode === "replay"
            ? "Every replay reading is simulated."
            : "Weather and air quality from Open-Meteo."}
          <br />
          Transport and local reports are simulated.
        </p>
      </div>
      <ul>
        {sources.map((source) => (
          <li key={source.source}>
            <span className={`source-dot ${source.status}`} />
            <strong>{labels[source.source]}</strong>
            <span className="source-state">
              {source.status === "unavailable"
                ? "Unavailable"
                : source.status === "simulated"
                  ? "Simulated"
                  : "Live"}
            </span>
            <small>
              {source.status === "unavailable"
                ? "Continuing with remaining feeds."
                : mode === "replay"
                  ? `Scenario · ${timeLabel(at)} IST`
                  : `Retrieved ${timeLabel(source.lastSuccess ?? source.updatedAt)} IST`}
            </small>
          </li>
        ))}
      </ul>
      <p className="source-note">
        A missing feed never stops the others. Observation times are shown with
        each reading.{" "}
        {mode === "live"
          ? "Older readings are excluded from the 30-minute analysis."
          : ""}
      </p>
      <p className="source-note">
        Live means retrieved from a public provider, not a street-level sensor.
        Weather and air quality are model-based estimates for Malviya Nagar. US
        AQI and India AQI use different scales. Polling every minute does not
        guarantee a new provider reading.
      </p>
      <p className="source-attribution">
        Weather: <a href="https://open-meteo.com/">Open-Meteo</a> · Air quality:{" "}
        <a href="https://open-meteo.com/en/docs/air-quality-api">
          CAMS via Open-Meteo
        </a>
      </p>
    </section>
  );
}
