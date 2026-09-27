import React from 'react';

export default function DocumentCatalog({ documents, selectedDocId, onSelectDoc, searchQuery, onSearchChange }) {
  const filtered = documents.filter(doc => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (doc.doc_id || '').toLowerCase().includes(q) ||
      (doc.timestamp || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="panel-card" style={{ gap: '12px' }}>
      <div className="panel-title">
        <span>Archived Documents ({filtered.length})</span>
      </div>

      {/* Search Input */}
      <div className="search-box-wrapper">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          className="doc-search-input"
          placeholder="Search Document ID..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          id="doc-search-input"
        />
      </div>

      {/* Document Items List */}
      <div className="docs-list" id="doc-cards-list">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No documents found matching search query.
          </div>
        ) : (
          filtered.map(doc => {
            const isSelected = doc.doc_id === selectedDocId;
            return (
              <div
                key={doc.doc_id}
                className={`doc-card-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectDoc(doc.doc_id)}
                id={`doc-item-${doc.doc_id}`}
              >
                <div className="doc-card-info">
                  <span className="doc-id-pill">DOC_ID: {doc.doc_id}</span>
                  <div className="doc-timestamp">{doc.timestamp}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {isSelected ? (
                    <span style={{ color: 'var(--brand-terracotta)', fontWeight: 800, fontSize: '0.8rem' }}>
                      Selected
                    </span>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
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
