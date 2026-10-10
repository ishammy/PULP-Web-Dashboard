import React from 'react';
import { usePulp } from '../../context/PulpContext';

export default function HardwareDiagnostics() {
  const { telemetry } = usePulp();
  const adv = telemetry.advanced || {};

  return (
    <section className="panel-card" aria-label="System Diagnostics Overview">
      <div className="panel-title">
        <span>Diagnostics Overview</span>
      </div>

      <div className="diagnostics-grid">
        {/* Category 1: Mechanical & Actuation */}
        <div className="diag-category-card">
          <div className="diag-category-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span>Mechanical System</span>
          </div>
          <div className="diag-metric-row">
            <span className="diag-label">Shredder Load:</span>
            <span className="diag-val">{adv.shredder_load_a || 4.8} A</span>
          </div>
          <div className="diag-metric-row">
            <span className="diag-label">Shredder Speed:</span>
            <span className="diag-val">{adv.shredder_rpm || 180} RPM</span>
          </div>
          <div className="diag-metric-row">
            <span className="diag-label">Press Force:</span>
            <span className="diag-val">{adv.actuator_force_n || 2450} N</span>
          </div>
          <div className="diag-metric-row">
            <span className="diag-label">Agitator Speed:</span>
            <span className="diag-val">{adv.agitator_rpm || 320} RPM</span>
          </div>
        </div>

        {/* Category 2: Fluidics & Drainage */}
        <div className="diag-category-card">
          <div className="diag-category-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
            </svg>
            <span>Fluidics & Drainage</span>
          </div>
          <div className="diag-metric-row">
            <span className="diag-label">Flow Rate:</span>
            <span className="diag-val">{adv.water_flow_lpm || 1.4} L/min</span>
          </div>
          <div className="diag-metric-row">
            <span className="diag-label">Water Dispensed:</span>
            <span className="diag-val">{adv.water_dispensed_ml || 650} mL</span>
          </div>
          <div className="diag-metric-row">
            <span className="diag-label">Drainage Speed:</span>
            <span className="diag-val">{adv.drainage_rate_ml_s || 18.5} mL/s</span>
          </div>
          <div className="diag-metric-row">
            <span className="diag-label">Water Reclaimed:</span>
            <span className="diag-val">{adv.water_reclaimed_percent || 88}%</span>
          </div>
        </div>

        {/* Category 3: Thermal & Power */}
        <div className="diag-category-card">
          <div className="diag-category-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
            </svg>
            <span>Thermal & Power</span>
          </div>
          <div className="diag-metric-row">
            <span className="diag-label">Chamber Moisture:</span>
            <span className="diag-val">{adv.chamber_moisture_rh || 42}% RH</span>
          </div>
          <div className="diag-metric-row">
            <span className="diag-label">Active Power:</span>
            <span className="diag-val">{adv.instantaneous_power_w || 14} W</span>
          </div>
          <div className="diag-metric-row">
            <span className="diag-label">Energy Used:</span>
            <span className="diag-val">{adv.energy_consumed_wh || 38.6} Wh</span>
          </div>
          <div className="diag-metric-row">
            <span className="diag-label">Plate Temp:</span>
            <span className="diag-val">{telemetry.temperature || 32.0}°C</span>
          </div>
        </div>

        {/* Category 4: System Controller */}
        <div className="diag-category-card">
          <div className="diag-category-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
            <span>System Controller</span>
          </div>
          <div className="diag-metric-row">
            <span className="diag-label">Processor Temp:</span>
            <span className="diag-val">{adv.processor_temp_c || 48}°C</span>
          </div>
          <div className="diag-metric-row">
            <span className="diag-label">Storage Free:</span>
            <span className="diag-val">{adv.storage_free_gb || 18.2} GB</span>
          </div>
          <div className="diag-metric-row">
            <span className="diag-label">Avoided CO₂:</span>
            <span className="diag-val" style={{ color: 'var(--brand-sage)' }}>
              {adv.co2_avoided_g || 142.5} g
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
