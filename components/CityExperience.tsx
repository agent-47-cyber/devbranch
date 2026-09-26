"use client";

import { useEffect, useRef, useState } from "react";
import { JAIPUR_AREAS } from "@/lib/areas";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CityArrival } from "@/components/CityArrival";
import { MotionConfig } from "motion/react";
import { CityStatus } from "@/components/CityStatus";
import { CurrentSituation } from "@/components/CurrentSituation";
import { DataSources } from "@/components/DataSources";
import { Header } from "@/components/Header";
import { ReplayControls } from "@/components/ReplayControls";
import { WhatsHappening } from "@/components/WhatsHappening";
import replay from "@/data/replay.json";
import replayDays from "@/data/replayDays.json";
import { CivicAlerts } from "@/components/CivicAlerts";
import { CivicTelemetryDashboard } from "@/components/CivicTelemetryDashboard";
import { ActiveIncidents } from "@/components/ActiveIncidents";

import { NarrativeTicker } from "@/components/NarrativeTicker";
import { timeLabel } from "@/lib/display";
import type { CityStatusResponse } from "@/types/city";

const labels = replay.steps.map((step) => timeLabel(step.at));

export function CityExperience() {
  const [mode, setMode] = useState<"live" | "replay">("live");
  const [step, setStep] = useState(0);
  const root = useRef<HTMLElement>(null);
  const [playing, setPlaying] = useState(false);
  const [replayDay, setReplayDay] = useState(replayDays.length - 1);
  const [framesByDay, setFramesByDay] = useState<Record<number, CityStatusResponse[]>>({});
  const frames = framesByDay[replayDay] ?? [];
  const [live, setLive] = useState<CityStatusResponse | null>(null);
  const [area, setArea] = useState("Malviya Nagar");
  const [loadedArea, setLoadedArea] = useState("Malviya Nagar");
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const data = mode === "replay" ? frames[step] : live;
  const ready = Boolean(data);

  useEffect(() => {
    if (!ready) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
        gsap.from(".intro-copy > *", {
          y: 26,
          opacity: 0,
          stagger: 0.09,
          duration: 0.8,
          ease: "power3.out",
        });
        gsap.from(".city-observatory", {
          scale: 0.94,
          opacity: 0,
          duration: 1.1,
          ease: "power3.out",
        });
        gsap.to(".city-landmark", {
          y: -24,
          ease: "none",
          scrollTrigger: {
            trigger: ".pulse-hero",
            start: "top top",
            end: "bottom top",
            scrub: 0.7,
          },
        });
        gsap.to(".reading-progress", {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        });
        gsap.utils
          .toArray<HTMLElement>(
            ".section-heading, .signal-panel",
          )
          .forEach((element) => {
            gsap.from(element, {
              y: 32,
              opacity: 0,
              duration: 0.75,
              ease: "power2.out",
              scrollTrigger: { trigger: element, start: "top 92%", once: true },
            });
          });
      },
      root,
    );
    return () => media.revert();
  }, [ready, mode]);

  useEffect(() => {
    if (!ready) return;
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(frame);
  }, [ready, step, data?.updatedAt]);

  useEffect(() => {
    const controller = new AbortController();
    async function read(url: string) {
      const response = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(25_000),
        ]),
      });
      if (!response.ok)
        throw new Error(
          "The latest update couldn't be loaded. Please try again.",
        );
      return (await response.json()) as CityStatusResponse;
    }
    async function load() {
      setRefreshing(true);
      try {
        if (mode === "replay") {
          const next = await Promise.all(
            replayDays.map(async (_, day) => {
              const dayFrames = await Promise.all(
                labels.map((_, index) =>
                  read(`/api/status?mode=replay&step=${index}&day=${day}`),
                ),
              );
              return [day, dayFrames] as const;
            }),
          );
          if (!controller.signal.aborted)
            setFramesByDay(Object.fromEntries(next));
        } else {
          const next = await read(`/api/status?mode=live&area=${encodeURIComponent(area)}`);
          if (!controller.signal.aborted) {
            setLive(next);
            setLoadedArea(area);
          }
        }
        if (!controller.signal.aborted) setError(null);
      } catch {
        if (!controller.signal.aborted)
          setError(
            "The latest update couldn't be loaded. Your last view is still available.",
          );
      } finally {
        if (!controller.signal.aborted) setRefreshing(false);
      }
    }
    if (mode === "live" || frames.length === 0 || retry > 0) void load();
    const timer =
      mode === "live"
        ? window.setInterval(() => {
            if (!document.hidden) void load();
          }, 60_000)
        : undefined;
    return () => {
      controller.abort();
      if (timer) window.clearInterval(timer);
    };
    // A mode/day/retry/area change owns one request lifecycle; the slider uses cached frames.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, retry, replayDay, area]);

  useEffect(() => {
    if (!playing || mode !== "replay") return;
    const timer = window.setTimeout(() => {
      if (step < labels.length - 1) setStep(step + 1);
      else setPlaying(false);
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [playing, step, mode]);

  function togglePlay() {
    if (!playing && step === labels.length - 1) setStep(0);
    setPlaying(!playing);
  }

  return (
    <MotionConfig reducedMotion="user">
      <main
        id="top"
        ref={root}
        className={`city-experience ${data?.status.label.toLowerCase() ?? "stable"}`}
      >
        <div className="reading-progress" aria-hidden="true" />
        <a className="skip-link" href="#overview">
          Skip to city status
        </a>
        <Header
          mode={mode}
          updatedAt={data?.updatedAt ?? ""}
          onModeChange={(next) => {
            setMode(next);
            setPlaying(false);
          }}
        />
        {!data ? (
          <CityArrival
            mode={mode}
            error={error}
            onRetry={() => setRetry((value) => value + 1)}
          />
        ) : (
          <>
            <CityStatus data={data} area={mode === "live" ? loadedArea : "Malviya Nagar"} />
            <NarrativeTicker data={data} />
            {mode === "replay" && (
              <ReplayControls
                step={step}
                totalSteps={labels.length}
                isPlaying={playing}
                labels={labels}
                day={replayDay}
                onDayChange={(next) => {
                  setPlaying(false);
                  setStep(0);
                  setReplayDay(next);
                }}
                onStepChange={(next) => {
                  setPlaying(false);
                  setStep(next);
                }}
                onPlayToggle={togglePlay}
              />
            )}
            <CivicAlerts alerts={data.alerts} mode={mode} />
            {mode === "live" && (
              <div className="area-switcher-bar">
                <span className="area-switcher-label" role="status">
                  {area !== loadedArea ? `Loading ${area} · showing ${loadedArea}` : "Viewing area"}
                </span>
                <div className="area-switcher-pills" role="group" aria-label="Select neighbourhood">
                  {JAIPUR_AREAS.map((a) => (
                    <button
                      key={a.name}
                      className={`area-pill${area === a.name ? " active" : ""}`}
                      onClick={() => setArea(a.name)}
                      aria-pressed={area === a.name}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <CurrentSituation
              current={data.current}
              mode={mode}
              at={data.updatedAt}
              area={mode === "live" ? loadedArea : "Malviya Nagar"}
            />
            <WhatsHappening data={data} area={mode === "live" ? loadedArea : undefined} />
            <ActiveIncidents data={data} />
            <CivicTelemetryDashboard data={data} area={mode === "live" ? loadedArea : undefined} />

            <DataSources
              sources={data.sources}
              mode={mode}
              at={data.updatedAt}
            />
            <footer className="site-footer">
              <a className="brand" href="#top">
                CityPulse
              </a>
            </footer>
          </>
        )}
        {refreshing && data && (
          <span className="refresh-note" role="status">
            Updating the view…
          </span>
        )}
        {error && data && (
          <aside className="refresh-error" role="status">
            {error}
            <button onClick={() => setRetry((n) => n + 1)}>Retry</button>
          </aside>
        )}
      </main>
    </MotionConfig>
  );
}
