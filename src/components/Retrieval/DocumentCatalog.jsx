import React from 'react';

export default function DocumentCatalog({ documents, selectedDocId, onSelectDoc, searchQuery, onSearchChange }) {
  const filtered = (documents || []).filter(doc => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const docId = (doc.id || doc.doc_id || '').toLowerCase();
    const docDate = (doc.date || doc.timestamp || '').toLowerCase();
    return docId.includes(q) || docDate.includes(q);
  });

  return (
    <div className="panel-card" style={{ gap: '14px' }}>
      <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Archived Documents</span>
        <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
        </span>
      </div>

      <div className="search-box-wrapper">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          className="doc-search-input"
          placeholder="Search by document ID or date..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          id="doc-search-input"
        />
      </div>

      <div className="docs-list" id="doc-cards-list">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No matching documents found.
          </div>
        ) : (
          filtered.map(doc => {
            const fileId = doc.id || doc.doc_id || 'UNKNOWN';
            const fileDate = doc.date || doc.timestamp || 'Recent';
            const isSelected = fileId === selectedDocId;

            return (
              <div
                key={fileId}
                className={`doc-card-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectDoc(fileId)}
                id={`doc-item-${fileId}`}
              >
                <div className="doc-card-info">
                  <span className="doc-id-pill">#{fileId}</span>
                  <div className="doc-timestamp">{fileDate}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {isSelected ? (
                    <span className="doc-item-selected-badge">
                      Selected
                    </span>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', opacity: 0.65 }}>
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
