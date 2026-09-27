import React from 'react';
import { usePulp } from '../../context/PulpContext';

export default function HeroProcessCard() {
  const { telemetry, feedAdditionalSheet, proceedToShred } = usePulp();

  const isScanning = telemetry.status === 'SCANNING' || telemetry.current_process === 'SCANNING' || telemetry.awaiting_paper;
  const isHalted = telemetry.status === 'EMERGENCY_STOP';
  const isIdle = telemetry.status === 'IDLE';


  const RADIUS = 56;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  let percent = Math.min(100, Math.max(0, telemetry.progress_percent || 0));
  let strokeDashoffset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;

  let gaugeValue = `${Math.round(percent)}%`;
  let gaugeSubtext = isIdle ? 'Ready' : 'Progress';

  if (isScanning) {
    gaugeValue = `${telemetry.scanned_pages || 1}`;
    gaugeSubtext = 'Sheets';
    strokeDashoffset = 0;
  } else if (isHalted) {
    gaugeSubtext = 'Halted';
  }

  const ringClass = isScanning ? 'scanning' : isHalted ? 'halted' : '';

  const maxIcons = 5;
  const currentCount = telemetry.generated_this_batch || 0;

  return (
    <section className="hero-card" aria-label="Current Process Status">
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
            <span className="gauge-number" id="gauge-display-val">{gaugeValue}</span>
            <span className="gauge-subtext">{gaugeSubtext}</span>
          </div>
        </div>

        {/* Process Meta */}
        <div className="process-meta">
          <span className="process-overline">Process Status</span>
          <h1 className="process-title" id="process-label-title">
            {isHalted ? 'EMERGENCY STOP' : isScanning ? 'FEEDING PAPER' : telemetry.current_process}
          </h1>

          <div className="process-mode-badge">
            <span
              className="live-pulse-dot"
              style={{
                background: isHalted ? 'var(--brand-coral)' : isScanning ? 'var(--brand-sage)' : 'var(--brand-terracotta)',
                color: isHalted ? 'var(--brand-coral)' : isScanning ? 'var(--brand-sage)' : 'var(--brand-terracotta)'
              }}
            ></span>
            <span>
              {isHalted
                ? 'EMERGENCY STOP ACTIVE'
                : isScanning
                  ? 'Paper Input Active'
                  : isIdle
                    ? `Ready (${telemetry.mode} Mode)`
                    : `Running in ${telemetry.mode} Mode`}
            </span>
          </div>

          {isScanning && telemetry.awaiting_paper && (
            <div className="paper-feed-banner" id="paper-feed-prompt">
              <div className="feed-banner-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <line x1="12" y1="18" x2="12" y2="12"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
                <span>Paper Scan</span>
              </div>

              <div className="feed-actions">
                <button
                  type="button"
                  className="feed-btn secondary"
                  onClick={feedAdditionalSheet}
                  id="btn-feed-another-sheet"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Scan Another Sheet
                </button>
                <button
                  type="button"
                  className="feed-btn primary"
                  onClick={proceedToShred}
                  id="btn-proceed-shred"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                  Finish & Shred
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="batch-stats-box">
        <div className="batch-box-header">Generated This Batch</div>
        <div className="batch-box-body">
          <span className="batch-big-num" id="batch-sheets-count">{currentCount}</span>
          <div className="sheets-stack" aria-label={`${currentCount} sheets generated`}>
            {Array.from({ length: maxIcons }).map((_, idx) => {
              const isFilled = idx < currentCount;
              return (
                <svg
                  key={idx}
                  className={`sheet-svg ${isFilled ? 'filled' : 'empty'}`}
                  viewBox="0 0 24 30"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 3C2 1.89543 2.89543 1 4 1H15L22 8V27C22 28.1046 21.1046 29 20 29H4C2.89543 29 2 28.1046 2 27V3Z"
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 1V8H22"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              );
            })}
          </div>
        </div>
        <div className="batch-totals-row">
          <span>Daily Total: <strong id="daily-total-val">{telemetry.daily_total}</strong></span>
          <span>Lifetime: <strong id="lifetime-total-val">{telemetry.lifetime_total}</strong></span>
        </div>
      </div>
    </section>
  );
}
