# CityPulse Project Specification

## Problem

Civic information is scattered across separate feeds. Residents cannot easily understand what is happening in their area or whether multiple unusual events may be occurring together. CityPulse combines those feeds into one understandable city or neighborhood status.

## Primary User

Residents are the primary users. Secondary stakeholders are city operations staff, journalists, emergency responders, and local businesses. Do not create separate dashboards for these groups.

## Required Capabilities

1. Ingest at least three civic data types.
2. Normalize mismatched feeds into one common model.
3. Normalize timestamps.
4. Detect unusual changes or correlations.
5. Use a rolling time window.
6. Show a live, glanceable dashboard or map.
7. Generate a plain-language summary.
8. Continue functioning when one source fails.
9. Use only public or synthetic data.
10. Avoid identifying individuals.
11. Make the interface understandable quickly.
12. Present correlations as possible connections, not proven causes.

## Our Chosen Four Feeds

```text
Weather
Air Quality
Transport
Local Reports
```

## Main Demo Scenario

```text
4:45 PM  normal conditions
5:05 PM  rain becomes unusually high
5:16 PM  waterlogging reports become unusually high
5:24 PM  transport delays become unusually high
5:25 PM  CityPulse detects same area, close-in-time unusual signals
         → Possible Link
```

Expected summary:

> Heavy rainfall in Malviya Nagar is happening alongside increased waterlogging reports and transport delays. These events may be related.

Expected disclaimer:

> This is a possible connection, not a confirmed cause.

## Out of Scope

Authentication, user profiles, an admin panel, chatbot, complaint submission, mobile app, complex predictive models, an independent Python backend, paid APIs, and extra feeds are intentionally excluded.
