# CityPulse Test Checklist

## Data

```text
[ ] Weather response works
[ ] Air Quality response works
[ ] Transport JSON works
[ ] Local Reports JSON works
[ ] All four normalize into CityEvent
[ ] timestamps are ISO 8601
[ ] observedAt preserved
[ ] receivedAt generated correctly
```

## Storage

```text
[ ] Supabase connection works
[ ] events can be inserted
[ ] events can be queried
[ ] possible links can be stored
[ ] source status can be stored
```

## Analysis

```text
[ ] 30-minute rolling window works
[ ] normal values are not incorrectly flagged
[ ] obvious spikes are flagged
[ ] timeScore stays between 0 and 1
[ ] locationScore stays between 0 and 1
[ ] linkScore stays between 0 and 1
[ ] unrelated areas do not create strong links
[ ] events outside the window do not create links
```

## Demo Scenario

```text
[ ] heavy rain becomes unusual
[ ] waterlogging becomes unusual
[ ] transport delay becomes unusual
[ ] events occur in Malviya Nagar
[ ] events occur within approximately 30 minutes
[ ] Possible Link appears
[ ] summary uses cautious language
[ ] Why It Matters appears
```

## Failure Handling

```text
[ ] Weather failure does not crash page
[ ] AQI failure does not crash page
[ ] unavailable source is shown correctly
[ ] remaining sources continue working
```

## Privacy

```text
[ ] no names in reports
[ ] no phone numbers
[ ] no emails
[ ] no usernames
[ ] no individual tracking
```

## UI

```text
[ ] City Status visible immediately
[ ] summary understandable quickly
[ ] four Current Situation cards visible
[ ] map loads
[ ] map attribution visible
[ ] What's Happening works
[ ] Recent Updates works
[ ] Why It Matters works
[ ] Why These May Be Linked works
[ ] Data Sources show Live/Simulated/Unavailable
```

## Replay

```text
[ ] Live/Replay switch works
[ ] Play works
[ ] Pause works
[ ] slider works
[ ] replay data uses same analysis functions
[ ] replay is not merely fake UI animation
```

## Safety of Claims

Search UI and code for language suggesting causation. Use `Possible Link`, `may be related`, `happening alongside`, or `possible connection`; do not use `caused`, `proved`, `definitely caused`, or `confirmed cause` except in a disclaimer stating causation is not established.

## Build

```text
[ ] npm run build succeeds
[ ] no TypeScript errors
[ ] no exposed secret keys
[ ] no hard-coded Supabase service-role key
[ ] environment variables documented
```
