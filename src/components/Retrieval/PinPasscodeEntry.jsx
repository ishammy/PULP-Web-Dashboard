import React, { useRef, useState, useEffect } from 'react';
import { usePulp } from '../../context/PulpContext';

export default function PinPasscodeEntry({ selectedDoc, onDecrypted }) {
  const { telemetry, retrieveDocument, adminUnlock } = usePulp();
  const [pinDigits, setPinDigits] = useState(Array(10).fill(''));
  const [errorMessage, setErrorMessage] = useState('');
  const [lockoutSecs, setLockoutSecs] = useState(0);

  const inputsRef = useRef([]);

  useEffect(() => {
    if (!telemetry.security_locked) {
      setLockoutSecs(0);
      return;
    }
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((telemetry.lockout_until - Date.now()) / 1000));
      setLockoutSecs(remaining);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [telemetry.security_locked, telemetry.lockout_until]);

  const handleInputChange = (idx, e) => {
    const rawVal = e.target.value;
    const cleanChar = rawVal.replace(/[^0-9a-fA-F]/g, '').toUpperCase().slice(-1);

    const nextDigits = [...pinDigits];
    nextDigits[idx] = cleanChar;
    setPinDigits(nextDigits);
    setErrorMessage('');

    if (cleanChar && idx < 9) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (!pinDigits[idx] && idx > 0) {
        inputsRef.current[idx - 1]?.focus();
      } else {
        const nextDigits = [...pinDigits];
        nextDigits[idx] = '';
        setPinDigits(nextDigits);
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < 9) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData('text');
    const cleanChars = paste.replace(/[^0-9a-fA-F]/g, '').toUpperCase().slice(0, 10).split('');
    const nextDigits = Array(10).fill('');
    cleanChars.forEach((ch, i) => {
      nextDigits[i] = ch;
    });
    setPinDigits(nextDigits);

    const targetIdx = Math.min(cleanChars.length, 9);
    inputsRef.current[targetIdx]?.focus();
  };

  const handleTestPin = () => {
    const targetPin = selectedDoc?.pin || '1A2B3C4D5E';
    const chars = targetPin.split('');
    const nextDigits = Array(10).fill('');
    chars.forEach((c, i) => {
      nextDigits[i] = c;
    });
    setPinDigits(nextDigits);
    setErrorMessage('');
    inputsRef.current[9]?.focus();
  };

  const handleRetrieve = async () => {
    setErrorMessage('');
    if (!selectedDoc) {
      setErrorMessage('Please select a document from the archive first.');
      return;
    }

    const fullPin = pinDigits.join('');
    if (fullPin.length !== 10) {
      setErrorMessage(`Please enter all 10 hexadecimal digits (${fullPin.length}/10 entered).`);
      return;
    }

    try {
      const res = await retrieveDocument(selectedDoc.doc_id, fullPin);
      const data = res.data || res;
      if (res.ok && data.success) {
        setPinDigits(Array(10).fill(''));
        onDecrypted(data);
      } else {
        setErrorMessage(data.message || 'Authentication error.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Network error reaching backend.');
    }
  };

  return (
    <div className="pin-entry-card" id="pin-entry-panel">
      <div className="pin-label-row">
        <div>
          <span className="pin-label-title">Enter 10-Digit Passcode</span>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Selected: <strong style={{ color: 'var(--brand-terracotta)' }}>{selectedDoc ? selectedDoc.doc_id : 'None'}</strong>
          </div>
        </div>

        <button
          type="button"
          className="btn-test-pin"
          onClick={handleTestPin}
          id="btn-test-pin-autofill"
          title="Autofill correct passcode for testing"
        >
          Autofill Test PIN
        </button>
      </div>


      <div className="pin-boxes-container" onPaste={handlePaste}>
        {Array.from({ length: 10 }).map((_, idx) => (
          <React.Fragment key={idx}>
            {idx === 5 && <span className="pin-dash">-</span>}
            <input
              ref={el => (inputsRef.current[idx] = el)}
              type="text"
              maxLength={1}
              className="pin-input-box"
              value={pinDigits[idx]}
              onChange={e => handleInputChange(idx, e)}
              onKeyDown={e => handleKeyDown(idx, e)}
              autoComplete="off"
              spellCheck="false"
              inputMode="text"
              id={`pin-box-${idx}`}
            />
          </React.Fragment>
        ))}
      </div>

      {telemetry.security_locked ? (
        <div className="alert-security" id="alert-lockout">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <div>
            <strong>SECURITY LOCKOUT:</strong> Locked for {lockoutSecs}s.
          </div>
          <button
            type="button"
            className="btn-unlock-admin"
            onClick={adminUnlock}
            id="btn-admin-unlock"
          >
            Admin: Unlock
          </button>
        </div>
      ) : errorMessage ? (
        <div className="alert-security" id="alert-pin-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div>{errorMessage}</div>
        </div>
      ) : null}

      <button
        type="button"
        className="btn-retrieve"
        onClick={handleRetrieve}
        disabled={telemetry.security_locked}
        id="btn-retrieve-doc"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span>Retrieve Scanned PDF</span>
      </button>
    </div>
  );
}
