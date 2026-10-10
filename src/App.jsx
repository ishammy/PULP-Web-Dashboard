import React, { useState } from 'react';
import { usePulp } from './context/PulpContext';
import Header from './components/Header';
import Navigation from './components/Navigation';
import HeroProcessCard from './components/Dashboard/HeroProcessCard';
import SensorsCard from './components/Dashboard/SensorsCard';
import WifiCard from './components/Dashboard/WifiCard';
import DocumentCatalog from './components/Retrieval/DocumentCatalog';
import PinPasscodeEntry from './components/Retrieval/PinPasscodeEntry';
import DocumentPreviewModal from './components/Retrieval/DocumentPreviewModal';
import TerminalDrawer from './components/Terminal/TerminalDrawer';
import AdminLoginPage from './components/Admin/AdminLoginPage';
import NotificationsModal from './components/Notifications/NotificationsModal';

export default function App() {
  const { currentPath, isAdmin, telemetry } = usePulp();

  const documents = telemetry.documents || [];
  const [selectedDocId, setSelectedDocId] = useState(() => {
    return documents[0]?.id || documents[0]?.doc_id || '01-0222344';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [decryptedDoc, setDecryptedDoc] = useState(null);

  const selectedDoc = documents.find(d => (d.id || d.doc_id) === selectedDocId) || documents[0] || null;
  const isAdminRoute = currentPath.startsWith('/admin');

  return (
    <div className="pulp-viewport">
      <Header />

      <main>

        {isAdminRoute ? (
          !isAdmin ? (
            <AdminLoginPage />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <HeroProcessCard />
              <SensorsCard />
              <WifiCard />

            </div>
          )
        ) : (

          <div className="vault-view-container">
            <DocumentCatalog
              documents={documents}
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
      </main>

      <DocumentPreviewModal
        docData={decryptedDoc}
        onClose={() => setDecryptedDoc(null)}
      />
      <NotificationsModal />


      {isAdminRoute && isAdmin && <TerminalDrawer />}

    </div>
  );
}
