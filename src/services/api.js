const API_BASE = '';
const TOKEN_KEY = 'pulp_admin_jwt';

export const API = {
  getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || null;
    } catch (_) {
      return null;
    }
  },

  setToken(token) {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (_) { }
  },

  clearToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (_) { }
  },

  async request(endpoint, options = {}) {
    const method = options.method || 'GET';
    const token = this.getToken();

    const headers = {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    let body = options.body;
    let isUrlEncoded = false;


    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        body = new URLSearchParams(body).toString();
        isUrlEncoded = true;
      } else if (headers['Content-Type'] === 'application/json') {
        body = JSON.stringify(body);
      }
    }

    const fetchOptions = {
      method,
      headers,
      body
    };

    try {
      let response = await fetch(`${API_BASE}${endpoint}`, fetchOptions);


      if (response.status === 415 && isUrlEncoded && typeof options.body === 'object') {
        headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(options.body);
        response = await fetch(`${API_BASE}${endpoint}`, fetchOptions);
      }

      const contentType = response.headers.get('content-type') || '';
      let data = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch (_) {
          data = { msg: text, raw: text };
        }
      }

      return {
        ok: response.ok,
        status: response.status,
        data: data || {}
      };
    } catch (networkError) {
      return {
        ok: false,
        status: 0,
        data: { status: 'error', msg: networkError.message }
      };
    }
  },

  async getNotifications() {
    const res = await this.request('/api/notifications');
    return {
      ok: res.ok,
      status: res.status,
      notifications: Array.isArray(res.data?.notifications) ? res.data.notifications : [],
      msg: res.data?.msg || '',
      raw: res.data
    };
  },


  async getFiles() {
    const res = await this.request('/api/files');
    return {
      ok: res.ok,
      status: res.status,
      files: Array.isArray(res.data?.files) ? res.data.files : [],
      msg: res.data?.msg || '',
      raw: res.data
    };
  },


  async retrieveFile(pin) {
    const res = await this.request('/api/file', {
      method: 'POST',
      body: { pin: String(pin).trim() }
    });
    return {
      ok: res.ok,
      status: res.status,
      data: res.data,
      file: res.data?.file || null,
      msg: res.data?.msg || ''
    };
  },

  async loginAdmin(username, password) {
    const res = await this.request('/api/admin/login', {
      method: 'POST',
      body: { username, password }
    });

    const isSuccess = res.ok && res.data?.status === 'ok';
    if (isSuccess && res.data?.msg) {
      this.setToken(res.data.msg);
    }

    return {
      ok: isSuccess,
      status: res.status,
      token: isSuccess ? res.data?.msg : null,
      msg: res.data?.msg || '',
      raw: res.data
    };
  },

  logoutAdmin() {
    this.clearToken();
  },


  async getWifi() {
    const res = await this.request('/api/admin/wifi');
    const isUp = res.data?.status === 'ok' && !res.data?.msg?.toLowerCase().includes('down');
    return {
      ok: res.ok,
      status: res.status,
      isUp,
      msg: res.data?.msg || (isUp ? 'WiFi is UP' : 'WiFi is DOWN'),
      raw: res.data
    };
  },


  async getWifiDevices() {
    const res = await this.request('/api/admin/wifi/devices');
    return {
      ok: res.ok,
      status: res.status,
      devices: Array.isArray(res.data?.devices) ? res.data.devices : [],
      msg: res.data?.msg || '',
      raw: res.data
    };
  },


  async sendTerminalCommand(command) {
    const res = await this.request('/api/admin/terminal', {
      method: 'POST',
      body: { command }
    });
    return {
      ok: res.ok,
      status: res.status,
      msg: res.data?.msg || (res.ok ? 'Command executed successfully.' : 'Command error'),
      raw: res.data
    };
  },


  async getBatchStatus() {
    const res = await this.request('/api/admin/status/batch');
    return {
      ok: res.ok,
      status: res.status,
      batch: res.data?.batch || { papers: 0 },
      msg: res.data?.msg || '',
      raw: res.data
    };
  },


  async getStatistics() {
    const res = await this.request('/api/admin/status/statistics');
    return {
      ok: res.ok,
      status: res.status,
      statistics: res.data?.statistics || { papers_processed: 0 },
      msg: res.data?.msg || '',
      raw: res.data
    };
  },


  connectTelemetryWebSocket({ onMessage, onStatusChange, onError }) {
    let ws = null;
    let reconnectTimer = null;
    let isDisposed = false;

    const connect = () => {
      if (isDisposed) return;
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host || '127.0.0.1:5173';
        const url = `${protocol}//${host}/api/admin/status/telemetry`;

        ws = new WebSocket(url);

        ws.onopen = () => {
          if (isDisposed) return;
          if (onStatusChange) onStatusChange(true);
        };

        ws.onmessage = (event) => {
          if (isDisposed) return;
          try {
            const data = JSON.parse(event.data);
            if (onMessage) onMessage(data);
          } catch (_) { }
        };

        ws.onerror = (err) => {
          if (isDisposed) return;
          if (onError) onError(err);
        };

        ws.onclose = () => {
          if (isDisposed) return;
          if (onStatusChange) onStatusChange(false);
          reconnectTimer = setTimeout(connect, 2500);
        };
      } catch (_) {
        if (!isDisposed) {
          if (onStatusChange) onStatusChange(false);
          reconnectTimer = setTimeout(connect, 2500);
        }
      }
    };

    connect();

    return () => {
      isDisposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  },

  base64ToPdfBlobUrl(base64Data) {
    if (!base64Data) return null;
    try {
      const cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '').trim();
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (_) {
      return null;
    }
  }
};
