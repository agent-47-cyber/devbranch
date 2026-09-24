"use client";
import { motion } from "motion/react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import type { PossibleLink, CityStatusResponse } from "@/types/city";
export function WhyLinked({
  link,
  analysis,
}: {
  link?: PossibleLink;
  analysis: CityStatusResponse["analysis"];
}) {
  if (!link)
    return (
      <section className="connection-lab" aria-labelledby="connection-title">
        <div className="connection-intro">
          <p className="eyebrow">05 / How a possible link earns its place</p>
          <h2 id="connection-title">
            Not just more data.
            <br />
            <em>A little more understanding.</em>
          </h2>
          <p>
            We connect events only when the evidence lines up. No connection is
            invented to fill this space.
          </p>
        </div>
        <div className="connection-steps">
          <article>
            <span>01</span>
            <h3>First, the change.</h3>
            <p>Compare like-for-like readings with their recent baseline.</p>
            <strong>
              {analysis.baselineSources}
              <small> / 4 feeds with comparison history</small>
            </strong>
          </article>
          <article>
            <span>02</span>
            <h3>Then, time & place.</h3>
            <p>Look for unusual signals in the same area, within 30 minutes.</p>
            <strong>
              {analysis.activeSources}
              <small> / 4 feeds in the current window</small>
            </strong>
          </article>
          <article>
            <span>03</span>
            <h3>Only then, a link.</h3>
            <p>
              Rain, waterlogging and delays must align above the association
              threshold.
            </p>
            <strong>
              None<small> meeting the rule right now</small>
            </strong>
          </article>
        </div>
        <p className="connection-footnote">
          Our prototype rule: 40% time + 30% location + 30% unusual change.
          Minimum score: 0.70. A possible link is never proof of cause.
        </p>
      </section>
    );
  const minutes = Math.round(
    (Date.parse(link.endTime) - Date.parse(link.startTime)) / 60_000,
  );
  return (
    <section className="link-climax" aria-labelledby="link-title">
      <div className="link-inner">
        <p className="eyebrow">05 / Why these may be linked</p>
        <div className="link-signals">
          {link.signals.map((signal, index) => (
            <span key={signal}>
              {index > 0 && <i aria-hidden="true">↔</i>}
              {signal}
            </span>
          ))}
        </div>
        <div className="link-layout">
          <div>
            <h2 id="link-title">
              A possible
              <br />
              connection.
            </h2>
            <p>
              Three changes. A shared location.
              <br />A reason to pay attention, together.
            </p>
          </div>
          <motion.div
            className="link-number"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <AnimatedNumber value={Math.round(link.linkScore * 100)} />
            <span>%</span>
            <small>Possible Link</small>
          </motion.div>
        </div>
        <div className="link-facts">
          <div>
            <small>Same area</small>
            <strong>{link.area}</strong>
          </div>
          <div>
            <small>Close in time</small>
            <strong>{minutes} minutes</strong>
          </div>
          <div>
            <small>Higher than normal</small>
            <strong>All three signals</strong>
          </div>
        </div>
        <p className="link-disclaimer">
          This is a possible connection, not a confirmed cause. The score
          describes how closely signals align; it is not a probability of
          causation.
        </p>
      </div>
    </section>
  );
}
