# CityPulse — problem statement audit

Reviewed 26 September 2026 against the supplied AmiHacks Problem Statement 2 and the current implementation.

## Verdict

The required hackathon MVP is implemented. This is a civic-data prototype, not a verified municipal incident service. Two feeds are public model estimates and two are explicitly simulated. The statement permits both public and synthetic data.

| Requirement | Implementation and evidence |
| --- | --- |
| Three or more distinct feeds | Four: Open-Meteo weather, CAMS air quality through Open-Meteo, JSON transport delays, JSON aggregate local reports. |
| Common schema and timestamps | Every adapter emits a validated `CityEvent`; observation and retrieval times remain separate. See `lib/normalize.ts`, `types/city.ts` and the four adapters. |
| Basic unusual-change detection | `lib/unusual.ts` compares like-for-like source, type, area and unit against recent history. |
| Time and location correlation | `lib/timeCheck.ts`, `lib/locationCheck.ts` and `lib/findLinks.ts` use a rolling 30-minute window and a bounded internal association score. Links are not causal claims. |
| Glanceable dashboard and map | Four source cards, a plain-language brief, named Jaipur map areas, current readings, timestamps and source labels. Mobile layout, keyboard controls and reduced-motion support are included. |
| Explain current conditions and relevance | Grounded template summary, optional Groq-assisted selection of verified facts, plus a short resident-context line. Unvalidated model prose is rejected. |
| Missing or delayed feeds | Independent source failures do not stop the dashboard. Missing area readings stay missing rather than borrowing another area's values. Older readings are visibly labelled and excluded from current-window analysis. |
| Privacy | Aggregated synthetic reports only; no resident identities, contact details or individual tracking. Server API credentials are kept out of client code. |
| Optional threshold alerts | On-page threshold flags are implemented. These are prototype flags, not official emergency notifications. |
| Optional historical replay | Three simulated days with six frames each. The same analysis functions process replay, without storing replay as live data. |

## UI and correctness changes in this audit

- Put current source cards and the map before detailed history; reduced ten repeated charts to the selected area's two trends.
- Improved responsive spacing, type scale, readable source labels, cards and map framing; simplified the footer.
- Kept the previous view while a neighbourhood update loads, with explicit loading/area labels.
- Removed cross-neighbourhood fallback from current readings and added a regression test.
- Corrected air-quality story titles and descriptions; only link-member observations get a linked-change label.
- Replaced invented incident references and duplicate frontend severity rules with actual readings and visible provenance.
- Labelled simulated ticker updates and explained that live-mode JSON scenario timestamps are shifted to the present.
- Corrected growth-from-zero chart text to show an absolute change, not an invalid percentage.

## Limits that must remain explicit in a presentation

- “Live” means recently retrieved public model data, not a street-level sensor or guaranteed new reading every minute. US AQI is a scale, not the reading's geographic location, and is not India's AQI scale.
- Transport and reports reuse synthetic JSON. In live mode their timeline is shifted forward for demonstration; values are not real current complaints or transport telemetry.
- The citywide index can include simulated observations and is an internal prototype score. It is withheld if current evidence and comparison history are insufficient.
- The five map locations are monitored neighbourhood points, not verified incident coordinates or citywide coverage.
- Refresh is browser-driven polling while the page is visible; this is not an autonomous, always-on background monitoring service.
- True trained ML, agentic monitoring and outbound SMS/email/push are not implemented. They are optional extensions in the problem statement, not missing MVP requirements.
- Provider downtime, rate limits and stale observations remain possible; graceful degradation is part of the design.

## Verification

Automated coverage includes normalization, invalid values, window boundaries, source failure, area isolation, link time/location restrictions, threshold expiry, Groq output grounding and all 18 replay frames. Run `npm test`, `npm run lint`, `npm run build` and `npm run test:integration`.

On this Windows machine, application-control policy blocks the native Next.js compiler. `npm run dev` uses the supported Webpack/WASM fallback; local production validation can use `npm run build -- --webpack`. This does not disable the machine's security policy.

### Results from this audit

- 21 automated tests passed; lint and TypeScript checks passed.
- Local Webpack production build passed.
- Weather, air quality, transport, reports, live status and replay endpoints returned HTTP 200; weather/air quality were public feeds and transport/reports were simulated.
- Supabase event write/read, possible-link write and four stored source statuses passed. The integration test removed only its two temporary audit records.
- Browser verified neighbourhood switching, independent map selection and keyboard replay scrubbing from the initial to final frame.
- Responsive checks at 320px, 390px, 768px and desktop found no page-width overflow. Mobile source cards and map details remained readable. This is a targeted usability check, not a formal accessibility certification or load test.
