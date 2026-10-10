import React from 'react';
import { usePulp } from '../../context/PulpContext';

export default function NotificationsModal() {
  const { isNotificationsOpen, toggleNotifications, notifications } = usePulp();

  if (!isNotificationsOpen) return null;

  return (
    <div className="doc-modal-backdrop open" onClick={toggleNotifications} id="notifications-modal-backdrop">
      <div
        className="doc-modal-card"
        style={{ maxWidth: '440px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="doc-modal-header">
          <div className="doc-modal-title" style={{ color: 'var(--brand-terracotta)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span>System Notices</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={toggleNotifications} aria-label="Close modal">
            &times;
          </button>
        </div>

        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', padding: '6px 0' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
              No active system notices.
            </div>
          ) : (
            notifications.map((notif, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-surface-sunken)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                  <span style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: 'var(--brand-terracotta)',
                    flexShrink: 0
                  }}></span>
                  <span>{notif.title || 'Notice'}</span>
                </div>
                {notif.description && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, paddingLeft: '15px' }}>
                    {notif.description}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="doc-modal-footer" style={{ marginTop: '10px' }}>
          <button type="button" className="btn-secondary" onClick={toggleNotifications}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
