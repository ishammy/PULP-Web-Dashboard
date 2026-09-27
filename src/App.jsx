import React, { useState } from 'react';
import { usePulp } from './context/PulpContext';
import Header from './components/Header';
import Navigation from './components/Navigation';
import HeroProcessCard from './components/Dashboard/HeroProcessCard';
import TimelineCard from './components/Dashboard/TimelineCard';
import SensorsCard from './components/Dashboard/SensorsCard';
import SystemControlsCard from './components/Dashboard/SystemControlsCard';
import HardwareDiagnostics from './components/Dashboard/HardwareDiagnostics';
import DocumentCatalog from './components/Retrieval/DocumentCatalog';
import PinPasscodeEntry from './components/Retrieval/PinPasscodeEntry';
import DocumentPreviewModal from './components/Retrieval/DocumentPreviewModal';
import TerminalDrawer from './components/Terminal/TerminalDrawer';

export default function App() {
  const { activeTab, telemetry } = usePulp();


  const [selectedDocId, setSelectedDocId] = useState(() => {
    return telemetry.documents?.[0]?.doc_id || '01-0222344';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [decryptedDoc, setDecryptedDoc] = useState(null);

  const selectedDoc = (telemetry.documents || []).find(d => d.doc_id === selectedDocId);

  return (
    <div className="pulp-viewport">
      <Header />

      <main>

        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <HeroProcessCard />

            <div className="dashboard-grid">
              <TimelineCard />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <SensorsCard />
                <SystemControlsCard />
              </div>
            </div>


            <div style={{ marginTop: '8px' }}>
              <HardwareDiagnostics />
            </div>
          </div>
        )}

        {activeTab === 'retrieval' && (
          <div className="vault-view-container">
            <DocumentCatalog
              documents={telemetry.documents || []}
              selectedDocId={selectedDocId}
              onSelectDoc={setSelectedDocId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            <PinPasscodeEntry
              selectedDoc={selectedDoc}
              onDecrypted={setDecryptedDoc}
            />
          </div>
        )}

        {/* Uncomment if need natin ng separate Diagnostic tab */}
        {/* {activeTab === 'diagnostics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <HardwareDiagnostics />
            <SensorsCard />
          </div>
        )} */}
      </main>

      <DocumentPreviewModal
        docData={decryptedDoc}
        onClose={() => setDecryptedDoc(null)}
      />
      <TerminalDrawer />

      <Navigation />
    </div>
  );
}
