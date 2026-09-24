"use client";
import { useRef, useState } from "react";
import type { CityStatusResponse } from "@/types/city";

interface TickerItem {
  id: string;
  text: string;
  type: "update" | "alert" | "link" | "status";
}

function buildTicker(data: CityStatusResponse): TickerItem[] {
  const items: TickerItem[] = [];

  // Status headline
  items.push({
    id: "status",
    text: `JAIPUR STATUS: ${data.status.label.toUpperCase()} · ${data.analysis.activeSources}/4 feeds active`,
    type: "status",
  });

  // Possible links
  for (const link of data.possibleLinks) {
    items.push({
      id: `link-${link.id}`,
      text: `⚡ POSSIBLE LINK: ${link.summary}`,
      type: "link",
    });
  }

  // Alerts
  for (const alert of data.alerts) {
    items.push({
      id: `alert-${alert.id}`,
      text: `▲ ${alert.title}: ${alert.summary}`,
      type: "alert",
    });
  }

  // Recent updates
  for (const update of data.recentUpdates.slice(-4)) {
    items.push({
      id: `update-${update.id}`,
      text: `${update.title} · ${update.detail}`,
      type: "update",
    });
  }

  // Ensure minimum items for smooth scrolling
  if (items.length < 3) {
    items.push({
      id: "monitoring",
      text: "CityPulse is monitoring weather, air quality, transport and local reports across Jaipur.",
      type: "status",
    });
  }

  return items;
}

export function NarrativeTicker({ data }: { data: CityStatusResponse }) {
  const items = buildTicker(data);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Duplicate items for seamless loop
  const doubled = [...items, ...items];

  return (
    <div
      className="narrative-ticker"
      role="marquee"
      aria-label="Live civic updates"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="ticker-badge">
        <span className="ticker-live-dot" />
        {data.mode === "replay" ? "REPLAY" : "LIVE"}
      </div>
      <div className="ticker-track-wrapper">
        <div
          ref={trackRef}
          className={`ticker-track ${paused ? "paused" : ""}`}
        >
          {doubled.map((item, i) => (
            <span
              key={`${item.id}-${i}`}
              className={`ticker-item ticker-${item.type}`}
            >
              {item.text}
              <i className="ticker-separator">◆</i>
            </span>
          ))}
        </div>
      </div>
      <button
        className="ticker-pause"
        onClick={() => setPaused(!paused)}
        aria-label={paused ? "Resume ticker" : "Pause ticker"}
      >
        {paused ? "▶" : "❚❚"}
      </button>
    </div>
  );
}
