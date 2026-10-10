import React, { useRef, useState } from 'react';
import { usePulp } from '../../context/PulpContext';

export default function PinPasscodeEntry({ selectedDoc, onDecrypted }) {
  const { retrieveDocument } = usePulp();
  const [pinDigits, setPinDigits] = useState(Array(6).fill(''));
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const inputsRef = useRef([]);

  const handleInputChange = (idx, e) => {
    const rawVal = e.target.value;
    const cleanChar = rawVal.replace(/[^0-9a-zA-Z]/g, '').slice(-1);

    const nextDigits = [...pinDigits];
    nextDigits[idx] = cleanChar;
    setPinDigits(nextDigits);
    setErrorMessage('');

    if (cleanChar && idx < 5) {
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
    } else if (e.key === 'ArrowRight' && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData('text');
    const cleanChars = paste.replace(/[^0-9a-zA-Z]/g, '').slice(0, 6).split('');
    const nextDigits = Array(6).fill('');
    cleanChars.forEach((ch, i) => {
      nextDigits[i] = ch;
    });
    setPinDigits(nextDigits);

    const targetIdx = Math.min(cleanChars.length, 5);
    inputsRef.current[targetIdx]?.focus();
  };

  const handleRetrieve = async () => {
    setErrorMessage('');
    const fullPin = pinDigits.join('');
    if (fullPin.length !== 6) {
      setErrorMessage(`Please enter all 6 digits of the passcode.`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await retrieveDocument(fullPin);
      const data = res.data || res;
      if (res.ok && data.status === 'ok') {
        setPinDigits(Array(6).fill(''));
        onDecrypted({
          doc_id: selectedDoc?.id || selectedDoc?.doc_id || '01-0222344',
          timestamp: selectedDoc?.date || selectedDoc?.timestamp || 'Recent',
          file: data.file,
          msg: 'Document decrypted successfully'
        });
      } else {
        setErrorMessage(data.msg || 'Incorrect passcode. Please check your PIN and try again.');
      }
    } catch (_) {
      setErrorMessage('Unable to connect to document server.');
    } finally {
      setIsLoading(false);
    }
  };

  const docDisplayId = selectedDoc ? (selectedDoc.id || selectedDoc.doc_id) : null;

  return (
    <div className="pin-entry-card" id="pin-entry-panel">
      <div className="pin-header-block">
        <div className="pin-key-icon-badge">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <div className="pin-header-text">
          <h2 className="pin-label-title">Document Passcode</h2>
          <p className="pin-subtext">
            {docDisplayId ? (
              <>Ready to unlock <span className="doc-active-pill">#{docDisplayId}</span></>
            ) : (
              'Select a document above to unlock'
            )}
          </p>
        </div>
      </div>

      <div className="pin-boxes-container" onPaste={handlePaste}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <React.Fragment key={idx}>
            {idx === 3 && <span className="pin-dash">-</span>}
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
              aria-label={`Digit ${idx + 1}`}
            />
          </React.Fragment>
        ))}
      </div>

      {errorMessage && (
        <div className="alert-security" id="alert-pin-error">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="button"
        className="btn-retrieve"
        onClick={handleRetrieve}
        disabled={isLoading}
        id="btn-retrieve-doc"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span>{isLoading ? 'Decrypting...' : 'Retrieve Decrypted Document'}</span>
      </button>
    </div>
  );
}
