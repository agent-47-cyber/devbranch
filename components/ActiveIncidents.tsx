"use client";
import { useState } from "react";
import type { CityEvent, CityStatusResponse } from "@/types/city";
import { isCurrentMapEvent, incidentTitle } from "@/lib/mapView";
import { timeLabel } from "@/lib/display";

/* ── Severity logic ── */
function severity(event: CityEvent): "Low" | "Medium" | "High" {
  const thresholds: Record<string, [number, number]> = {
    rain: [3, 8],
    aqi: [100, 150],
    delay: [10, 20],
    waterlogging: [3, 6],
    "road blockage": [2, 5],
    "traffic signal problem": [2, 4],
    "power outage": [2, 5],
    "fallen tree": [2, 4],
  };
  const [med, high] = thresholds[event.type] ?? [5, 10];
  if (event.value >= high) return "High";
  if (event.value >= med) return "Medium";
  return "Low";
}

/* ── Status label ── */
function statusLabel(
  event: CityEvent,
  isAlert: boolean,
): { text: string; color: string } {
  if (isAlert) return { text: "Flagged", color: "#dc2626" };
  if (event.simulated) return { text: "Simulated", color: "#8b5cf6" };
  return { text: "Monitoring", color: "#059669" };
}

/* ── Relative time ── */
function relativeTime(observedAt: string, now: string): string {
  const diff = Date.parse(now) - Date.parse(observedAt);
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
}

/* ── Icon per type ── */
function TypeIcon({ type }: { type: string }) {
  const icons: Record<string, { svg: string; boxClass: string }> = {
    waterlogging: {
      svg: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
      boxClass: "icon-box-water",
    },
    rain: {
      svg: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
      boxClass: "icon-box-water",
    },
    delay: {
      svg: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z",
      boxClass: "icon-box-traffic",
    },
    aqi: {
      svg: "M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66L7 18h2v4h2v-6h2v6h2v-4h2l1.29 4 1.89-.66C18.1 16.17 15.9 10.17 17 8zM12 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z",
      boxClass: "icon-box-air",
    },
    "road blockage": {
      svg: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",
      boxClass: "icon-box-alert",
    },
    "traffic signal problem": {
      svg: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",
      boxClass: "icon-box-alert",
    },
    "power outage": {
      svg: "M7 2v11h3v9l7-12h-4l4-8z",
      boxClass: "icon-box-alert",
    },
    "fallen tree": {
      svg: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",
      boxClass: "icon-box-alert",
    },
  };
  const icon = icons[type] ?? icons["road blockage"]!;
  return (
    <span className={`incident-icon-box ${icon.boxClass}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d={icon.svg} />
      </svg>
    </span>
  );
}

/* ── Ref ID generator ── */
function refId(event: CityEvent): string {
  // Deterministic from event id
  const n = event.id
    .split("")
    .reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return `INC-${1000 + (n % 999)}`;
}

export function ActiveIncidents({ data }: { data: CityStatusResponse }) {
  const [filter, setFilter] = useState("All");
  const rows = data.mapEvents.filter(
    (event) =>
      isCurrentMapEvent(event, data.updatedAt) && event.value > 0,
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
            <div className="incidents-subhead">
              <span className="incidents-pulse-dot" />
              Civic verification stream
            </div>
            <h2 id="incidents-title" className="incidents-main-title">
              Active Incidents
            </h2>
            <p className="incidents-subtitle">
              Flagged readings and field reports within 30 minutes of{" "}
              {timeLabel(data.updatedAt)} IST. No dispatch status is inferred.
            </p>
          </div>
          <div
            className="incidents-filters"
            aria-label="Filter report sources"
          >
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

        {visible.length > 0 ? (
          <>
            <div className="incidents-table-container">
              <table className="incidents-table">
                <thead>
                  <tr>
                    <th>Incident type &amp; ID</th>
                    <th>Zone location</th>
                    <th>Severity</th>
                    <th>Timeline</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((event) => {
                    const sev = severity(event);
                    const isAlert = data.alerts.some(
                      (a) => a.eventId === event.id,
                    );
                    const st = statusLabel(event, isAlert);
                    return (
                      <tr key={event.id} className="incident-row">
                        <td>
                          <div className="incident-cell-main">
                            <TypeIcon type={event.type} />
                            <div>
                              <div className="incident-title">
                                {incidentTitle(event)}
                              </div>
                              <div className="incident-ref">
                                Ref: {refId(event)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="incident-location">
                            <svg
                              className="incident-loc-icon"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="10" r="3" />
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                            </svg>
                            {event.area}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`severity-badge severity-${sev.toLowerCase()}`}
                          >
                            {sev}
                          </span>
                        </td>
                        <td>
                          <div className="incident-timeline">
                            <svg
                              className="incident-time-icon"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {relativeTime(event.observedAt, data.updatedAt)} (
                            {timeLabel(event.observedAt)})
                          </div>
                        </td>
                        <td>
                          <div className="incident-status">
                            <span
                              className="incident-status-dot"
                              style={{ background: st.color }}
                            />
                            {st.text}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="incidents-table-footer">
              <span className="incidents-count">
                Showing {visible.length} of {rows.length}{" "}
                {visible.some((e) => e.simulated) ? "synthetic" : ""} civic
                incident report{rows.length === 1 ? "" : "s"}
              </span>
            </div>
          </>
        ) : (
          <div className="incidents-empty-state">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 15s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
            <p className="incidents-empty-title">No active incidents</p>
            <p className="incidents-empty-desc">
              No current observations match this filter. Missing reports do not
              confirm clear roads.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
