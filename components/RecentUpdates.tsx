"use client";
import { useRef } from "react";
import { motion, useScroll, useReducedMotion } from "motion/react";
import type { RecentUpdate } from "@/types/city";
import { timeLabel } from "@/lib/display";
export function RecentUpdates({
  updates,
  limited = false,
}: {
  updates: RecentUpdate[];
  limited?: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: root,
    offset: ["start 80%", "end 60%"],
  });
  const reduced = useReducedMotion();
  return (
    <section
      ref={root}
      className="updates section-shell"
      id="updates"
      aria-labelledby="updates-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">03 / Recent updates</p>
          <h2 id="updates-title">
            A little context.
            <br />A clearer picture.
          </h2>
        </div>
        <p>
          Within the analysis window
          <br />
          All times in Jaipur · IST
        </p>
      </div>
      {updates.length ? (
        <div className="timeline-wrap">
          <motion.div
            className="timeline-progress"
            style={{ scaleY: reduced ? 1 : scrollYProgress }}
          />
          <ol className="editorial-timeline">
            {updates.map((update) => (
              <li
                key={update.id}
                className={
                  update.source === "possible_link" ? "link-update" : ""
                }
              >
                <time dateTime={update.at}>{timeLabel(update.at)}</time>
                <div>
                  <h3>{update.title}</h3>
                  <p>{update.detail}</p>
                </div>
                <span className="timeline-dot" aria-hidden="true" />
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="timeline-empty">
          <span>{limited ? "○" : "✓"}</span>
          <div>
            <h3>
              {limited
                ? "Waiting for enough comparable observations."
                : "No unusual changes detected in the current window."}
            </h3>
            <p>
              {limited
                ? "The available evidence is limited. No update does not mean the city is free of problems."
                : "New updates will appear here as the available signals change."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
