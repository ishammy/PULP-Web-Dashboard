import React, { useState, useEffect } from 'react';
import { usePulp } from '../context/PulpContext';

export default function Header() {
  const { telemetry, activeTab, setActiveTab, toggleTerminal, theme, toggleTheme, isConnected } = usePulp();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const isHalted = telemetry.status === 'EMERGENCY_STOP';
  const isBusy = telemetry.status === 'PROCESSING' || telemetry.status === 'SCANNING';

  const statusLabel = !isConnected
    ? 'BACKEND OFFLINE'
    : isHalted
      ? 'HALTED'
      : isBusy
        ? telemetry.current_process
        : 'READY';

  const statusClass = !isConnected
    ? 'halted'
    : isHalted
      ? 'halted'
      : isBusy
        ? 'active'
        : '';

  return (
    <header className="top-header">
      <div className="header-left">
        <div className="brand-badge" title="PULP Micro-Paper Recycling System">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <span>PULP</span>
        </div>

        <div
          className={`header-status-pill ${statusClass}`}
          title={isConnected ? 'Connected to backend server on port 1234' : 'Connecting to backend on http://localhost:1234...'}
        >
          <span className="live-pulse-dot"></span>
          <span>{statusLabel}</span>
        </div>

        <span className="header-clock">{timeStr}</span>
      </div>

      <nav className="desktop-tab-nav" aria-label="Desktop Navigation">
        <button
          className={`nav-pill-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
          id="btn-tab-dashboard"
        >
          Dashboard
        </button>
        <button
          className={`nav-pill-btn ${activeTab === 'retrieval' ? 'active' : ''}`}
          onClick={() => setActiveTab('retrieval')}
          id="btn-tab-retrieval"
        >
          File Vault
        </button>
        {/* <button
          className={`nav-pill-btn ${activeTab === 'diagnostics' ? 'active' : ''}`}
          onClick={() => setActiveTab('diagnostics')}
          id="btn-tab-diagnostics"
        >
          Diagnostics
        </button> */}
      </nav>

      <div className="header-actions">
        {/* Theme Toggle */}
        <button
          className="icon-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label="Toggle Theme"
          id="btn-theme-toggle"
        >
          {theme === 'light' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          )}
        </button>

        {/* Terminal Quick Button */}
        <button
          className="icon-btn"
          onClick={toggleTerminal}
          title="Open Diagnostic Terminal"
          aria-label="Toggle Terminal"
          id="btn-terminal-quick"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
          </svg>
        </button>
      </div>
    </header>
  );
}
