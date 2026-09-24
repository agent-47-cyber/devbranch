"use client";
import { useEffect, useState } from "react";
interface HeaderProps {
  mode: "live" | "replay";
  updatedAt: string;
  onModeChange: (mode: "live" | "replay") => void;
}
export function Header({ mode, updatedAt, onModeChange }: HeaderProps) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const seconds =
    now && updatedAt
      ? Math.max(0, Math.floor((now - Date.parse(updatedAt)) / 1000))
      : 0;
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="CityPulse home">
        <svg viewBox="0 0 32 24" aria-hidden="true">
          <path d="M1 12h7l4-9 7 19 4-10h8" />
        </svg>
        CityPulse<span>JAIPUR</span>
      </a>
      <span className="place">
        <i />
        Jaipur, IN
      </span>
      <div className="header-right">
        <span className="freshness">
          <i />
          {mode === "replay"
            ? "Scenario replay"
            : updatedAt
              ? `Checked ${seconds < 60 ? seconds + "s" : Math.floor(seconds / 60) + "m"} ago`
              : "Checking feeds"}
        </span>
        <div className="mode-switch" aria-label="Data mode">
          {(["live", "replay"] as const).map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={mode === value}
              onClick={() => onModeChange(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
