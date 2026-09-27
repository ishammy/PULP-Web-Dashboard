// PULP Real Backend API Client
// Connects to the backend server running on http://127.0.0.1:1234
// (Routed via Vite dev proxy /api or direct fetch)

const API_BASE = ''; // empty string uses Vite proxy or same-origin /api

async function apiFetch(endpoint, options = {}) {
  const method = options.method || 'GET';
  const fetchOptions = {
    method,
    headers: {
      'Accept': 'application/json',
      ...(options.headers || {})
    }
  };

  if (options.body) {
    fetchOptions.headers['Content-Type'] = 'application/json';
    fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, fetchOptions);
    const contentType = response.headers.get('content-type') || '';
    let data = null;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }
    }

    return {
      ok: response.ok,
      status: response.status,
      data: data
    };
  } catch (networkError) {
    return {
      ok: false,
      status: 0,
      data: { status: 'error', message: networkError.message }
    };
  }
}

function normalizeTelemetry(payload) {
  if (!payload) return null;
  const d = payload.data || payload;

  const water = (d.sensors && typeof d.sensors.water_level === 'number')
    ? d.sensors.water_level
    : (typeof d.water_level === 'number' ? d.water_level : 0);

  const temp = (d.sensors && typeof d.sensors.temperature === 'number')
    ? d.sensors.temperature
    : (typeof d.temperature === 'number' ? d.temperature : 25);

  const weight = (d.sensors && typeof d.sensors.weight === 'number')
    ? d.sensors.weight
    : (typeof d.weight === 'number' ? d.weight : 0);

  return {
    state: d.state || d.status || 'IDLE',
    status: d.status || d.state || 'IDLE',
    mode: d.mode || 'Scan-Shred',
    paper_size: d.paper_size || '8.5" x 13"',
    progress_percent: typeof d.progress_percent === 'number' ? d.progress_percent : 0,
    current_process: d.current_process || 'READY',
    scanned_pages: typeof d.scanned_pages === 'number' ? d.scanned_pages : 0,
    awaiting_paper: Boolean(d.awaiting_paper),
    hardware_display_prompt: d.hardware_display_prompt || '',
    generated_this_batch: typeof d.generated_this_batch === 'number' ? d.generated_this_batch : 0,
    daily_total: typeof d.daily_total === 'number' ? d.daily_total : 0,
    lifetime_total: typeof d.lifetime_total === 'number' ? d.lifetime_total : 0,
    water_level: Math.round(water * 10) / 10,
    temperature: Math.round(temp * 10) / 10,
    weight: Math.round(weight * 10) / 10,
    sensors: {
      water_level: Math.round(water * 10) / 10,
      temperature: Math.round(temp * 10) / 10,
      weight: Math.round(weight * 10) / 10
    },
    mechanical: d.mechanical || null,
    hydration: d.hydration || null,
    thermal: d.thermal || null,
    edge_controller: d.edge_controller || null,
    sustainability: d.sustainability || null,
    timeline: Array.isArray(d.timeline) ? d.timeline : [],
    security_locked: Boolean(d.security_locked),
    timestamp: d.timestamp || Date.now() / 1000
  };
}

export const API = {
  async getTelemetry() {
    const res = await apiFetch('/api/telemetry');
    if (!res.ok) {
      return { success: false, error: res.data?.message || 'Hardware API unreachable' };
    }
    return { success: true, data: normalizeTelemetry(res.data) };
  },

  async startBatch(mode = 'Scan-Shred') {
    const res = await apiFetch('/api/control/start', {
      method: 'POST',
      body: { mode }
    });
    return {
      ok: res.ok,
      status: res.status,
      ...(res.data || {})
    };
  },

  async scanPage() {
    const res = await apiFetch('/api/control/scan-page', {
      method: 'POST',
      body: {}
    });
    return {
      ok: res.ok,
      status: res.status,
      ...(res.data || {})
    };
  },

  async proceedToShred() {
    const res = await apiFetch('/api/control/proceed-to-shred', {
      method: 'POST',
      body: {}
    });
    return {
      ok: res.ok,
      status: res.status,
      ...(res.data || {})
    };
  },

  async emergencyStop() {
    const res = await apiFetch('/api/control/emergency-stop', {
      method: 'POST',
      body: {}
    });
    return {
      ok: res.ok,
      status: res.status,
      ...(res.data || {})
    };
  },

  async resetSystem() {
    const res = await apiFetch('/api/control/reset', {
      method: 'POST',
      body: {}
    });
    return {
      ok: res.ok,
      status: res.status,
      ...(res.data || {})
    };
  },

  async updateSettings(mode) {
    const res = await apiFetch('/api/control/settings', {
      method: 'POST',
      body: { mode }
    });
    return {
      ok: res.ok,
      status: res.status,
      ...(res.data || {})
    };
  },

  async getTerminalLogs() {
    const res = await apiFetch('/api/terminal/logs');
    return res.data?.logs || [];
  },

  async sendTerminalCommand(command) {
    const res = await apiFetch('/api/terminal/command', {
      method: 'POST',
      body: { command }
    });
    return res.data || { success: false, output: 'Failed to communicate with controller.' };
  },

  async getDocuments(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await apiFetch(`/api/documents${query}`);
    return res.data?.documents || [];
  },

  async retrieveDocument(docId, pin) {
    const res = await apiFetch('/api/documents/retrieve', {
      method: 'POST',
      body: { doc_id: docId, pin: pin }
    });
    return res;
  },

  async adminUnlock() {
    const res = await apiFetch('/api/admin/unlock', {
      method: 'POST',
      body: {}
    });
    return res.data || { success: false, message: 'Unlock request failed' };
  }
};
