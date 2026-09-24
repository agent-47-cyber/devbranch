"use client";

import { useState } from "react";
import type { CityStatusResponse } from "@/types/city";

export interface IncidentItem {
  id: string;
  ref: string;
  type: string;
  category: "water" | "traffic" | "alert" | "air";
  zone: string;
  severity: "High" | "Medium" | "Low";
  timeline: string;
  status: "MONITORING" | "DISPATCHED" | "INVESTIGATING" | "CONTAINED";
}

export function ActiveIncidents({ data }: { data: CityStatusResponse }) {
  const [filter, setFilter] = useState<"All" | "High" | "Medium" | "Low">("All");

  // Derive incidents from data.alerts + live field reports
  const list: IncidentItem[] = [];

    // Map any active civic alerts first
    data.alerts.forEach((alert, index) => {
      let category: "water" | "traffic" | "alert" | "air" = "alert";
      let severity: "High" | "Medium" | "Low" = "Medium";

      if (alert.source === "weather" || alert.title.toLowerCase().includes("rain")) {
        category = "water";
        severity = alert.value > 12 ? "High" : "Medium";
      } else if (alert.source === "local_report" || alert.title.toLowerCase().includes("waterlogging")) {
        category = "water";
        severity = alert.value > 10 ? "High" : "Medium";
      } else if (alert.source === "transport" || alert.title.toLowerCase().includes("delay")) {
        category = "traffic";
        severity = alert.value > 15 ? "High" : "Medium";
      } else if (alert.source === "air_quality" || alert.title.toLowerCase().includes("air")) {
        category = "air";
        severity = alert.value > 150 ? "High" : "Medium";
      }

      list.push({
        id: `alert-${alert.id}-${index}`,
        ref: `REF: INC-${1045 + index}`,
        type: alert.title,
        category,
        zone: alert.area,
        severity,
        timeline: "Just now (Live)",
        status: severity === "High" ? "INVESTIGATING" : "MONITORING",
      });
    });

    // Baseline field incidents matching command center telemetry feed
    const baselineItems: IncidentItem[] = [
      {
        id: "inc-1049",
        ref: "REF: INC-1049",
        type: "Waterlogging reported",
        category: "water",
        zone: "Malviya Nagar",
        severity: (data.current.reports?.value ?? 0) > 8 ? "High" : "Low",
        timeline: "12 min ago (16:18)",
        status: "MONITORING",
      },
      {
        id: "inc-1048",
        ref: "REF: INC-1048",
        type: "Traffic congestion",
        category: "traffic",
        zone: "C-Scheme",
        severity: (data.current.transport?.value ?? 0) > 12 ? "High" : "Medium",
        timeline: "18 min ago (16:12)",
        status: "DISPATCHED",
      },
      {
        id: "inc-1047",
        ref: "REF: INC-1047",
        type: "Road obstruction",
        category: "alert",
        zone: "Mansarovar",
        severity: "High",
        timeline: "31 min ago (15:59)",
        status: "INVESTIGATING",
      },
    ];

    // Combine avoiding duplicate zones/types
    for (const item of baselineItems) {
      if (!list.some((existing) => existing.zone === item.zone && existing.type === item.type)) {
        list.push(item);
      }
    }

  const filteredIncidents =
    filter === "All" ? list : list.filter((item) => item.severity === filter);

  return (
    <section className="telemetry-cockpit-shell" aria-labelledby="incidents-title">
      <div className="incidents-section">
        {/* Section Header */}
        <div className="incidents-header-wrap">
          <div>
            <div className="incidents-subhead">
              <span className="incidents-pulse-dot" />
              <span>CIVIL VERIFICATION STREAM</span>
            </div>
            <h2 id="incidents-title" className="incidents-main-title">
              ACTIVE INCIDENTS
            </h2>
            <p className="incidents-subtitle">
              Field reports and sensor-triggered exceptions currently under dispatch
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="incidents-filters" role="tablist" aria-label="Incident severity filters">
            {(["All", "High", "Medium", "Low"] as const).map((lvl) => (
              <button
                key={lvl}
                role="tab"
                aria-selected={filter === lvl}
                className={`incident-filter-btn ${filter === lvl ? "active" : ""}`}
                onClick={() => setFilter(lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Incidents Table Container */}
        <div className="incidents-table-container">
          <table className="incidents-table">
            <thead>
              <tr>
                <th style={{ width: "32%" }}>INCIDENT TYPE &amp; ID</th>
                <th style={{ width: "22%" }}>ZONE LOCATION</th>
                <th style={{ width: "14%" }}>SEVERITY</th>
                <th style={{ width: "18%" }}>TIMELINE</th>
                <th style={{ width: "14%" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map((incident) => (
                <tr key={incident.id} className="incident-row">
                  {/* Incident Type & ID */}
                  <td>
                    <div className="incident-cell-main">
                      <div className={`incident-icon-box ${
                        incident.category === "water"
                          ? "icon-box-water"
                          : incident.category === "traffic"
                          ? "icon-box-traffic"
                          : incident.category === "air"
                          ? "icon-box-air"
                          : "icon-box-alert"
                      }`}>
                        {incident.category === "water" ? (
                          /* Water Drop SVG */
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                          </svg>
                        ) : incident.category === "traffic" ? (
                          /* Car / Traffic SVG */
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2" />
                            <circle cx="7" cy="17" r="2" />
                            <path d="M9 17h6" />
                            <circle cx="17" cy="17" r="2" />
                          </svg>
                        ) : incident.category === "air" ? (
                          /* Wind / Air SVG */
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
                            <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
                            <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
                          </svg>
                        ) : (
                          /* Alert Triangle SVG */
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="incident-title">{incident.type}</div>
                        <div className="incident-ref">{incident.ref}</div>
                      </div>
                    </div>
                  </td>

                  {/* Zone Location */}
                  <td>
                    <div className="incident-location">
                      <svg className="incident-loc-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{incident.zone}</span>
                    </div>
                  </td>

                  {/* Severity */}
                  <td>
                    <span className={`severity-badge ${
                      incident.severity === "High"
                        ? "severity-high"
                        : incident.severity === "Medium"
                        ? "severity-medium"
                        : "severity-low"
                    }`}>
                      {incident.severity}
                    </span>
                  </td>

                  {/* Timeline */}
                  <td>
                    <div className="incident-timeline">
                      <svg className="incident-time-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{incident.timeline}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    <div className="incident-status">
                      <span className="incident-status-dot" />
                      <span>{incident.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
