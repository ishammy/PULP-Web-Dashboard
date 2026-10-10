import React from 'react';
import { usePulp } from '../../context/PulpContext';

function Sparkline({ data, color, minVal, maxVal, height = 36 }) {
  if (!data || data.length < 2) return null;
  const width = 160;
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const range = (maxVal - minVal) || 1;
    const norm = Math.max(0, Math.min(1, (val - minVal) / range));
    const y = height - norm * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;
  const gradId = `spark-grad-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height: `${height}px`, overflow: 'visible' }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SensorsCard() {
  const {
    telemetry,
    sensorHistory = [],
    telemetryPacketCount = 0
  } = usePulp();

  const waterLevel = typeof telemetry.water_level === 'number' ? telemetry.water_level : 78;
  const temp = typeof telemetry.temperature === 'number' ? telemetry.temperature : 32.0;
  const weight = typeof telemetry.weight === 'number' ? telemetry.weight : 14;

  const waterHistory = sensorHistory.map(h => h.water);
  const tempHistory = sensorHistory.map(h => h.temp);
  const weightHistory = sensorHistory.map(h => h.weight);

  // Status Health Evaluators:
  // Good: Sage Green (#528254)
  // Moderate: Amber (#D17D2C)
  // Bad: Red (#D96052)
  const waterHealth = (() => {
    if (waterLevel >= 50) {
      return {
        label: 'Good Fluid Level',
        color: '#528254',
        bgLight: 'var(--brand-sage-light)',
        borderColor: 'rgba(82, 130, 84, 0.25)'
      };
    }
    if (waterLevel >= 25) {
      return {
        label: 'Low Fluid Level',
        color: '#D17D2C',
        bgLight: 'var(--brand-amber-light)',
        borderColor: 'rgba(209, 125, 44, 0.25)'
      };
    }
    return {
      label: 'Critically Low',
      color: '#D96052',
      bgLight: 'var(--brand-coral-light)',
      borderColor: 'rgba(217, 96, 82, 0.3)'
    };
  })();

  const tempHealth = (() => {
    if (temp <= 38) {
      return {
        label: 'Optimal Temperature',
        color: '#528254',
        bgLight: 'var(--brand-sage-light)',
        borderColor: 'rgba(82, 130, 84, 0.25)'
      };
    }
    if (temp <= 48) {
      return {
        label: 'Elevated Temperature',
        color: '#D17D2C',
        bgLight: 'var(--brand-amber-light)',
        borderColor: 'rgba(209, 125, 44, 0.25)'
      };
    }
    return {
      label: 'Overheating Alert',
      color: '#D96052',
      bgLight: 'var(--brand-coral-light)',
      borderColor: 'rgba(217, 96, 82, 0.3)'
    };
  })();

  const weightHealth = (() => {
    if (weight <= 35) {
      return {
        label: weight > 0 ? 'Normal Sheet Load' : 'Tray Ready',
        color: '#528254',
        bgLight: 'var(--brand-sage-light)',
        borderColor: 'rgba(82, 130, 84, 0.25)'
      };
    }
    if (weight <= 60) {
      return {
        label: 'Heavy Load Detected',
        color: '#D17D2C',
        bgLight: 'var(--brand-amber-light)',
        borderColor: 'rgba(209, 125, 44, 0.25)'
      };
    }
    return {
      label: 'Overload Warning',
      color: '#D96052',
      bgLight: 'var(--brand-coral-light)',
      borderColor: 'rgba(217, 96, 82, 0.3)'
    };
  })();

  return (
    <section className="panel-card telemetry-hub-card" aria-label="Machine Telemetry Hub">
      {/* Header with live WebSocket beacon */}
      <div className="telemetry-hub-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="telemetry-hub-icon-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </div>
          <div>
            <h2 className="telemetry-hub-title">Live Machine Telemetry</h2>
          </div>
        </div>


      </div>

      {/* 3 Rich Sensor Cards Grid with Dynamic Health Colors */}
      <div className="telemetry-sensors-grid">
        {/* Sensor 1: Water Reservoir */}
        <div
          className="telemetry-sensor-card"
          style={{ borderColor: waterHealth.borderColor }}
        >
          <div className="sensor-card-top">
            <div className="sensor-card-identity">
              <div
                className="sensor-card-icon"
                style={{ background: waterHealth.bgLight, color: waterHealth.color }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                </svg>
              </div>
              <div>
                <div className="sensor-card-label">Water Reservoir</div>

              </div>
            </div>

            <span
              className="sensor-state-badge"
              style={{
                background: waterHealth.bgLight,
                color: waterHealth.color,
                border: `1px solid ${waterHealth.borderColor}`
              }}
            >
              {waterLevel}%
            </span>
          </div>

          <div className="sensor-card-metric-row">
            <div className="sensor-big-value">
              <span>{waterLevel}</span>
              <span className="sensor-unit">%</span>
            </div>

          </div>

          {/* Dynamic Sparkline */}
          <div className="sensor-sparkline-box">
            <Sparkline
              data={waterHistory}
              color={waterHealth.color}
              minVal={0}
              maxVal={100}
            />
          </div>

          <div className="sensor-card-track-container">
            <div className="sensor-card-track">
              <div
                className="sensor-card-fill"
                style={{
                  width: `${Math.min(100, Math.max(0, waterLevel))}%`,
                  background: waterHealth.color
                }}
              ></div>
            </div>
            <div className="sensor-track-scale">
              <span>0% Empty</span>
              <span>100% Full</span>
            </div>
          </div>
        </div>

        {/* Sensor 2: Chamber Temperature */}
        <div
          className="telemetry-sensor-card"
          style={{ borderColor: tempHealth.borderColor }}
        >
          <div className="sensor-card-top">
            <div className="sensor-card-identity">
              <div
                className="sensor-card-icon"
                style={{ background: tempHealth.bgLight, color: tempHealth.color }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
                </svg>
              </div>
              <div>
                <div className="sensor-card-label">Chamber Temperature</div>

              </div>
            </div>

            <span
              className="sensor-state-badge"
              style={{
                background: tempHealth.bgLight,
                color: tempHealth.color,
                border: `1px solid ${tempHealth.borderColor}`
              }}
            >
              {temp}&deg;C
            </span>
          </div>

          <div className="sensor-card-metric-row">
            <div className="sensor-big-value">
              <span>{temp}</span>
              <span className="sensor-unit">&deg;C</span>
            </div>

          </div>

          {/* Dynamic Sparkline */}
          <div className="sensor-sparkline-box">
            <Sparkline
              data={tempHistory}
              color={tempHealth.color}
              minVal={20}
              maxVal={50}
            />
          </div>

          <div className="sensor-card-track-container">
            <div className="sensor-card-track">
              <div
                className="sensor-card-fill"
                style={{
                  width: `${Math.min(100, Math.max(0, (temp / 60) * 100))}%`,
                  background: tempHealth.color
                }}
              ></div>
            </div>
            <div className="sensor-track-scale">
              <span>20&deg;C Ambient</span>
              <span>60&deg;C Max</span>
            </div>
          </div>
        </div>

        {/* Sensor 3: Paper Load Tray */}
        <div
          className="telemetry-sensor-card"
          style={{ borderColor: weightHealth.borderColor }}
        >
          <div className="sensor-card-top">
            <div className="sensor-card-identity">
              <div
                className="sensor-card-icon"
                style={{ background: weightHealth.bgLight, color: weightHealth.color }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <div>
                <div className="sensor-card-label">Paper Tray Load</div>

              </div>
            </div>

            <span
              className="sensor-state-badge"
              style={{
                background: weightHealth.bgLight,
                color: weightHealth.color,
                border: `1px solid ${weightHealth.borderColor}`
              }}
            >
              {weight}g
            </span>
          </div>

          <div className="sensor-card-metric-row">
            <div className="sensor-big-value">
              <span>{weight}</span>
              <span className="sensor-unit">g</span>
            </div>

          </div>

          {/* Dynamic Sparkline */}
          <div className="sensor-sparkline-box">
            <Sparkline
              data={weightHistory}
              color={weightHealth.color}
              minVal={0}
              maxVal={50}
            />
          </div>

          <div className="sensor-card-track-container">
            <div className="sensor-card-track">
              <div
                className="sensor-card-fill"
                style={{
                  width: `${Math.min(100, Math.max(0, (weight / 50) * 100))}%`,
                  background: weightHealth.color
                }}
              ></div>
            </div>
            <div className="sensor-track-scale">
              <span>0g Tare</span>
              <span>50g Capacity</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
