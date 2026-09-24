"use client";
// @refresh reset
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
import { eventLabel, timeLabel } from "@/lib/display";
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
      onSelect(
        findNearestJaipurArea(event.latlng.lat, event.latlng.lng).name,
      );
    },
  });
  useEffect(() => {
    const point = JAIPUR_AREAS.find((candidate) => candidate.name === area);
    if (!point) return;
    map.panInside([point.latitude, point.longitude], {
      paddingTopLeft: [24, 24],
      paddingBottomRight: [24, 24],
    });
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
  const report = latestAreaEvent(events, area, "local_report");
  const transport = latestAreaEvent(events, area, "transport");
  const weather = latestAreaEvent(events, area, "weather");
  const air = latestAreaEvent(events, area, "air_quality");
  const reportCurrent = report ? isCurrentMapEvent(report, at) : false;
  const transportCurrent = transport ? isCurrentMapEvent(transport, at) : false;
  const linked = possibleLink?.area === area;
  const point = JAIPUR_AREAS.find((candidate) => candidate.name === area);
  const incidentCount = currentIncidentCount(events, area, at);
  const areaSummary = linked
    ? possibleLink.summary
    : reportCurrent && report
      ? `${report.value} ${report.type} reports were observed in ${area} within the current 30-minute window.`
      : `No current local incident report is available for ${area}. Older simulated reports are shown below for context only.`;

  return (
    <section className="map-section" id="map" aria-label="Jaipur neighborhood map">
      <div className="map-topline">
        <div>
          <p className="eyebrow">Explore Jaipur</p>
          <h3>One city. Five closer views.</h3>
        </div>
        <span className="map-topline-count">05 MONITORED AREAS</span>
      </div>
      <div className="map-frame">
        <MapContainer
          center={[26.88, 75.8]}
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
                color: linked ? "#ba5733" : "#2153c6",
                weight: 2,
                fillColor: linked ? "#ba5733" : "#2153c6",
                fillOpacity: 0.12,
              }}
            />
          )}
          {JAIPUR_AREAS.map((candidate) => {
            const count = currentIncidentCount(events, candidate.name, at);
            const chosen = candidate.name === area;
            const linkedArea = possibleLink?.area === candidate.name;
            return (
              <Marker
                key={candidate.name}
                position={[candidate.latitude, candidate.longitude]}
                title={candidate.name}
                alt={candidate.name}
                icon={divIcon({
                  className: "area-marker",
                  html: `<div class="area-pin ${chosen ? "selected" : ""} ${count ? "has-incidents" : ""} ${linkedArea ? "has-link" : ""}"><span class="area-pin-dot"></span><span class="area-pin-name">${candidate.name}</span>${count ? `<span class="area-pin-count">${count}</span>` : ""}</div>`,
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
          {mode === "replay" ? "SCENARIO REPLAY" : "LATEST AVAILABLE FEEDS"}
        </div>
        <div className="map-instruction">Select a marker or tap the map</div>
        {tileError && (
          <p className="map-warning" role="status">
            Map tiles are temporarily unavailable. Use the area selector below.
          </p>
        )}
      </div>
      <div className="map-area-bar" aria-label="Select a neighborhood">
        {JAIPUR_AREAS.map((candidate) => {
          const count = currentIncidentCount(events, candidate.name, at);
          return (
            <button
              key={candidate.name}
              className={area === candidate.name ? "is-selected" : ""}
              aria-pressed={area === candidate.name}
              onClick={() => setSelected(candidate.name)}
            >
              <span>{candidate.name}</span>
              <small>{count ? `${count} current reports` : "No current reports"}</small>
            </button>
          );
        })}
      </div>
      <div className="map-details" aria-live="polite">
        <div className="map-details-heading">
          <div>
            <p className="eyebrow">Neighborhood view / {mode === "replay" ? "Replay" : "Live"}</p>
            <h3>{area}</h3>
          </div>
          <span className={`map-area-status ${linked ? "is-linked" : reportCurrent ? "is-current" : ""}`}>
            {linked ? "Possible link" : incidentCount ? "Current reports" : "No current reports"}
          </span>
        </div>
        <p className="map-area-summary">{areaSummary}</p>
        {selected && (
          <button className="map-follow" onClick={() => setSelected(null)}>
            Follow the story ↗
          </button>
        )}
        <div className="map-detail-grid">
          <div className={`map-detail-block map-detail-incidents ${activeSource === "local_report" ? "is-highlighted" : ""}`}>
            <span className="map-detail-kicker">01 / LOCAL REPORTS</span>
            {report ? (
              <>
                <strong>{incidentTitle(report)}</strong>
                <p><b>{report.value}</b> aggregated reports · {report.simulated ? "Simulated" : "Live"}</p>
                <small>{reportCurrent ? "Inside 30-minute window" : "Older record · excluded from current analysis"} · {timeLabel(report.observedAt)} IST</small>
              </>
            ) : (
              <p>No report observations for this area.</p>
            )}
          </div>
          <div className={`map-detail-block ${activeSource === "transport" ? "is-highlighted" : ""}`}>
            <span className="map-detail-kicker">02 / MOVEMENT</span>
            {transport ? (
              <>
                <strong>{incidentTitle(transport)}</strong>
                <p><b>{transport.value}</b> {transport.unit} · Simulated</p>
                <small>{transportCurrent ? "Inside 30-minute window" : "Older record · excluded from current analysis"} · {timeLabel(transport.observedAt)} IST</small>
              </>
            ) : (
              <p>No transport observation for this area.</p>
            )}
          </div>
        </div>
        <div className="map-environment">
          {[weather, air].map((event, index) => (
            <div key={event?.id ?? index}>
              <span>{index === 0 ? "WEATHER" : "AIR QUALITY"}</span>
              {event ? (
                <strong>
                  {event.value} {event.unit}
                  <small> {eventLabel(event)} · {isCurrentMapEvent(event, at) ? "Current" : "Older"} · {timeLabel(event.observedAt)} IST</small>
                </strong>
              ) : (
                <strong>No area reading<small>Feed coverage is limited here</small></strong>
              )}
            </div>
          ))}
        </div>
        {linked && (
          <p className="map-link">
            Possible Link · {Math.round(possibleLink.linkScore * 100)}% association score
            <span>These signals may be related; this does not establish a cause.</span>
          </p>
        )}
      </div>
      <div className="map-footnote">
        <span>{mode === "replay" ? "Recorded scenario" : "Latest available observations"} · {timeLabel(at)} IST</span>
        <span>Local reports and transport are simulated.</span>
      </div>
    </section>
  );
}
