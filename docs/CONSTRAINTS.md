# CityPulse Non-Negotiable Constraints

## Scope

This is a 24-hour hackathon project. Prioritize working end-to-end functionality.

## No Scope Creep

Do not add authentication, user profiles, an admin panel, chatbot, payments, mobile app, blockchain, a separate Python backend, microservices, social media, complaint submission, extra APIs, extra dashboards, complex ML, AI agents, email notifications, SMS, or push notifications without explicit approval.

## Data and Privacy

Use public or synthetic data only. Clearly label synthetic data. Never use personally identifying civic complaint data.

## Resilience and Honesty

One missing or delayed feed must not crash CityPulse. Never convert association into causation. Summaries may use only facts produced from ingested data and must not invent explanations.

## Time and Link Logic

Use a rolling 30-minute analysis window unless explicitly changed.

```text
linkScore = 0.40 × timeScore + 0.30 × locationScore + 0.30 × unusualScore
linkScore >= 0.70 for initial display
```

This is a prototype association score, not a probability.

## Unusual Detection

Preferred rule: `zScore >= 2`.

Fallback with insufficient history: `current >= average × 1.5`.

These prototype rules are not official emergency thresholds.

## No LLM Dependency

The project must work completely without Grok, Gemini, OpenAI, or another LLM. Template-based summaries are sufficient. An LLM may only be considered later as an optional wording enhancement after explicit approval.
