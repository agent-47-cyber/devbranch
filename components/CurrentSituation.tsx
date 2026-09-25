import type { CurrentSituation as CurrentSituationData } from "@/types/city";
import { timeLabel, eventLabel } from "@/lib/display";
import { SignalIcon } from "@/components/SignalIcon";
export function CurrentSituation({
  current,
  mode,
  at,
  area = "Jaipur",
}: {
  current: CurrentSituationData;
  mode: "live" | "replay";
  at: string;
  area?: string;
}) {
  const panels = [
    { label: "Weather", event: current.weather, source: "weather" },
    { label: "Air Quality", event: current.airQuality, source: "air_quality" },
    { label: "Transport", event: current.transport, source: "transport" },
    { label: "Local Reports", event: current.reports, source: "local_report" },
  ] as const;
  return (
    <section
      className="situation section-shell"
      id="situation"
      aria-labelledby="situation-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">01 / Current situation</p>
          <h2 id="situation-title">
            The signals.
            <br />
            <span>Before the story.</span>
          </h2>
        </div>
        <p>
          Actual values. Original timestamps.
          <br />
          Clearly labelled sources.
          {mode === "live" && <><br /><strong style={{ color: "#0f172a" }}>{area}</strong></>}
        </p>
      </div>
      <div className="signal-mosaic">
        {panels.map(({ label, event, source }) => (
          <article key={source} className={`signal-panel signal-${source}`}>
            <div className="signal-top">
              <span>{label}</span>
              <SignalIcon source={source} />
            </div>
            {event ? (
              <>
                <p className="signal-name">{eventLabel(event)}</p>
                <div className="signal-value">
                  {event.value}
                  <span>{event.unit}</span>
                </div>
                <p className="signal-location">{event.area}</p>
                <p className="signal-origin">
                  {event.simulated
                    ? "Local JSON · demonstration data"
                    : source === "weather"
                      ? "Open-Meteo · weather model"
                      : "CAMS via Open-Meteo · US AQI, not India AQI"}
                </p>
                {!event.simulated &&
                  (source === "weather" || source === "air_quality") && (
                    <a
                      className="provider-link"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={
                        source === "weather"
                          ? `https://api.open-meteo.com/v1/forecast?latitude=${event.latitude}&longitude=${event.longitude}&current=temperature_2m,precipitation,rain,wind_speed_10m,weather_code`
                          : `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${event.latitude}&longitude=${event.longitude}&current=us_aqi,pm2_5,pm10`
                      }
                    >
                      Inspect provider feed ↗
                    </a>
                  )}
                {source === "weather" &&
                  typeof event.metadata?.temperature === "number" && (
                    <p className="weather-detail">
                      {event.metadata.temperature}°C <span>temperature</span> /{" "}
                      {String(event.metadata.windSpeed)} km/h <span>wind</span>
                    </p>
                  )}
                <div className="signal-foot">
                  <span>
                    {mode === "replay"
                      ? "Replay · simulated"
                      : event.simulated
                        ? "Simulated"
                        : "Live"}
                  </span>
                  <time dateTime={event.observedAt}>
                    {new Date(event.observedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      timeZone: "Asia/Kolkata",
                    })}{" "}
                    · {timeLabel(event.observedAt)} IST
                  </time>
                </div>
                {Date.parse(at) - Date.parse(event.observedAt) >
                  30 * 60_000 && (
                  <p className="stale-note">
                    Older observation · outside the 30-minute analysis window
                  </p>
                )}
              </>
            ) : (
              <div className="unavailable">
                <strong>Unavailable</strong>
                <p>Continuing with the other available information.</p>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
