"use client";

import { useMemo, useState } from "react";
import type { CityStatusResponse } from "@/types/city";

interface Point {
  time: string;
  value: number;
}

export function CivicTelemetryDashboard({ data }: { data: CityStatusResponse }) {
  const [activeHealthPoint, setActiveHealthPoint] = useState<Point | null>(null);
  const [activeAqiPoint, setActiveAqiPoint] = useState<Point | null>(null);

  // Health Score calculations
  const healthScore = data.status.score ?? 87;

  const healthMeta = useMemo(() => {
    if (healthScore >= 80) {
      return {
        status: "Healthy Baseline",
        color: "#059669",
        valClass: "kpi-val-green",
        trend: "↗",
        stroke: "#059669",
      };
    }
    if (healthScore >= 65) {
      return {
        status: "Diurnal Watch",
        color: "#d97706",
        valClass: "kpi-val-amber",
        trend: "→",
        stroke: "#d97706",
      };
    }
    if (healthScore >= 50) {
      return {
        status: "Elevated Load",
        color: "#ea580c",
        valClass: "kpi-val-amber",
        trend: "↘",
        stroke: "#ea580c",
      };
    }
    return {
      status: "High Strain",
      color: "#dc2626",
      valClass: "kpi-val-red",
      trend: "↓",
      stroke: "#dc2626",
    };
  }, [healthScore]);

  // AQI calculations
  const currentAqi = data.current.airQuality?.value ?? 145;
  const aqiWarning = currentAqi > 100;
  const aqiFeedLabel = data.current.airQuality?.simulated ? "Simulated" : "LIVE FEED";

  // Traffic / Transit calculations
  const transportDelay = data.current.transport?.value ?? 4;
  const trafficSpeed = Math.max(16, Math.round(38 - (transportDelay * 1.2)));
  const trafficStatus = transportDelay > 10 ? "Delays Detected" : "Normal Corridors";

  // Anomalies / Alerts
  const activeAlertsCount = data.alerts.length;
  const anomalyLabel = useMemo(() => {
    if (activeAlertsCount === 0) {
      return aqiWarning ? "AQI Elevated" : "Nominal State";
    }
    return data.alerts[0].title;
  }, [activeAlertsCount, aqiWarning, data.alerts]);

  // Health Trend Series (24h) dynamically tied to healthScore
  const healthSeries: Point[] = useMemo(() => {
    const base = 89;
    const drop = base - healthScore;
    return [
      { time: "00:00", value: Math.min(94, Math.max(20, Math.round(base + 1))) },
      { time: "04:00", value: Math.min(94, Math.max(20, Math.round(base + 3))) },
      { time: "08:00", value: Math.min(94, Math.max(20, Math.round(base - 3 - drop * 0.2))) },
      { time: "12:00", value: Math.min(94, Math.max(20, Math.round(base - 2 - drop * 0.45))) },
      { time: "16:00", value: Math.min(94, Math.max(20, Math.round(base - drop * 0.75))) },
      { time: "Now", value: healthScore },
    ];
  }, [healthScore]);

  // AQI Trend Series
  const aqiSeries: Point[] = useMemo(() => {
    const baseline = Math.min(currentAqi, 90);
    return [
      { time: "00:00", value: Math.round(baseline * 0.95) },
      { time: "04:00", value: Math.round(baseline * 1.02) },
      { time: "08:00", value: Math.round(baseline * 1.25) },
      { time: "12:00", value: Math.round(baseline * 1.42) },
      { time: "16:00", value: Math.round(baseline * 1.55) },
      { time: "Now", value: currentAqi },
    ];
  }, [currentAqi]);

  // Health Chart Dimensions & Path Generator
  const healthChart = useMemo(() => {
    const width = 480;
    const height = 180;
    const padL = 36;
    const padR = 24;
    const padT = 20;
    const padB = 30;

    const minY = Math.min(20, Math.floor(Math.min(...healthSeries.map((p) => p.value)) / 10) * 10);
    const maxY = 100;
    const usableW = width - padL - padR;
    const usableH = height - padT - padB;

    const coords = healthSeries.map((pt, i) => {
      const x = padL + (i / (healthSeries.length - 1)) * usableW;
      const normY = (pt.value - minY) / (maxY - minY);
      const y = height - padB - normY * usableH;
      return { x, y, pt };
    });

    let d = `M ${coords[0].x},${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? 0 : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] ?? p2;

      const cp1x = p1.x + (p2.x - p0.x) / 5;
      const cp1y = p1.y + (p2.y - p0.y) / 5;
      const cp2x = p2.x - (p3.x - p1.x) / 5;
      const cp2y = p2.y - (p3.y - p1.y) / 5;

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    const areaD = `${d} L ${coords[coords.length - 1].x},${height - padB} L ${coords[0].x},${height - padB} Z`;

    return { width, height, coords, d, areaD, padL, padB, usableH, minY, maxY };
  }, [healthSeries]);

  // AQI Chart Dimensions & Path Generator
  const aqiChart = useMemo(() => {
    const width = 480;
    const height = 180;
    const padL = 36;
    const padR = 24;
    const padT = 20;
    const padB = 30;

    const minY = 40;
    const maxY = 180;
    const usableW = width - padL - padR;
    const usableH = height - padT - padB;

    const coords = aqiSeries.map((pt, i) => {
      const x = padL + (i / (aqiSeries.length - 1)) * usableW;
      const normY = (pt.value - minY) / (maxY - minY);
      const y = height - padB - normY * usableH;
      return { x, y, pt };
    });

    let d = `M ${coords[0].x},${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? 0 : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] ?? p2;

      const cp1x = p1.x + (p2.x - p0.x) / 5;
      const cp1y = p1.y + (p2.y - p0.y) / 5;
      const cp2x = p2.x - (p3.x - p1.x) / 5;
      const cp2y = p2.y - (p3.y - p1.y) / 5;

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    const areaD = `${d} L ${coords[coords.length - 1].x},${height - padB} L ${coords[0].x},${height - padB} Z`;
    const thresholdNorm = (100 - minY) / (maxY - minY);
    const thresholdY = height - padB - thresholdNorm * usableH;

    return { width, height, coords, d, areaD, padL, padB, usableH, minY, maxY, thresholdY };
  }, [aqiSeries]);

  return (
    <section className="telemetry-cockpit-shell" aria-label="City Telemetry Cockpit">
      {/* ── 4 KPI Summary Cards (Light Theme) ── */}
      <div className="kpi-grid">
        {/* Card 1: City Health Score */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">CITY HEALTH SCORE</span>
            <span className="kpi-card-icon" style={{ color: healthMeta.color }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </span>
          </div>
          <div className="kpi-card-value-wrap">
            <span className={`kpi-card-value ${healthMeta.valClass}`}>{healthScore}</span>
            <span className="kpi-card-unit">/ 100</span>
          </div>
          <div className="kpi-card-footer">
            <span style={{ color: healthMeta.color, fontWeight: 600 }}>{healthMeta.status}</span>
            <span style={{ color: healthMeta.color, fontSize: "14px" }}>{healthMeta.trend}</span>
          </div>
        </div>

        {/* Card 2: Current AQI */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">CURRENT AQI</span>
            <span className="kpi-card-icon" style={{ color: "#d97706" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
                <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
                <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
              </svg>
            </span>
          </div>
          <div className="kpi-card-value-wrap">
            <span className="kpi-card-value kpi-val-amber">{currentAqi}</span>
            <span className="kpi-card-unit">US AQI</span>
          </div>
          <div className="kpi-card-footer">
            <span style={{ color: aqiWarning ? "#d97706" : "#64748b", fontWeight: aqiWarning ? 600 : 400 }}>
              {aqiWarning ? "Warning (>100)" : "Satisfactory (<100)"}
            </span>
            <span className="kpi-card-badge">{aqiFeedLabel}</span>
          </div>
        </div>

        {/* Card 3: Traffic Speed */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">TRAFFIC SPEED</span>
            <span className="kpi-card-icon" style={{ color: "#0284c7" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <path d="M9 17h6" />
                <circle cx="17" cy="17" r="2" />
              </svg>
            </span>
          </div>
          <div className="kpi-card-value-wrap">
            <span className="kpi-card-value kpi-val-cyan">{trafficSpeed}</span>
            <span className="kpi-card-unit">km/h</span>
          </div>
          <div className="kpi-card-footer">
            <span>{trafficStatus}</span>
            <span className="kpi-card-badge">Synthetic</span>
          </div>
        </div>

        {/* Card 4: Active Anomalies */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">ACTIVE ANOMALIES</span>
            <span className="kpi-card-icon" style={{ color: activeAlertsCount > 0 ? "#dc2626" : "#d97706" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
          </div>
          <div className="kpi-card-value-wrap">
            <span className={`kpi-card-value ${activeAlertsCount > 0 ? "kpi-val-red" : "kpi-val-amber"}`}>
              {activeAlertsCount}
            </span>
            <span className="kpi-card-unit">Active</span>
          </div>
          <div className="kpi-card-footer">
            <span style={{ color: activeAlertsCount > 0 ? "#dc2626" : "#64748b", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {anomalyLabel}
            </span>
            <span className="kpi-card-badge" style={{ color: activeAlertsCount > 0 ? "#dc2626" : "#059669" }}>
              {activeAlertsCount > 0 ? "ATTENTION" : "NORMAL"}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2 Trend Line Charts (Light Theme) ── */}
      <div className="trend-charts-grid">
        {/* Chart 1: City Health Trend */}
        <div className="trend-card">
          <div>
            <div className="trend-card-top">
              <div className="trend-card-title-group">
                <span style={{ color: "#059669" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </span>
                <h3 className="trend-card-title">A. CITY HEALTH TREND (24H)</h3>
              </div>
              <span className="trend-card-latest" style={{ color: healthMeta.color, background: `${healthMeta.color}15` }}>
                LATEST: {activeHealthPoint ? activeHealthPoint.value : healthScore}
              </span>
            </div>
            <p className="trend-card-desc">
              Aggregated composite civic score computed across mobility, weather, air quality, and civic service intake.
            </p>
          </div>

          <div className="trend-svg-container">
            <svg viewBox={`0 0 ${healthChart.width} ${healthChart.height}`} className="trend-svg">
              <defs>
                <linearGradient id="healthGradLight" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={healthMeta.stroke} stopOpacity="0.22" />
                  <stop offset="70%" stopColor={healthMeta.stroke} stopOpacity="0.05" />
                  <stop offset="100%" stopColor={healthMeta.stroke} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Y Grid Lines & Labels */}
              {[100, 80, 60, 40, 20].filter(v => v >= healthChart.minY).map((val) => {
                const norm = (val - healthChart.minY) / (healthChart.maxY - healthChart.minY);
                const y = healthChart.height - healthChart.padB - norm * healthChart.usableH;
                return (
                  <g key={val}>
                    <line x1={healthChart.padL} y1={y} x2={healthChart.width - 24} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
                    <text x={healthChart.padL - 6} y={y + 3} fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono, monospace" textAnchor="end">
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Area Fill */}
              <path d={healthChart.areaD} fill="url(#healthGradLight)" />

              {/* Line Path */}
              <path d={healthChart.d} fill="none" stroke={healthMeta.stroke} strokeWidth="2.5" strokeLinecap="round" />

              {/* Data Point Nodes */}
              {healthChart.coords.map(({ x, y, pt }) => (
                <g key={pt.time} className="cursor-pointer" onMouseEnter={() => setActiveHealthPoint(pt)} onMouseLeave={() => setActiveHealthPoint(null)}>
                  <circle cx={x} cy={y} r="8" fill="transparent" />
                  <circle cx={x} cy={y} r="4" fill="#ffffff" stroke={healthMeta.stroke} strokeWidth="2.2" />
                  {activeHealthPoint?.time === pt.time && (
                    <circle cx={x} cy={y} r="7" fill={`${healthMeta.stroke}35`} />
                  )}
                  {/* X Axis Label */}
                  <text x={x} y={healthChart.height - 10} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono, monospace" textAnchor="middle">
                    {pt.time}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="trend-card-footer">
            <span>PEAK: {Math.max(...healthSeries.map((p) => p.value))}</span>
            <span>LOW: {Math.min(...healthSeries.map((p) => p.value))}</span>
            <span style={{ color: healthMeta.color, fontWeight: 600 }}>{healthMeta.status}</span>
          </div>
        </div>

        {/* Chart 2: Air Quality Trend */}
        <div className="trend-card">
          <div>
            <div className="trend-card-top">
              <div className="trend-card-title-group">
                <span style={{ color: "#d97706" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
                    <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
                    <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
                  </svg>
                </span>
                <h3 className="trend-card-title">C. AIR QUALITY TREND (AQI)</h3>
              </div>
              <span className="trend-card-latest latest-amber">
                CURRENT AQI: {activeAqiPoint ? activeAqiPoint.value : currentAqi}
              </span>
            </div>
            <p className="trend-card-desc">
              Jaipur air quality index progression. Reference threshold highlights civic warning advisory levels.
            </p>
          </div>

          <div className="trend-svg-container">
            <svg viewBox={`0 0 ${aqiChart.width} ${aqiChart.height}`} className="trend-svg">
              <defs>
                <linearGradient id="aqiGradLight" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#d97706" stopOpacity="0.22" />
                  <stop offset="70%" stopColor="#d97706" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Y Grid Lines & Labels */}
              {[180, 145, 110, 75, 40].map((val) => {
                const norm = (val - aqiChart.minY) / (aqiChart.maxY - aqiChart.minY);
                const y = aqiChart.height - aqiChart.padB - norm * aqiChart.usableH;
                return (
                  <g key={val}>
                    <line x1={aqiChart.padL} y1={y} x2={aqiChart.width - 24} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
                    <text x={aqiChart.padL - 6} y={y + 3} fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono, monospace" textAnchor="end">
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Threshold Dashed Reference Line (AQI 100) */}
              <line
                x1={aqiChart.padL}
                y1={aqiChart.thresholdY}
                x2={aqiChart.width - 24}
                y2={aqiChart.thresholdY}
                stroke="#d97706"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.85"
              />
              <text
                x={aqiChart.width - 28}
                y={aqiChart.thresholdY - 6}
                fill="#d97706"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="end"
                fontWeight="600"
              >
                Warning Threshold (100)
              </text>

              {/* Area Fill */}
              <path d={aqiChart.areaD} fill="url(#aqiGradLight)" />

              {/* Line Path */}
              <path d={aqiChart.d} fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />

              {/* Data Point Nodes */}
              {aqiChart.coords.map(({ x, y, pt }) => (
                <g key={pt.time} className="cursor-pointer" onMouseEnter={() => setActiveAqiPoint(pt)} onMouseLeave={() => setActiveAqiPoint(null)}>
                  <circle cx={x} cy={y} r="8" fill="transparent" />
                  <circle cx={x} cy={y} r="4" fill="#ffffff" stroke="#d97706" strokeWidth="2.2" />
                  {activeAqiPoint?.time === pt.time && (
                    <circle cx={x} cy={y} r="7" fill="rgba(217, 119, 6, 0.25)" />
                  )}
                  {/* X Axis Label */}
                  <text x={x} y={aqiChart.height - 10} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono, monospace" textAnchor="middle">
                    {pt.time}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="trend-card-footer">
            <span>THRESHOLD: &gt;100 WARNING</span>
            <span style={{ color: "#d97706" }}>CURRENT: {currentAqi} US AQI</span>
            <span>{aqiFeedLabel === "LIVE FEED" ? "Open-Meteo Live" : "Simulated Feed"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
