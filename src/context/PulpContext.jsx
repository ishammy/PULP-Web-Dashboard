import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { API } from '../services/api';

const PulpContext = createContext(null);

const INITIAL_TELEMETRY = {
  status: 'IDLE',
  state: 'IDLE',
  mode: 'Scan-Shred',
  paper_size: '8.5" x 13"',
  progress_percent: 0,
  current_process: 'CONNECTING...',
  scanned_pages: 0,
  awaiting_paper: false,
  hardware_display_prompt: '',
  generated_this_batch: 0,
  daily_total: 0,
  lifetime_total: 0,
  water_level: 0,
  temperature: 25,
  weight: 0,
  sensors: { water_level: 0, temperature: 25, weight: 0 },
  mechanical: {},
  hydration: {},
  thermal: {},
  edge_controller: {},
  sustainability: {},
  timeline: [],
  security_locked: false,
};

export function PulpProvider({ children }) {
  const [telemetry, setTelemetry] = useState(INITIAL_TELEMETRY);
  const [documents, setDocuments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('pulp_theme') || 'light');

  const pollTimerRef = useRef(null);

  // Fetch telemetry from backend
  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await API.getTelemetry();
      if (res.success && res.data) {
        setTelemetry(res.data);
        setIsConnected(true);
        setConnectionError(null);
      } else {
        setIsConnected(false);
        setConnectionError(res.error || 'Failed to fetch telemetry');
      }
    } catch (err) {
      setIsConnected(false);
      setConnectionError(err.message);
    }
  }, []);

  // Fetch terminal logs from backend
  const fetchLogs = useCallback(async () => {
    try {
      const remoteLogs = await API.getTerminalLogs();
      if (Array.isArray(remoteLogs)) {
        setLogs(remoteLogs);
      }
    } catch (_) {}
  }, []);

  // Fetch document catalog from backend
  const fetchDocuments = useCallback(async (search = '') => {
    try {
      const docs = await API.getDocuments(search);
      if (Array.isArray(docs)) {
        setDocuments(docs);
      }
    } catch (_) {}
  }, []);

  // Initial and recurring poll loop (1.5s interval)
  useEffect(() => {
    fetchTelemetry();
    fetchLogs();
    fetchDocuments();

    pollTimerRef.current = setInterval(() => {
      fetchTelemetry();
    }, 1500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchTelemetry, fetchLogs, fetchDocuments]);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pulp_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleTerminal = () => {
    setIsTerminalOpen(prev => {
      const next = !prev;
      if (next) fetchLogs();
      return next;
    });
  };

  // Real backend actions
  const startBatch = async (mode) => {
    const res = await API.startBatch(mode || telemetry.mode);
    await fetchTelemetry();
    await fetchLogs();
    await fetchDocuments();
    return res;
  };

  const emergencyStop = async () => {
    const res = await API.emergencyStop();
    await fetchTelemetry();
    await fetchLogs();
    return res;
  };

  const resetSystem = async () => {
    const res = await API.resetSystem();
    await fetchTelemetry();
    await fetchLogs();
    return res;
  };

  const setMode = async (mode) => {
    const res = await API.updateSettings(mode);
    await fetchTelemetry();
    return res;
  };

  const feedAdditionalSheet = async () => {
    const res = await API.scanPage();
    await fetchTelemetry();
    await fetchLogs();
    await fetchDocuments();
    return res;
  };

  const proceedToShred = async () => {
    const res = await API.proceedToShred();
    await fetchTelemetry();
    await fetchLogs();
    return res;
  };

  const retrieveDocument = async (docId, pin) => {
    const res = await API.retrieveDocument(docId, pin);
    await fetchTelemetry();
    await fetchLogs();
    return res;
  };

  const adminUnlock = async () => {
    const res = await API.adminUnlock();
    await fetchTelemetry();
    await fetchLogs();
    return res;
  };

  const executeCommand = async (cmd) => {
    const res = await API.sendTerminalCommand(cmd);
    await fetchTelemetry();
    await fetchLogs();
    return res;
  };

  const value = {
    telemetry: {
      ...telemetry,
      documents,
      logs,
    },
    isConnected,
    connectionError,
    activeTab,
    setActiveTab,
    isTerminalOpen,
    setIsTerminalOpen,
    toggleTerminal,
    theme,
    toggleTheme,
    // Real API Actions
    startBatch,
    emergencyStop,
    resetSystem,
    setMode,
    feedAdditionalSheet,
    proceedToShred,
    retrieveDocument,
    adminUnlock,
    executeCommand,
    fetchDocuments,
    fetchTelemetry,
  };

  return (
    <PulpContext.Provider value={value}>
      {children}
    </PulpContext.Provider>
  );
}

export function usePulp() {
  const ctx = useContext(PulpContext);
  if (!ctx) {
    throw new Error('usePulp must be used within a PulpProvider');
  }
  return ctx;
}
