import React from 'react';
import { usePulp } from '../context/PulpContext';

export default function Navigation() {
  const {
    currentPath,
    navigate,
    isAdmin,
    toggleTerminal,
    isTerminalOpen,
    toggleNotifications,
    telemetry
  } = usePulp();

  const isAdminRoute = currentPath.startsWith('/admin') && isAdmin;
  const isBusy = telemetry.status === 'PROCESSING';

  if (!isAdminRoute) {
    return (
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <button
          className="bottom-nav-item active"
          onClick={() => navigate('/')}
          id="mobile-nav-vault"
          aria-label="Vault"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            <line x1="9" y1="7" x2="15" y2="7"></line>
            <line x1="9" y1="11" x2="13" y2="11"></line>
          </svg>
          <span>Vault</span>
        </button>

        <button
          className="bottom-nav-item"
          onClick={toggleNotifications}
          id="mobile-nav-notifications"
          aria-label="Notices"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span>Notices</span>
        </button>

        <button
          className="bottom-nav-item"
          onClick={() => navigate('/admin')}
          id="mobile-nav-admin"
          aria-label="Admin"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>Admin</span>
        </button>
      </nav>
    );
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <button
        className="bottom-nav-item active"
        onClick={() => navigate('/admin')}
        id="mobile-nav-dashboard"
        aria-label="Dashboard"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1"></rect>
          <rect x="14" y="3" width="7" height="5" rx="1"></rect>
          <rect x="14" y="12" width="7" height="9" rx="1"></rect>
          <rect x="3" y="16" width="7" height="5" rx="1"></rect>
        </svg>
        <span>Dashboard</span>
        {isBusy && <span className="bottom-nav-badge"></span>}
      </button>

      <button
        className="bottom-nav-item"
        onClick={() => navigate('/')}
        id="mobile-nav-vault-switch"
        aria-label="Vault"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          <line x1="9" y1="7" x2="15" y2="7"></line>
        </svg>
        <span>Vault</span>
      </button>

      <button
        className={`bottom-nav-item ${isTerminalOpen ? 'active' : ''}`}
        onClick={toggleTerminal}
        id="mobile-nav-terminal"
        aria-label="Terminal"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 17 10 11 4 5"></polyline>
          <line x1="12" y1="19" x2="20" y2="19"></line>
        </svg>
        <span>Terminal</span>
      </button>
    </nav>
  );
}
