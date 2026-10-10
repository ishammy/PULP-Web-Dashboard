import React, { useState } from 'react';
import { usePulp } from '../../context/PulpContext';

export default function AdminLoginModal() {
  const { isAdminModalOpen, toggleAdminModal, loginAdmin } = usePulp();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isAdminModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await loginAdmin(username.trim(), password);
      if (res.ok) {
        setPassword('');
        toggleAdminModal();
      } else {
        setErrorMsg(res.msg || res.raw?.msg || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Connection error to /api/admin/login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="doc-modal-backdrop open" onClick={toggleAdminModal} id="admin-login-modal">
      <div className="doc-modal-card" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
        <div className="doc-modal-header">
          <div className="doc-modal-title" style={{ color: 'var(--brand-terracotta)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>Admin Authentication</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={toggleAdminModal} aria-label="Close modal">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Enter administrator credentials to unlock the hardware dashboard and diagnostic terminal via <code>POST /api/admin/login</code>.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              USERNAME
            </label>
            <input
              type="text"
              className="doc-search-input"
              style={{ width: '100%' }}
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="USER"
              required
              autoFocus
              id="input-admin-username"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              PASSWORD
            </label>
            <input
              type="password"
              className="doc-search-input"
              style={{ width: '100%' }}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="PASS"
              required
              id="input-admin-password"
            />
          </div>

          {errorMsg && (
            <div className="alert-security" style={{ margin: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="doc-modal-footer" style={{ marginTop: '6px' }}>
            <button type="button" className="btn-secondary" onClick={toggleAdminModal}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-download-pdf"
              style={{ background: 'var(--brand-terracotta)' }}
              disabled={isLoading}
              id="btn-admin-login-submit"
            >
              {isLoading ? 'Verifying...' : 'Sign In as Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
