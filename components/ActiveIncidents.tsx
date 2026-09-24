"use client";
import { useState } from "react";
import type { CityStatusResponse } from "@/types/city";
import { isCurrentMapEvent, incidentTitle } from "@/lib/mapView";
import { timeLabel } from "@/lib/display";

export function ActiveIncidents({ data }: { data: CityStatusResponse }) {
  const [filter, setFilter] = useState("All");
  const rows = data.mapEvents.filter(
    (event) =>
      isCurrentMapEvent(event, data.updatedAt) &&
      event.value > 0 &&
      (event.source === "local_report" ||
        event.source === "transport" ||
        data.alerts.some((alert) => alert.eventId === event.id)),
  );
  const visible = rows.filter(
    (event) =>
      filter === "All" ||
      (filter === "Simulated" ? event.simulated : !event.simulated),
  );
  return (
    <section
      className="telemetry-cockpit-shell"
      aria-labelledby="incidents-title"
    >
      <div className="incidents-section">
        <div className="incidents-header-wrap">
          <div>
            <p className="eyebrow">Current observation window</p>
            <h2 id="incidents-title" className="incidents-main-title">
              Around the neighborhoods.
            </h2>
            <p className="incidents-subtitle">
              Reports and flagged readings within 30 minutes of{" "}
              {timeLabel(data.updatedAt)} IST. No dispatch status is inferred.
            </p>
          </div>
          <div className="incidents-filters" aria-label="Filter report sources">
            {["All", "Public", "Simulated"].map((label) => (
              <button
                key={label}
                className={`incident-filter-btn ${filter === label ? "active" : ""}`}
                aria-pressed={filter === label}
                onClick={() => setFilter(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="incident-cards">
          {visible.map((event) => (
            <article className="incident-observation" key={event.id}>
              <div className="incident-observation-top">
                <span className="kpi-card-badge">
                  {event.simulated ? "Simulated" : "Public feed"}
                </span>
                <time dateTime={event.observedAt}>
                  {timeLabel(event.observedAt)} IST
                </time>
              </div>
              <h3>{incidentTitle(event)}</h3>
              <p>{event.area}</p>
              <strong>
                {event.value} <small>{event.unit}</small>
              </strong>
              <p className="incident-note">
                {data.alerts.some((alert) => alert.eventId === event.id)
                  ? "Above the prototype threshold"
                  : "Reported observation"}
              </p>
            </article>
          ))}
        </div>
        {!visible.length && (
          <p className="observation-empty">
            No current observations match this filter. Missing reports do not
            confirm clear roads.
          </p>
        )}
      </div>
    </section>
  );
}
