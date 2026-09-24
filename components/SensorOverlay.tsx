"use client";
import sensors from "@/data/sensors.json";

interface Sensor {
  id: string;
  type: string;
  label: string;
  area: string;
  latitude: number;
  longitude: number;
  value: number;
  unit: string;
  normalRange: [number, number];
  status: string;
}

const ICONS: Record<string, string> = {
  water_level: "💧",
  traffic_camera: "🚦",
  air_monitor: "🌿",
};

const TYPE_LABELS: Record<string, string> = {
  water_level: "Water Level",
  traffic_camera: "Traffic Flow",
  air_monitor: "Air Monitor",
};

function isElevated(sensor: Sensor): boolean {
  return sensor.value > sensor.normalRange[1];
}

export function SensorOverlay() {
  const data = sensors as Sensor[];
  const types = [...new Set(data.map((s) => s.type))];
  const elevated = data.filter(isElevated);

  return (
    <section
      className="sensor-overlay section-shell"
      aria-labelledby="sensor-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">Simulated IoT layer</p>
          <h2 id="sensor-title">
            Sensors across
            <br />
            <span>the city.</span>
          </h2>
        </div>
        <p>
          Simulated sensor readings layered onto the civic map.
          <br />
          These are not real device feeds.
        </p>
      </div>

      {/* Sensor type summary */}
      <div className="sensor-types">
        {types.map((type) => {
          const typeSensors = data.filter((s) => s.type === type);
          const elevatedCount = typeSensors.filter(isElevated).length;
          return (
            <div key={type} className="sensor-type-card">
              <div className="sensor-type-header">
                <span className="sensor-type-icon">{ICONS[type] ?? "📡"}</span>
                <div>
                  <strong>{TYPE_LABELS[type] ?? type}</strong>
                  <span>
                    {typeSensors.length} sensor
                    {typeSensors.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div className="sensor-type-grid">
                {typeSensors.map((sensor) => {
                  const pct =
                    ((sensor.value - sensor.normalRange[0]) /
                      (sensor.normalRange[1] - sensor.normalRange[0])) *
                    100;
                  const over = isElevated(sensor);
                  return (
                    <div
                      key={sensor.id}
                      className={`sensor-reading ${over ? "is-elevated" : ""}`}
                    >
                      <div className="sensor-reading-header">
                        <span>{sensor.area}</span>
                        <span className={`sensor-status ${over ? "elevated" : "normal"}`}>
                          {over ? "▲ Elevated" : "Normal"}
                        </span>
                      </div>
                      <div className="sensor-value-row">
                        <strong>
                          {sensor.value}
                          <small> {sensor.unit}</small>
                        </strong>
                      </div>
                      <div className="sensor-bar-track">
                        <div
                          className={`sensor-bar-fill ${over ? "over" : ""}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                        {over && (
                          <div
                            className="sensor-bar-overflow"
                            style={{
                              width: `${Math.min(((sensor.value - sensor.normalRange[1]) / sensor.normalRange[1]) * 100, 40)}%`,
                            }}
                          />
                        )}
                        <div className="sensor-bar-threshold" />
                      </div>
                      <div className="sensor-range">
                        <span>{sensor.normalRange[0]}</span>
                        <span>
                          threshold: {sensor.normalRange[1]} {sensor.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {elevatedCount > 0 && (
                <p className="sensor-type-alert">
                  {elevatedCount} sensor{elevatedCount > 1 ? "s" : ""} above
                  normal range
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="sensor-footer">
        <div className="sensor-footer-stat">
          <strong>{data.length}</strong>
          <span>Total sensors</span>
        </div>
        <div className="sensor-footer-stat">
          <strong>{elevated.length}</strong>
          <span>Above normal</span>
        </div>
        <div className="sensor-footer-stat">
          <strong>{types.length}</strong>
          <span>Sensor types</span>
        </div>
        <p className="sensor-disclaimer">
          All sensor readings are simulated for demonstration. These do not
          represent actual IoT devices or real-time measurements.
        </p>
      </div>
    </section>
  );
}
