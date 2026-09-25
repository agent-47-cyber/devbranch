"use client";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { CityLandmark } from "@/components/CityLandmark";
import { timeLabel } from "@/lib/display";
import type { CityStatusResponse } from "@/types/city";

export function CityStatus({ data, area = "Malviya Nagar" }: { data: CityStatusResponse; area?: string }) {
  const { mode, status, analysis, current, possibleLinks } = data;
  const link = possibleLinks[0];
  const available = data.sources.filter(
    (source) => source.status !== "unavailable",
  ).length;
  const temperature = current.weather?.metadata?.temperature;
  const headline =
    mode === "replay"
      ? link
        ? "A city.\nConnected."
        : "Before the\nchange."
      : "A city.\nIn perspective.";
  return (
    <section
      className="pulse-hero"
      id="overview"
      aria-labelledby="city-status-title"
    >
      <div className="observatory-topline">
        <p className="eyebrow">
          <i />{" "}
          {mode === "live" ? "The Jaipur observatory" : "The Jaipur replay"}
        </p>
        <span>
          {current.weather?.latitude?.toFixed(4) ?? "26.8477"}° N
          &nbsp; {current.weather?.longitude?.toFixed(4) ?? "75.8113"}° E <b> / </b> INDIA
        </span>
      </div>
      <div className="observatory-layout">
        <div className="intro-copy">
          <p className="edition-label">
            {mode === "live"
              ? "PUBLIC DATA. HUMAN PERSPECTIVE."
              : `SIMULATED SCENARIO / ${timeLabel(data.updatedAt)} IST`}
          </p>
          <h1 id="city-status-title">
            {headline.split("\n")[0]}
            <br />
            <em>{headline.split("\n")[1]}</em>
          </h1>
          <p className="intro-description">
            {mode === "live"
              ? "Weather, air, movement and local reports. Different signals, brought together to help you see what’s happening—and why it matters."
              : "Follow a rain event as reports and delays emerge. Not today’s conditions: a repeatable demonstration of how possible links are found."}
          </p>
          <div className="hero-state">
            <span
              className={`state-pill ${analysis.scoreAvailable ? "" : "partial"}`}
            >
              <i />
              {analysis.scoreAvailable
                ? status.label
                : available === 0
                  ? "Feeds unavailable"
                  : mode === "replay"
                    ? "Building comparison history"
                    : "Partial live picture"}
            </span>
            <span>{analysis.activeSources}/4 feeds in the analysis window</span>
          </div>
          <a className="explore-link" href="#situation">
            Read the city <span>↘</span>
          </a>
        </div>
        <div className="city-observatory">
          <div className="observatory-grid" aria-hidden="true" />
          <div className="orbit orbit-one" aria-hidden="true" />
          <div className="orbit orbit-two" aria-hidden="true" />
          <span className="observatory-label">
            JAIPUR <small>THE PINK CITY</small>
          </span>
          <CityLandmark />
          <div className="floating-reading weather-reading">
            <span>
              RAIN / {current.weather?.simulated ? "SIMULATED" : "OPEN-METEO"}
            </span>
            <strong>
              {current.weather?.value ?? "—"}
              <small> mm</small>
            </strong>
            <p>
              {typeof temperature === "number" ? `${temperature}°C · ` : ""}
              {current.weather
                ? `${timeLabel(current.weather.observedAt)} IST`
                : "Unavailable"}
            </p>
          </div>
          <div className="floating-reading air-reading">
            <span>
              AIR / {current.airQuality?.simulated ? "SIMULATED" : "OPEN-METEO"}
            </span>
            <strong>
              {current.airQuality?.value ?? "—"}
              <small> US AQI</small>
            </strong>
            <p>
              {current.airQuality
                ? `${timeLabel(current.airQuality.observedAt)} IST`
                : "Unavailable"}
            </p>
          </div>
          <div className="observatory-caption">
            <span className="source-dot" />
            {mode === "live"
              ? `Latest model readings · ${area}`
              : "Illustration · simulated scenario"}
          </div>
        </div>
      </div>
      <div className="pulse-brief">
        <div className="brief-index">
          <small>CHANGE INDEX</small>
          <strong>
            {analysis.scoreAvailable ? (
              <AnimatedNumber value={status.score} />
            ) : (
              "—"
            )}
            {analysis.scoreAvailable && <span>/100</span>}
          </strong>
          <span>
            {analysis.scoreAvailable
              ? "Prototype score"
              : "Not enough current evidence"}
          </span>
        </div>
        <div className="brief-summary">
          <p className="eyebrow">
            {link ? "A possible link is emerging" : "What we can say right now"}
          </p>
          <p>{data.summary}</p>
          <small className="brief-provider" title={data.summaryMeta?.note}>
            {data.summaryMeta?.provider === "groq"
              ? "Groq-assisted brief · source-grounded facts"
              : mode === "replay"
                ? "Scenario summary"
                : "Template summary · AI unavailable or not configured"}
          </small>
        </div>
        <details className="score-method">
          <summary>
            {analysis.scoreAvailable ? "Why this score?" : "Why no score?"}
            <span>+</span>
          </summary>
          <p>{analysis.explanation}</p>
          <p>
            {mode === "replay"
              ? "Replay uses fixed inputs, so the same moment always gives the same result."
              : "A refresh retrieves available data; it does not mean the provider has produced a new reading."}
          </p>
        </details>
      </div>
      <div className="provenance-ribbon">
        <span>
          <i />
          {mode === "live"
            ? "2 public feeds + 2 simulations"
            : "4 simulated feeds · not live conditions"}
        </span>
        <span>30-minute analysis window</span>
        <span>Possible links. Never assumed causes.</span>
      </div>
    </section>
  );
}
