import React, { useMemo } from 'react';
import { API } from '../../services/api';

export default function DocumentPreviewModal({ docData, onClose }) {
  if (!docData) return null;

  const pdfBlobUrl = useMemo(() => {
    if (docData.file) {
      return API.base64ToPdfBlobUrl(docData.file);
    }
    return null;
  }, [docData.file]);

  const docId = docData.doc_id || 'document';
  const docDate = docData.timestamp || 'Recent';
  const downloadFilename = `${docId}.pdf`;

  return (
    <div className={`doc-modal-backdrop ${docData ? 'open' : ''}`} onClick={onClose} id="doc-decrypted-modal">
      <div className="doc-modal-card" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
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

        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
          <span><strong>Document:</strong> #{docId}</span>
          <span>&bull;</span>
          <span><strong>Archived:</strong> {docDate}</span>
        </div>

        {pdfBlobUrl ? (
          <div style={{
            background: 'var(--bg-surface-sunken)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            height: '260px',
            display: 'flex',
            flexDirection: 'column',
            marginTop: '6px'
          }}>
            <iframe
              src={pdfBlobUrl}
              title={`PDF Preview ${docId}`}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        ) : (
          <div className="doc-preview-body" style={{ marginTop: '6px' }}>
            Document successfully decrypted and ready to download.
          </div>
        )}

        <div className="doc-modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <a
            href={pdfBlobUrl || '#'}
            download={downloadFilename}
            className="btn-download-pdf"
            id="btn-download-pdf-file"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Download PDF</span>
          </a>
        </div>
      </div>
    </div>
  );
}
