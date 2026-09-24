"use client";
// @refresh reset
import { useEffect, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import { divIcon } from "leaflet";
import { useReducedMotion } from "motion/react";
import { JAIPUR_AREAS } from "@/lib/areas";
import { eventLabel, timeLabel } from "@/lib/display";
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
}
function Focus({ area }: { area: string }) {
  const map = useMap();
  const reduced = useReducedMotion();
  useEffect(() => {
    const point = JAIPUR_AREAS.find((a) => a.name === area);
    if (point)
      map.flyTo([point.latitude, point.longitude], 12, {
        duration: reduced ? 0 : 0.7,
        animate: !reduced,
      });
  }, [area, map, reduced]);
  return null;
}
export function CityMap({
  events,
  status,
  possibleLink,
  activeSource,
  activeArea,
  mode,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [tileError, setTileError] = useState(false);
  const area = selected ?? activeArea ?? status.area ?? "Malviya Nagar";
  const readings = events.filter((e) => e.area === area);
  const linked = possibleLink?.area === area;
  const point = JAIPUR_AREAS.find(
    (a) => a.name === (activeArea ?? status.area),
  );
  return (
    <section className="map-section" id="map" aria-label="Jaipur area map">
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
          <Focus area={area} />
          {point && (
            <Circle
              center={[point.latitude, point.longitude]}
              radius={900}
              interactive={false}
              pathOptions={{
                color: possibleLink ? "#cc5c2d" : "#2854ce",
                weight: 1,
                fillOpacity: 0.08,
              }}
            />
          )}
          {JAIPUR_AREAS.map((a) => {
            const present = events.filter((e) => e.area === a.name);
            const sources = [...new Set(present.map((e) => e.source))];
            const chosen = a.name === area;
            return (
              <Marker
                key={a.name}
                position={[a.latitude, a.longitude]}
                title={a.name}
                alt={a.name}
                icon={divIcon({
                  className: "area-marker",
                  html: `<div class="area-pin ${chosen ? "selected" : ""} ${present.length ? "" : "no-data"}">${sources.map((source) => `<i class="dot-${source} ${!activeSource || source === activeSource ? "emphasized" : ""}"></i>`).join("") || "<i></i>"}</div>`,
                  iconSize: [42, 42],
                  iconAnchor: [21, 21],
                })}
                eventHandlers={{ click: () => setSelected(a.name) }}
              >
                <Tooltip direction="top" offset={[0, -18]}>
                  {a.name}
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>
        <div className="map-label">
          <i />
          {mode === "replay" ? "Replay observations" : "Latest observations"}
        </div>
        {tileError && (
          <p className="map-warning" role="status">
            Map tiles are temporarily unavailable. Area selection and readings
            still work.
          </p>
        )}
      </div>
      <div className="map-details">
        <div className="map-details-heading">
          <div>
            <p className="eyebrow">Selected area</p>
            <h3>{area}</h3>
          </div>
          {selected && (
            <button
              onClick={() => setSelected(null)}
              aria-label="Follow the story on the map"
            >
              Follow story ↗
            </button>
          )}
        </div>
        <div className="map-readings">
          {readings.length ? (
            readings.map((e) => (
              <div
                className={activeSource === e.source ? "highlighted" : ""}
                key={e.id}
              >
                <span>{eventLabel(e)}</span>
                <strong>
                  {e.value} <small>{e.unit}</small>
                </strong>
                <small>
                  {e.simulated ? "Simulated" : "Live"} ·{" "}
                  {timeLabel(e.observedAt)} IST
                </small>
              </div>
            ))
          ) : (
            <p>No current readings for this area.</p>
          )}
        </div>
        {linked && (
          <p className="map-link">
            Possible Link · {Math.round(possibleLink.linkScore * 100)}%{" "}
            <span>Association, not proof of cause</span>
          </p>
        )}
      </div>
      <div className="area-options" aria-label="Select a neighborhood">
        {JAIPUR_AREAS.map((a) => (
          <button
            key={a.name}
            aria-pressed={area === a.name}
            onClick={() => setSelected(a.name)}
          >
            {a.name}
          </button>
        ))}
      </div>
      <div className="map-legend">
        <span>
          <i className="dot-weather" />
          Weather
        </span>
        <span>
          <i className="dot-air_quality" />
          Air quality
        </span>
        <span>
          <i className="dot-transport" />
          Transport
        </span>
        <span>
          <i className="dot-local_report" />
          Reports
        </span>
      </div>
    </section>
  );
}
