import React from 'react';
import { usePulp } from '../../context/PulpContext';

export default function SystemControlsCard() {
  const { telemetry, startBatch, emergencyStop, resetSystem, setMode } = usePulp();

  const isBusy = telemetry.status === 'PROCESSING' || telemetry.status === 'SCANNING';
  const isHalted = telemetry.status === 'EMERGENCY_STOP';

  const handleStart = () => {
    if (isBusy || isHalted) return;
    startBatch();
  };

  const handleEstopToggle = () => {
    if (isHalted) {
      resetSystem();
    } else {
      emergencyStop();
    }
  };

  return (
    <section className="panel-card controls-card" aria-label="System Controls">
      <div className="panel-title">
        <span>System Controls</span>
      </div>

      <div className="controls-actions-row">

        <button
          type="button"
          className="btn-start"
          onClick={handleStart}
          disabled={isBusy || isHalted}
          id="btn-start-batch"
        >
          {isBusy ? (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12"></circle>
              </svg>
              <span>{telemetry.status === 'SCANNING' ? 'Feeding...' : 'Processing...'}</span>
            </>
          ) : isHalted ? (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              </svg>
              <span>Reset Required</span>
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 4 20 12 6 20 6 4"></polygon>
              </svg>
              <span>Start Batch</span>
            </>
          )}
        </button>


        <button
          type="button"
          className={`btn-estop ${isHalted ? 'active-halted' : ''}`}
          onClick={handleEstopToggle}
          id="btn-emergency-stop"
        >
          {isHalted ? (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              <span>Reset Safety</span>
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span>Emergency Stop</span>
            </>
          )}
        </button>
      </div>


      <div className="controls-secondary-bar">
        <div className="mode-selector" aria-label="Mode Selection">
          <button
            type="button"
            className={`mode-pill ${telemetry.mode === 'Scan-Shred' ? 'active' : ''}`}
            onClick={() => setMode('Scan-Shred')}
            disabled={isBusy || isHalted}
            id="mode-btn-scanshred"
          >
            Scan-Shred
          </button>
          <button
            type="button"
            className={`mode-pill ${telemetry.mode === 'Shred-Only' ? 'active' : ''}`}
            onClick={() => setMode('Shred-Only')}
            disabled={isBusy || isHalted}
            id="mode-btn-shredonly"
          >
            Shred-Only
          </button>
        </div>

        <div className="paper-size-pill" title="Fixed institutional paper dimensions">
          8.5" × 13"
        </div>
      </div>
    </section>
  );
}
