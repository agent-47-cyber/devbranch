import { CityLandmark } from "@/components/CityLandmark";
import { SignalIcon } from "@/components/SignalIcon";

export function CityArrival({
  mode,
  error,
  onRetry,
}: {
  mode: "live" | "replay";
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <section className="city-arrival" aria-live="polite" aria-busy={!error}>
      <div className="arrival-illustration" aria-hidden="true">
        <div className="arrival-orbit" />
        <CityLandmark />
      </div>
      <p className="eyebrow">A little clarity. For a whole city.</p>
      <h1>
        {error
          ? "Let’s reconnect."
          : mode === "live"
            ? "Listening to Jaipur."
            : "Rewinding the city."}
      </h1>
      <p className="arrival-description">
        {error ??
          (mode === "live"
            ? "Retrieving public weather and air quality. Bringing the latest readings and labelled civic simulations into view."
            : "Loading six moments from a simulated rain scenario. The same analysis, at a different time.")}
      </p>
      <div className="arrival-feeds">
        {(["weather", "air_quality", "transport", "local_report"] as const).map(
          (source, i) => (
            <span key={source}>
              <SignalIcon source={source} />
              {["Weather", "Air quality", "Transport", "Reports"][i]}
              <small>
                {mode === "replay" || i > 1 ? "SIMULATED" : "OPEN-METEO"}
              </small>
            </span>
          ),
        )}
      </div>
      {error ? (
        <button className="text-button" onClick={onRetry}>
          Try again ↗
        </button>
      ) : (
        <div className="arrival-scan" aria-hidden="true">
          <span />
        </div>
      )}
      <small className="arrival-note">
        No invented readings. No personal data. Just a clearer picture.
      </small>
    </section>
  );
}
