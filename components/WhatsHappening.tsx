"use client";
// @refresh reset
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { CityStatusResponse, CitySource } from "@/types/city";
import { timeLabel } from "@/lib/display";
import { SignalIcon } from "@/components/SignalIcon";
const CityMap = dynamic(
  () => import("@/components/CityMap").then((m) => m.CityMap),
  {
    ssr: false,
    loading: () => <div className="map-loading">Opening Jaipur’s map…</div>,
  },
);
export function WhatsHappening({ data }: { data: CityStatusResponse }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const link = data.possibleLinks[0];
  const linked = link
    ? link.eventIds
        .map((id) => data.mapEvents.find((event) => event.id === id))
        .filter((event) => !!event)
        .sort(
          (a, b) =>
            ["weather", "local_report", "transport"].indexOf(a.source) -
            ["weather", "local_report", "transport"].indexOf(b.source),
        )
    : [];
  const storyEvents = linked.length
    ? linked
    : [
        data.current.weather,
        data.current.reports,
        data.current.transport,
      ].filter((event) => !!event);
  const activeEvent = storyEvents[active];
  const activeSource: CitySource | undefined = activeEvent?.source;
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-scene]").forEach((scene) => {
        ScrollTrigger.create({
          trigger: scene,
          start: "top 60%",
          end: "bottom 40%",
          onEnter: () => setActive(Number(scene.dataset.scene)),
          onEnterBack: () => setActive(Number(scene.dataset.scene)),
        });
      });
    }, root);
    return () => context.revert();
  }, [data]);
  return (
    <section
      className="story-section section-shell"
      id="story"
      aria-labelledby="story-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">02 / What’s happening</p>
          <h2 id="story-title">
            {link ? (
              <>
                Different signals.
                <br />
                <span>One possible connection.</span>
              </>
            ) : (
              <>
                A closer look.
                <br />
                <span>Across the neighborhood.</span>
              </>
            )}
          </h2>
        </div>
        <p>
          {link ? link.area : "Jaipur"}
          <br />
          The latest available observations
        </p>
      </div>
      <div className="story-layout" ref={root}>
        <div className="story-map">
          <CityMap
            events={data.mapEvents}
            status={data.status}
            possibleLink={link}
            activeSource={activeSource}
            activeArea={activeEvent?.area}
            mode={data.mode}
            at={data.updatedAt}
          />
          <div className="story-map-caption">
            <span>
              {data.mode === "replay" ? "Replay map" : "Live map"} / Jaipur
            </span>
            <span>Explore an area ↗</span>
          </div>
        </div>
        <div className="story-scenes">
          {storyEvents.map((event, index) => (
            <article
              key={event.id}
              data-scene={index}
              className={`story-scene ${active === index ? "is-active" : ""}`}
            >
              <div className="scene-meta">
                <span>0{index + 1}</span>
                <time dateTime={event.observedAt}>
                  {timeLabel(event.observedAt)} IST
                </time>
                <SignalIcon source={event.source} />
              </div>
              <h3>
                {event.source === "weather"
                  ? "Rain, in the picture."
                  : event.source === "local_report"
                    ? "Reports from the area."
                    : "Movement through the city."}
              </h3>
              <p className="scene-reading">
                {event.value}
                <span>{event.unit}</span>
              </p>
              <p className="scene-description">
                {event.type === "waterlogging"
                  ? "Waterlogging reports"
                  : event.source === "transport"
                    ? "Average transport delay"
                    : "Modelled rainfall"}{" "}
                in {event.area}.
              </p>
              <span className="scene-tag">
                {link
                  ? "Higher than the recent baseline"
                  : data.mode === "replay"
                    ? "Simulated scenario reading"
                    : Date.parse(data.updatedAt) -
                          Date.parse(event.observedAt) >
                        30 * 60_000
                      ? "Older reading · excluded from analysis"
                      : "Inside the 30-minute window"}
              </span>
              <p className="scene-provenance">
                {event.simulated ? "Simulated" : "Live"} ·{" "}
                {data.mode === "replay"
                  ? "Recorded scenario"
                  : "Observation time shown above"}
              </p>
            </article>
          ))}
          {storyEvents.length === 0 && (
            <article className="story-scene">
              <h3>Waiting for a clearer picture.</h3>
              <p>
                Feeds are temporarily unavailable. The map remains available to
                explore.
              </p>
            </article>
          )}
          {link && (
            <article
              data-scene={storyEvents.length}
              className={`story-scene story-resolution ${active === storyEvents.length ? "is-active" : ""}`}
            >
              <p className="eyebrow">Together, in time and place</p>
              <h3>These events may be related.</h3>
              <p>
                Unusual rain, reports and transport delays share the same area
                and a short time window.
              </p>
              <span className="resolution-score">
                {Math.round(link.linkScore * 100)}
                <small>% Possible Link</small>
              </span>
              <small>Association does not establish cause.</small>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
