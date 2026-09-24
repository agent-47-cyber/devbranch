"use client";
import { useEffect, useRef } from "react";
import type { CityStatusResponse } from "@/types/city";

const SPEEDS: Record<string, number> = {
  stable: 2400,
  watch: 1600,
  elevated: 1000,
  high: 650,
};

/**
 * A living heartbeat trace driven by the city's current state.
 * Beats faster as the status rises, slower when conditions are calm.
 * Purely decorative — the actual status is communicated by text.
 */
export function PulseHeartbeat({ data }: { data: CityStatusResponse }) {
  const label = data.status.label.toLowerCase();
  const speed = SPEEDS[label] ?? 2400;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const colors: Record<string, string> = {
      stable: "#387359",
      watch: "#936b08",
      elevated: "#b9562c",
      high: "#bb3939",
    };
    const color = colors[label] ?? "#387359";
    const glowColor = color + "40";

    let phase = 0;
    const trail: number[] = new Array(Math.ceil(w)).fill(h / 2);

    function pulse(t: number, period: number): number {
      const p = (t % period) / period;
      if (p < 0.08) return Math.sin(p / 0.08 * Math.PI) * 0.25;
      if (p < 0.15) return -Math.sin((p - 0.08) / 0.07 * Math.PI) * 0.15;
      if (p < 0.22) return Math.sin((p - 0.15) / 0.07 * Math.PI) * 1.0;
      if (p < 0.32) return -Math.sin((p - 0.22) / 0.10 * Math.PI) * 0.55;
      if (p < 0.42) return Math.sin((p - 0.32) / 0.10 * Math.PI) * 0.3;
      if (p < 0.50) return -Math.sin((p - 0.42) / 0.08 * Math.PI) * 0.08;
      return 0;
    }

    let last = 0;
    function draw(timestamp: number) {
      if (!ctx) return;
      const dt = timestamp - last;
      last = timestamp;
      phase += dt;

      const amplitude = h * 0.38;
      const mid = h / 2;
      const y = mid - pulse(phase, speed) * amplitude;

      trail.push(y);
      if (trail.length > w) trail.shift();

      ctx.clearRect(0, 0, w, h);

      // Glow trail
      ctx.beginPath();
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 6;
      ctx.lineJoin = "round";
      for (let i = 0; i < trail.length; i++) {
        if (i === 0) ctx.moveTo(i, trail[i]);
        else ctx.lineTo(i, trail[i]);
      }
      ctx.stroke();

      // Main trace
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      for (let i = 0; i < trail.length; i++) {
        if (i === 0) ctx.moveTo(i, trail[i]);
        else ctx.lineTo(i, trail[i]);
      }
      ctx.stroke();

      // Leading dot
      const tip = trail[trail.length - 1];
      ctx.beginPath();
      ctx.arc(trail.length - 1, tip, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Outer glow ring
      ctx.beginPath();
      ctx.arc(trail.length - 1, tip, 8, 0, Math.PI * 2);
      ctx.fillStyle = glowColor;
      ctx.fill();

      animationRef.current = requestAnimationFrame(draw);
    }

    animationRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationRef.current);
  }, [label, speed]);

  return (
    <section className="pulse-heartbeat" aria-hidden="true">
      <div className="heartbeat-header">
        <div className="heartbeat-label">
          <span className="heartbeat-dot" />
          <span>CITY PULSE</span>
        </div>
        <span className="heartbeat-bpm">
          {label === "high"
            ? "RAPID"
            : label === "elevated"
              ? "ELEVATED"
              : label === "watch"
                ? "ALERT"
                : "STEADY"}
        </span>
      </div>
      <canvas ref={canvasRef} className="heartbeat-canvas" />
      <div className="heartbeat-footer">
        <span>
          <i /> Live visualization · reacts to city status
        </span>
        <span>{data.analysis.activeSources}/4 feeds active</span>
      </div>
    </section>
  );
}
