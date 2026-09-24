"use client";
import { useEffect, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import { divIcon } from "leaflet";
import { findNearestJaipurArea, JAIPUR_AREAS } from "@/lib/areas";
import { timeLabel } from "@/lib/display";
import {
  currentIncidentCount,
  incidentTitle,
  isCurrentMapEvent,
  latestAreaEvent,
} from "@/lib/mapView";
import type {
  CityEvent,
  CityStatus,
  PossibleLink,
  CitySource,
} from "@/types/city";
import "leaflet/dist/leaflet.css";

interface Props {
  events: CityEvent[];
  status: CityStatus;
  possibleLink?: PossibleLink;
  activeSource?: CitySource;
  activeArea?: string;
  mode: "live" | "replay";
  at: string;
}
function MapInteraction({
  area,
  onSelect,
}: {
  area: string;
  onSelect: (area: string) => void;
}) {
  const map = useMapEvents({
    click(event) {
      onSelect(findNearestJaipurArea(event.latlng.lat, event.latlng.lng).name);
    },
  });
  useEffect(() => {
    const point = JAIPUR_AREAS.find((candidate) => candidate.name === area);
    if (point)
      map.panInside([point.latitude, point.longitude], { padding: [85, 55] });
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [area, map]);
  return null;
}

export function CityMap({
  events,
  status,
  possibleLink,
  activeSource,
  activeArea,
  mode,
  at,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [tileError, setTileError] = useState(false);
  const area = selected ?? activeArea ?? status.area ?? "Malviya Nagar";
  const point = JAIPUR_AREAS.find((candidate) => candidate.name === area);
  const linked = possibleLink?.area === area;
  const count = currentIncidentCount(events, area, at);
  const readings = (
    ["local_report", "transport", "weather", "air_quality"] as const
  ).map((source) => ({ source, event: latestAreaEvent(events, area, source) }));
  const summary = linked
    ? possibleLink.summary
    : count
      ? `${count} aggregated simulated reports in the current 30-minute window. Each reading includes its source and observation time.`
      : `No current local report is available for ${area}. This is a coverage gap, not an all-clear.`;
  return (
    <section
      className="map-section"
      id="map"
      aria-label="Jaipur neighborhood map"
    >
      <div className="map-topline">
        <div>
          <p className="eyebrow">Explore Jaipur</p>
          <h3>One city. Five closer views.</h3>
        </div>
        <span className="map-topline-count">05 AREAS</span>
      </div>
      <div className="map-frame">
        <MapContainer
          center={[26.9, 75.8]}
          zoom={12}
          className="leaflet-map"
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            eventHandlers={{
              tileerror: () => setTileError(true),
              load: () => setTileError(false),
            }}
          />
          <MapInteraction area={area} onSelect={setSelected} />
          {point && (
            <Circle
              center={[point.latitude, point.longitude]}
              radius={1100}
              interactive={false}
              pathOptions={{
                color: linked ? "#ba5733" : "#2455cf",
                weight: 2,
                fillOpacity: 0.1,
              }}
            />
          )}
          {JAIPUR_AREAS.map((candidate) => {
            const reports = currentIncidentCount(events, candidate.name, at);
            return (
              <Marker
                key={candidate.name}
                title={candidate.name}
                alt={candidate.name}
                position={[candidate.latitude, candidate.longitude]}
                icon={divIcon({
                  className: "area-marker",
                  html: `<div class="area-pin ${candidate.name === area ? "selected" : ""} ${reports ? "has-incidents" : ""}"><span class="area-pin-dot"></span><span class="area-pin-name">${candidate.name}</span>${reports ? `<span class="area-pin-count">${reports}</span>` : ""}</div>`,
                  iconSize: [150, 42],
                  iconAnchor: [75, 21],
                })}
                eventHandlers={{ click: () => setSelected(candidate.name) }}
              />
            );
          })}
        </MapContainer>
        <div className="map-label">
          <i />
          {mode === "replay" ? "SIMULATED REPLAY" : "LATEST OBSERVATIONS"}
        </div>
        {tileError && (
          <p className="map-warning" role="status">
            Map tiles unavailable. The area buttons and readings still work.
          </p>
        )}
      </div>
      <div className="map-area-bar" aria-label="Select a neighborhood">
        {JAIPUR_AREAS.map((candidate) => (
          <button
            key={candidate.name}
            className={candidate.name === area ? "is-selected" : ""}
            aria-pressed={candidate.name === area}
            onClick={() => setSelected(candidate.name)}
          >
            <span>{candidate.name}</span>
            <small>
              {currentIncidentCount(events, candidate.name, at)} current reports
            </small>
          </button>
        ))}
      </div>
      <div className="map-details" aria-live="polite">
        <div className="map-details-heading">
          <div>
            <p className="eyebrow">Selected neighborhood / {mode}</p>
            <h3>{area}</h3>
          </div>
          <span
            className={`map-area-status ${linked ? "is-linked" : count ? "is-current" : ""}`}
          >
            {linked
              ? "Possible link"
              : count
                ? "Simulated reports"
                : "Limited coverage"}
          </span>
        </div>
        <p className="map-area-summary">{summary}</p>
        {selected && (
          <button className="map-follow" onClick={() => setSelected(null)}>
            Follow the story ↗
          </button>
        )}
        <div className="map-detail-grid">
          {readings.map(({ source, event }) => (
            <article
              key={source}
              className={`map-detail-block ${activeSource === source ? "is-highlighted" : ""}`}
            >
              <span className="map-detail-kicker">
                {source.replaceAll("_", " ")}
              </span>
              {event ? (
                <>
                  <strong>
                    {source === "weather"
                      ? "Rainfall"
                      : source === "air_quality"
                        ? "US air quality index"
                        : incidentTitle(event)}
                  </strong>
                  <p>
                    <b>{event.value}</b> {event.unit}
                  </p>
                  <small>
                    {event.simulated ? "Simulated" : "Public feed"} ·{" "}
                    {isCurrentMapEvent(event, at)
                      ? "Current"
                      : "Older · outside window"}
                    <br />
                    {timeLabel(event.observedAt)} IST
                  </small>
                </>
              ) : (
                <p>No area reading available</p>
              )}
            </article>
          ))}
        </div>
        {linked && (
          <p className="map-link">
            Possible Link · {Math.round(possibleLink.linkScore * 100)}%
            association score
            <span>Possible connection, not a confirmed cause.</span>
          </p>
        )}
      </div>
      <div className="map-footnote">
        <span>View at {timeLabel(at)} IST</span>
        <span>Transport and local reports are simulated.</span>
      </div>
    </section>
  );
}
