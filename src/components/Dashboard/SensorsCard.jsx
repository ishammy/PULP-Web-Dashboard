import React from 'react';
import { usePulp } from '../../context/PulpContext';

export default function SensorsCard() {
  const { telemetry } = usePulp();

  const waterLevel = typeof telemetry.water_level === 'number' ? telemetry.water_level : 0;
  const temp = typeof telemetry.temperature === 'number' ? telemetry.temperature : 25;
  const weight = typeof telemetry.weight === 'number' ? telemetry.weight : 0;

  // Max thresholds for progress bars
  const waterPercent = Math.min(100, Math.max(0, waterLevel));
  const tempPercent = Math.min(100, Math.max(0, (temp / 140) * 100)); // up to 140°C
  const weightPercent = Math.min(100, Math.max(0, (weight / 50) * 100)); // up to 50g

  return (
    <section className="panel-card" aria-label="Live Sensor Telemetry">
      <div className="panel-title">
        <span>Live Sensor Telemetry</span>
      </div>

      <div className="sensors-group">
        {/* Water Level */}
        <div className="sensor-row">
          <div className="sensor-header">
            <div className="sensor-title">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
              </svg>
              <span>Water Level</span>
            </div>
            <span className="sensor-badge" id="sensor-val-water">{waterLevel}%</span>
          </div>
          <div className="sensor-track">
            <div className="sensor-bar water" style={{ width: `${waterPercent}%` }}></div>
          </div>
        </div>

        {/* Temperature */}
        <div className="sensor-row">
          <div className="sensor-header">
            <div className="sensor-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
              </svg>
              <span>Chamber Temp</span>
            </div>
            <span className="sensor-badge" id="sensor-val-temp">{temp}°C</span>
          </div>
          <div className="sensor-track">
            <div className="sensor-bar temp" style={{ width: `${tempPercent}%` }}></div>
          </div>
        </div>

        {/* Weight */}
        <div className="sensor-row">
          <div className="sensor-header">
            <div className="sensor-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
              <span>Paper Weight</span>
            </div>
            <span className="sensor-badge" id="sensor-val-weight">{weight}g</span>
          </div>
          <div className="sensor-track">
            <div className="sensor-bar weight" style={{ width: `${weightPercent}%` }}></div>
          </div>
        </div>
      </div>
    </section>
  );
}
