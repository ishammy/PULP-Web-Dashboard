import React from 'react';
import { usePulp } from '../../context/PulpContext';

export default function HeroProcessCard() {
  const { batch, statistics } = usePulp();

  const papersInBatch = batch?.papers || 0;
  const isBatchActive = papersInBatch > 0;
  const totalProcessed = statistics?.papers_processed || 0;

  const RADIUS = 56;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  let gaugeValue = isBatchActive ? `${papersInBatch}` : 'Ready';
  let gaugeSubtext = isBatchActive ? 'Sheets' : 'Standby';
  let percent = isBatchActive ? Math.min(100, Math.max(20, papersInBatch * 25)) : 100;
  let strokeDashoffset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;

  const ringClass = isBatchActive ? 'scanning' : '';

  return (
    <section className="hero-card" aria-label="Process Status">
      <div className="hero-primary-section">
        <div className="gauge-wrapper" id="process-gauge">
          <svg className="gauge-svg" viewBox="0 0 130 130">
            <circle
              className="gauge-bg-ring"
              cx="65"
              cy="65"
              r={RADIUS}
            />
            <circle
              className={`gauge-progress-ring ${ringClass}`}
              cx="65"
              cy="65"
              r={RADIUS}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="gauge-center-content">
            <span
              className="gauge-number"
              id="gauge-display-val"
              style={{ fontSize: isBatchActive ? '2.1rem' : '1.35rem' }}
            >
              {gaugeValue}
            </span>
            <span className="gauge-subtext">{gaugeSubtext}</span>
          </div>
        </div>

        {/* Process Meta */}
        <div className="process-meta">
          <span className="process-overline">System Overview</span>
          <h1 className="process-title" id="process-label-title">
            {isBatchActive ? 'Running' : 'Idle'}
          </h1>

          <div className="process-mode-badge">
            <span
              className="live-pulse-dot"
              style={{
                background: isBatchActive ? 'var(--brand-sage)' : 'var(--brand-terracotta)',
                color: isBatchActive ? 'var(--brand-sage)' : 'var(--brand-terracotta)'
              }}
            ></span>
            <span>
              {isBatchActive ? 'Active Cycle in Progress' : 'Idle & Awaiting Input'}
            </span>
          </div>
        </div>
      </div>

      <div className="batch-stats-box">
        <div className="batch-box-header">Batch Summary</div>
        <div className="batch-box-body" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span className="batch-big-num" id="batch-sheets-count">{papersInBatch}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>sheets in current batch</span>
          </div>
        </div>
        <div className="batch-totals-row" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
          <span>Total Sheets Recycled: <strong id="lifetime-total-val">{totalProcessed}</strong></span>
        </div>
      </div>
    </section>
  );
}
