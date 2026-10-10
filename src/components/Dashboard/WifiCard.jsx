import React, { useState } from 'react';
import { usePulp } from '../../context/PulpContext';

export default function WifiCard() {
  const { wifi, wifiDevices, fetchWifi } = usePulp();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchWifi();
    } finally {
      setIsRefreshing(false);
    }
  };

  const isUp = wifi?.isUp;

  return (
    <section className="panel-card" aria-label="Wi-Fi Network Status">
      <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
            <line x1="12" y1="20" x2="12.01" y2="20"></line>
          </svg>
          <span>Wi-Fi Network</span>
        </div>

        <button
          type="button"
          className="btn-secondary"
          style={{ padding: '4px 10px', fontSize: '0.74rem' }}
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Refresh network status"
        >
          {isRefreshing ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {/* Status Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        background: isUp ? 'var(--brand-sage-light)' : 'var(--brand-coral-light)',
        border: `1px solid ${isUp ? 'rgba(82, 130, 84, 0.25)' : 'rgba(217, 96, 82, 0.25)'}`,
        borderRadius: 'var(--radius-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="live-pulse-dot"
            style={{
              background: isUp ? 'var(--brand-sage)' : 'var(--brand-coral)',
              color: isUp ? 'var(--brand-sage)' : 'var(--brand-coral)'
            }}
          ></span>
          <span style={{
            fontWeight: 700,
            fontSize: '0.88rem',
            color: isUp ? 'var(--brand-sage)' : 'var(--brand-coral)'
          }}>
            {isUp ? 'Network Online' : 'Network Offline'}
          </span>
        </div>

        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          {wifiDevices.length} connected {wifiDevices.length === 1 ? 'client' : 'clients'}
        </span>
      </div>

      {/* Connected Devices List */}
      <div>
        <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Connected Devices
        </div>

        {wifiDevices.length === 0 ? (
          <div style={{
            padding: '16px',
            textAlign: 'center',
            background: 'var(--bg-surface-sunken)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-card)',
            color: 'var(--text-muted)',
            fontSize: '0.8rem'
          }}>
            No devices currently connected to system Wi-Fi.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {wifiDevices.map((dev, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'var(--bg-surface-sunken)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.78rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dev.ip || '192.168.4.x'}</span>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>{dev.mac || '00:00:00:00:00:00'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
