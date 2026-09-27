import React from 'react';

export default function DocumentPreviewModal({ docData, onClose }) {
  if (!docData) return null;

  const downloadHref = docData.download_url || `/download/${docData.doc_id}`;
  const downloadFilename = `${docData.doc_id}.pdf`;

  return (
    <div className={`doc-modal-backdrop ${docData ? 'open' : ''}`} onClick={onClose} id="doc-decrypted-modal">
      <div className="doc-modal-card" onClick={e => e.stopPropagation()}>
        <div className="doc-modal-header">
          <div className="doc-modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Document Decrypted</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
            <strong>DOC_ID:</strong> {docData.doc_id} &nbsp;|&nbsp; <strong>Scanned:</strong> {docData.timestamp}
          </div>
        </div>

        {docData.preview_text && (
          <div className="doc-preview-body">
            {docData.preview_text}
          </div>
        )}

        <div className="doc-modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <a
            href={downloadHref}
            download={downloadFilename}
            className="btn-download-pdf"
            id="btn-download-pdf-file"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Download Decrypted PDF</span>
          </a>
        </div>
      </div>
    </div>
  );
}
