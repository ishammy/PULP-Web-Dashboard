import React from 'react';
import { usePulp } from '../../context/PulpContext';

export default function TimelineCard() {
  const { telemetry } = usePulp();

  const stages = telemetry.timeline || [];

  // Compute rail height percentage
  let activeIndex = stages.findIndex(s => s.status === 'In Progress');
  let progressPercent = 0;

  if (activeIndex !== -1) {
    progressPercent = Math.min(100, Math.max(0, (activeIndex / (stages.length - 1)) * 100));
  } else {
    const allComplete = stages.length > 0 && stages.every(s => s.status === 'Complete' || s.status === 'Skipped');
    if (allComplete) {
      progressPercent = 100;
    } else {
      const lastComplete = stages.map(s => s.status).lastIndexOf('Complete');
      progressPercent = lastComplete !== -1 ? (lastComplete / (stages.length - 1)) * 100 : 0;
    }
  }

  return (
    <section className="panel-card" aria-label="Operational Timeline">
      <div className="panel-title">
        <span>Operational Timeline</span>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {telemetry.status}
        </span>
      </div>

      <div className="timeline-stages-list">
        {/* Vertical Rail Background and Fill */}
        <div className="timeline-track-rail"></div>
        <div className="timeline-track-fill" style={{ height: `${progressPercent}%` }}></div>

        {stages.map((stage, idx) => {
          const statusLower = (stage.status || 'pending').toLowerCase().replace(' ', '-');
          const isCurrent = stage.status === 'In Progress';
          const isComplete = stage.status === 'Complete';

          return (
            <div
              key={idx}
              className={`timeline-stage-row ${isCurrent ? 'in-progress' : ''}`}
              id={`timeline-stage-${idx}`}
            >
              <div className="stage-left">
                <span
                  className="stage-dot"
                  style={{
                    background: isComplete
                      ? 'var(--brand-sage)'
                      : isCurrent
                      ? 'var(--brand-terracotta)'
                      : 'var(--border-card)'
                  }}
                ></span>
                <div>
                  <div className="stage-name">{stage.name}</div>
                  <div className="stage-time">{stage.time && stage.time !== '-' ? stage.time : '--:--'}</div>
                </div>
              </div>

              <span className={`stage-status-pill ${statusLower}`}>
                {stage.status}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
