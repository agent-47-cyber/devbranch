"use client";
import { useEffect, useRef, useState } from "react";
import { timeLabel } from "@/lib/display";
import type { CityStatusResponse } from "@/types/city";

interface LogEntry {
  id: string;
  at: string;
  action: string;
  detail: string;
  severity: "info" | "watch" | "alert" | "link";
}

function createLog(data: CityStatusResponse): LogEntry[] {
  const entries: LogEntry[] = [];
  const now = data.updatedAt;

  // Source scan entries
  for (const source of data.sources) {
    entries.push({
      id: `scan-${source.source}`,
      at: now,
      action: "SCAN",
      detail:
        source.status === "unavailable"
          ? `${source.source} feed unavailable — skipped`
          : `${source.source} feed ${source.status === "live" ? "retrieved" : "loaded"} successfully`,
      severity: source.status === "unavailable" ? "watch" : "info",
    });
  }

  // Anomaly checks
  for (const alert of data.alerts) {
    entries.push({
      id: `anomaly-${alert.id}`,
      at: alert.observedAt,
      action: "FLAG",
      detail: `${alert.title} — ${alert.value} ${alert.unit} exceeds ${alert.threshold} ${alert.unit} threshold in ${alert.area}`,
      severity: "alert",
    });
  }

  // Link detection
  for (const link of data.possibleLinks) {
    entries.push({
      id: `link-${link.id}`,
      at: link.endTime,
      action: "LINK",
      detail: `Possible link detected in ${link.area}: ${link.signals.join(", ")} — score ${Math.round(link.linkScore * 100)}%`,
      severity: "link",
    });
  }

  // Analysis summary
  entries.push({
    id: "analysis",
    at: now,
    action: "STATUS",
    detail: `City status: ${data.status.label} · ${data.analysis.activeSources}/4 feeds in window · ${data.possibleLinks.length} link(s)`,
    severity:
      data.status.label === "High" || data.status.label === "Elevated"
        ? "alert"
        : "info",
  });

  return entries.sort(
    (a, b) => Date.parse(a.at) - Date.parse(b.at),
  );
}

export function MonitorAgent({ data }: { data: CityStatusResponse }) {
  const entries = createLog(data);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length, data.updatedAt]);

  const statusChecks = data.sources.filter(
    (s) => s.status !== "unavailable",
  ).length;
  const flags = data.alerts.length;
  const links = data.possibleLinks.length;

  return (
    <section
      className="monitor-agent section-shell"
      aria-labelledby="monitor-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">Agentic monitoring</p>
          <h2 id="monitor-title">
            Always watching.
            <br />
            <span>Quietly flagging.</span>
          </h2>
        </div>
        <p>
          CityPulse&apos;s agent scans all feeds,
          <br />
          detects anomalies, and raises flags.
        </p>
      </div>

      <div className="monitor-dashboard">
        {/* Agent status bar */}
        <div className="agent-status-bar">
          <div className="agent-identity">
            <span className="agent-avatar">
              <span className="agent-pulse" />
            </span>
            <div>
              <strong>CityPulse Agent</strong>
              <span>
                {data.mode === "replay" ? "Replay analysis" : "Live monitoring"}{" "}
                · {timeLabel(data.updatedAt)} IST
              </span>
            </div>
          </div>
          <div className="agent-stats">
            <div className="agent-stat">
              <strong>{statusChecks}</strong>
              <span>Feeds</span>
            </div>
            <div className="agent-stat">
              <strong>{flags}</strong>
              <span>Flags</span>
            </div>
            <div className="agent-stat">
              <strong>{links}</strong>
              <span>Links</span>
            </div>
          </div>
        </div>

        {/* Agent log */}
        <div
          ref={scrollRef}
          className={`agent-log ${expanded ? "expanded" : ""}`}
        >
          {entries.map((entry) => (
            <div key={entry.id} className={`log-entry log-${entry.severity}`}>
              <span className="log-time">{timeLabel(entry.at)}</span>
              <span className={`log-badge log-badge-${entry.severity}`}>
                {entry.action}
              </span>
              <span className="log-detail">{entry.detail}</span>
            </div>
          ))}
        </div>

        <button
          className="agent-expand"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Collapse log" : `Show full log (${entries.length} entries)`}
          <span>{expanded ? "−" : "+"}</span>
        </button>
      </div>

      <p className="monitor-footnote">
        The agent is a deterministic pipeline, not a large language model. It
        checks feeds on a schedule, compares readings to their baseline, and
        flags values above prototype thresholds. It cannot learn or self-modify.
      </p>
    </section>
  );
}
