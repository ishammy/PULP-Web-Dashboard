import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { API } from '../services/api';

const PulpContext = createContext(null);

const AESTHETIC_ADVANCED = {
  shredder_load_a: 4.8,
  shredder_rpm: 180,
  actuator_force_n: 2450,
  agitator_rpm: 320,
  water_flow_lpm: 1.4,
  water_dispensed_ml: 650,
  water_reclaimed_percent: 88,
  chamber_moisture_rh: 42,
  instantaneous_power_w: 14,
  energy_consumed_wh: 38.6,
  processor_temp_c: 48,
  storage_free_gb: 18.2,
  co2_avoided_g: 142.5
};

const AESTHETIC_TIMELINE = [
  { name: 'System Standby', status: 'Complete', time: '00:00' },
  { name: 'Paper Feeding', status: 'Pending', time: '-' },
  { name: 'Cross-Cut Shredding', status: 'Pending', time: '-' },
  { name: 'Hydraulic Pulper', status: 'Pending', time: '-' },
  { name: 'Pulp Press & Drain', status: 'Pending', time: '-' },
  { name: 'Drying Cycle', status: 'Pending', time: '-' }
];

export function PulpProvider({ children }) {
  // Navigation / Routing state: '/' or '/admin'
  const [currentPath, setCurrentPath] = useState(() => {
    return window.location.pathname.startsWith('/admin') ? '/admin' : '/';
  });

  // Listen to popstate for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname.startsWith('/admin') ? '/admin' : '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path.startsWith('/admin') ? '/admin' : '/');
  };

  // Admin Authentication State
  const [isAdmin, setIsAdmin] = useState(() => Boolean(API.getToken()));

  // Notifications (User facing: GET /api/notifications)
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Wi-Fi (Admin: GET /api/admin/wifi & /api/admin/wifi/devices)
  const [wifi, setWifi] = useState({ isUp: true, msg: 'WiFi is UP' });
  const [wifiDevices, setWifiDevices] = useState([]);

  // Telemetry sensors from WebSocket (/api/admin/status/telemetry)
  const [sensors, setSensors] = useState({
    temp: 32.0,
    water: 78,
    weight: 14
  });

  // Rolling history for live sparkline visualizations (last 20 data points)
  const [sensorHistory, setSensorHistory] = useState(() => {
    const initial = [];
    const now = Date.now();
    for (let i = 12; i >= 0; i--) {
      initial.push({
        time: now - i * 1500,
        temp: 31.8 + Math.sin(i * 0.5) * 0.6,
        water: 78 - Math.floor(i * 0.2),
        weight: 14 + (i % 2 === 0 ? 1 : 0)
      });
    }
    return initial;
  });

  const [telemetryPacketCount, setTelemetryPacketCount] = useState(0);
  const [lastTelemetryPacket, setLastTelemetryPacket] = useState(null);

  // Batch & Statistics from /api/admin/status/batch & /api/admin/status/statistics
  const [batch, setBatch] = useState({ papers: 0 });
  const [statistics, setStatistics] = useState({ papers_processed: 42 });

  // Files catalog (User facing: GET /api/files)
  const [documents, setDocuments] = useState([]);

  // Terminal logs (Admin)
  const [logs, setLogs] = useState([
    {
      level: 'info',
      message: 'Console session active. System operational.',
      time_display: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  // General App State
  const [isConnected, setIsConnected] = useState(false);
  const [mode, setModeState] = useState('Scan-Shred');
  const [theme, setTheme] = useState(() => localStorage.getItem('pulp_theme') || 'light');

  const pollTimerRef = useRef(null);

  // 1. WebSocket Live Telemetry (/api/admin/status/telemetry)
  useEffect(() => {
    const cleanupWs = API.connectTelemetryWebSocket({
      onMessage: (data) => {
        if (data && typeof data === 'object') {
          const newTemp = typeof data.temp === 'number' ? Math.round(data.temp * 10) / 10 : 32.0;
          const newWater = typeof data.water === 'number' ? Math.round(data.water * 10) / 10 : 78;
          const newWeight = typeof data.weight === 'number' ? Math.round(data.weight * 10) / 10 : 14;

          setSensors({
            temp: newTemp,
            water: newWater,
            weight: newWeight
          });

          setSensorHistory(prev => {
            const next = [
              ...prev,
              {
                time: Date.now(),
                temp: newTemp,
                water: newWater,
                weight: newWeight
              }
            ];
            return next.slice(-24); // Keep last 24 points
          });

          setTelemetryPacketCount(c => c + 1);
          setLastTelemetryPacket(new Date());
          setIsConnected(true);
        }
      },
      onStatusChange: (connected) => {
        if (connected) setIsConnected(true);
      }
    });

    return () => {
      cleanupWs();
    };
  }, []);

  // 2. Fetch Notifications (User facing)
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await API.getNotifications();
      if (res.ok) {
        setNotifications(res.notifications);
        setIsConnected(true);
      }
    } catch (_) {}
  }, []);

  // 3. Fetch Files (User facing)
  const fetchFiles = useCallback(async () => {
    try {
      const res = await API.getFiles();
      if (res.ok) {
        const normalized = (res.files || []).map(f => ({
          id: f.id,
          date: f.date,
          doc_id: f.id,
          timestamp: f.date
        }));
        setDocuments(normalized);
        setIsConnected(true);
      }
    } catch (_) {}
  }, []);

  // 4. Fetch Wi-Fi status & devices (Admin feature)
  const fetchWifi = useCallback(async () => {
    try {
      const [wifiRes, devRes] = await Promise.all([
        API.getWifi(),
        API.getWifiDevices()
      ]);
      if (wifiRes.ok) setWifi({ isUp: wifiRes.isUp, msg: wifiRes.msg });
      if (devRes.ok) setWifiDevices(devRes.devices);
    } catch (_) {}
  }, []);

  // 5. Fetch Batch & Statistics (Admin feature)
  const fetchAdminStatus = useCallback(async () => {
    try {
      const [batchRes, statsRes] = await Promise.all([
        API.getBatchStatus(),
        API.getStatistics()
      ]);
      if (batchRes.ok) setBatch(batchRes.batch);
      if (statsRes.ok) setStatistics(statsRes.statistics);
    } catch (_) {}
  }, []);

  // Central Polling Loop
  const pollAllData = useCallback(() => {
    fetchNotifications();
    fetchFiles();
    if (isAdmin) {
      fetchWifi();
      fetchAdminStatus();
    }
  }, [isAdmin, fetchNotifications, fetchFiles, fetchWifi, fetchAdminStatus]);

  useEffect(() => {
    pollAllData();
    pollTimerRef.current = setInterval(pollAllData, 2500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [pollAllData]);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pulp_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleTerminal = () => {
    setIsTerminalOpen(prev => !prev);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(prev => !prev);
  };

  // Admin Login (POST /api/admin/login)
  const loginAdmin = async (username, password) => {
    const res = await API.loginAdmin(username, password);
    if (res.ok) {
      setIsAdmin(true);
      navigate('/admin');
      fetchWifi();
      fetchAdminStatus();
    }
    return res;
  };

  // Admin Logout
  const logoutAdmin = () => {
    API.logoutAdmin();
    setIsAdmin(false);
    setIsTerminalOpen(false);
    navigate('/');
  };

  // Terminal Execution (POST /api/admin/terminal)
  const executeCommand = async (command) => {
    const cmd = String(command).trim();
    if (!cmd) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => [
      ...prev,
      {
        level: 'cmd',
        message: `> ${cmd}`,
        time_display: timeStr
      }
    ]);

    const res = await API.sendTerminalCommand(cmd);

    setLogs(prev => [
      ...prev,
      {
        level: res.ok ? 'success' : 'error',
        message: res.msg || (res.ok ? 'OK' : 'Command error'),
        time_display: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    fetchAdminStatus();
    return res;
  };

  // Hardware Controls (POST /api/admin/terminal)
  const startBatch = async () => {
    return await executeCommand('START_BATCH');
  };

  const emergencyStop = async () => {
    return await executeCommand('END_BATCH');
  };

  const resetSystem = async () => {
    return await executeCommand('RESET');
  };

  const setMode = (newMode) => {
    setModeState(newMode);
  };

  // File Retrieval (POST /api/file)
  const retrieveDocument = async (pin) => {
    return await API.retrieveFile(pin);
  };

  const isBatchActive = batch.papers > 0;
  const dynamicTimeline = AESTHETIC_TIMELINE.map((stage, idx) => {
    if (!isBatchActive) {
      if (idx === 0) return { ...stage, status: 'Complete', time: 'Active' };
      return { ...stage, status: 'Pending', time: '-' };
    } else {
      if (idx === 0) return { ...stage, status: 'Complete', time: '00:00' };
      if (idx === 1) return { ...stage, status: 'In Progress', time: `${batch.papers} sheets` };
      return { ...stage, status: 'Pending', time: '-' };
    }
  });

  const telemetry = {
    status: isBatchActive ? 'PROCESSING' : 'READY',
    current_process: isBatchActive ? 'Processing Batch' : 'Ready',
    mode,
    paper_size: '8.5" x 13"',

    // Live sensor readings
    water_level: sensors.water,
    temperature: sensors.temp,
    weight: sensors.weight,
    sensors: {
      water_level: sensors.water,
      temperature: sensors.temp,
      weight: sensors.weight
    },

    // Batch and totals
    generated_this_batch: batch.papers,
    scanned_pages: batch.papers,
    daily_total: statistics.papers_processed,
    lifetime_total: statistics.papers_processed,
    progress_percent: isBatchActive ? Math.min(100, Math.max(20, batch.papers * 25)) : 0,

    // File archive & console logs
    documents,
    logs,

    // Aesthetic hardware metrics
    advanced: AESTHETIC_ADVANCED,
    timeline: dynamicTimeline,

    // Live Telemetry Stream Metadata & Rolling History
    sensor_history: sensorHistory,
    packet_count: telemetryPacketCount,
    last_packet: lastTelemetryPacket
  };

  const value = {
    // Navigation / Routing
    currentPath,
    navigate,

    // Auth
    isAdmin,
    loginAdmin,
    logoutAdmin,

    // Telemetry & Batch (Admin)
    telemetry,
    batch,
    statistics,
    sensors,
    sensorHistory,
    telemetryPacketCount,
    lastTelemetryPacket,
    isConnected,

    // Wi-Fi (Admin)
    wifi,
    wifiDevices,
    fetchWifi,

    // Terminal & Controls (Admin)
    logs,
    isTerminalOpen,
    toggleTerminal,
    executeCommand,
    startBatch,
    emergencyStop,
    resetSystem,
    setMode,

    // User-Facing Notifications
    notifications,
    isNotificationsOpen,
    toggleNotifications,
    fetchNotifications,

    // User-Facing File Retrieval
    documents,
    retrieveDocument,
    fetchDocuments: fetchFiles,

    // Theme
    theme,
    toggleTheme
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
