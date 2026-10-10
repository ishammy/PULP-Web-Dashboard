import http from 'http';
import { WebSocketServer } from 'ws';

const PORT = 1234;

// Simulation State
let attemptsLeft = 4;
let batchPapers = 6;
let papersProcessed = 42;
let wifiUp = true;
let currentTemp = 32.0;
let currentWater = 78.5;
let currentWeight = 14.2;

// Valid sample PDF in Base64
const SAMPLE_PDF_BASE64 = Buffer.from(
  `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>>>>>/Contents 4 0 R>>endobj
4 0 obj<</Length 124>>stream
BT
/F1 18 Tf
72 720 Td
(PULP RECYCLING SYSTEM - DECRYPTED VAULT ARCHIVE) Tj
0 -36 Td
/F1 12 Tf
(Document ID: 01-0222344 | Status: Confidential Restored) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000052 00000 n 
0000000101 00000 n 
0000000213 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref
389
%%EOF`
).toString('base64');

// Parse request body (JSON or Form-URL-Encoded)
function parseRequestBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        try {
          resolve(JSON.parse(body));
        } catch (_) {
          resolve({});
        }
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const params = new URLSearchParams(body);
        const obj = {};
        for (const [k, v] of params.entries()) {
          obj[k] = v;
        }
        resolve(obj);
      } else {
        try {
          resolve(JSON.parse(body));
        } catch (_) {
          const params = new URLSearchParams(body);
          const obj = {};
          for (const [k, v] of params.entries()) {
            obj[k] = v;
          }
          resolve(obj);
        }
      }
    });
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(payload));
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  const pathname = url.pathname;

  console.log(`[SIMULATOR] ${req.method} ${pathname}`);

  // 1. GET /api/notifications
  if (req.method === 'GET' && pathname === '/api/notifications') {
    return sendJson(res, 200, {
      status: 'ok',
      msg: '',
      notifications: [
        {
          title: 'Motor Overheating',
          description: 'Blender motor overheating at 90'
        },
        {
          title: 'Paper Jam',
          description: 'Shredder stopped working. Turn off device immediately'
        }
      ]
    });
  }

  // 2. GET /api/admin/wifi
  if (req.method === 'GET' && pathname === '/api/admin/wifi') {
    if (url.searchParams.get('status') === 'down') {
      return sendJson(res, 200, { status: 'error', msg: 'WiFi is DOWN' });
    }
    return sendJson(res, 200, { status: 'ok', msg: wifiUp ? 'WiFi is UP' : 'WiFi is DOWN' });
  }

  // 3. GET /api/admin/wifi/devices
  if (req.method === 'GET' && pathname === '/api/admin/wifi/devices') {
    const devices = [
      { mac: '00:00:00:00', ip: '192.168.4.2' },
      { mac: 'b8:27:eb:88:19:22', ip: '192.168.4.3' }
    ];
    return sendJson(res, 200, {
      status: 'ok',
      msg: `${devices.length} devices connected`,
      devices
    });
  }

  // 4. GET /api/files
  if (req.method === 'GET' && pathname === '/api/files') {
    return sendJson(res, 200, {
      status: 'ok',
      msg: '',
      files: [
        { id: '01-0222344', date: '2026-10-10 14:30' },
        { id: '01-0348291', date: '2026-10-10 11:15' },
        { id: '01-0492817', date: '2026-10-09 16:45' },
        { id: '01-0222344', date: '2026-10-10 14:30' },
        { id: '01-0348291', date: '2026-10-10 11:15' },
        { id: '01-0492817', date: '2026-10-09 16:45' },
        { id: '01-0222344', date: '2026-10-10 14:30' },
        { id: '01-0348291', date: '2026-10-10 11:15' },
        { id: '01-0492817', date: '2026-10-09 16:45' },
        { id: '01-0222344', date: '2026-10-10 14:30' },
        { id: '01-0348291', date: '2026-10-10 11:15' },
        { id: '01-0492817', date: '2026-10-09 16:45' },
        { id: '01-0222344', date: '2026-10-10 14:30' },
        { id: '01-0348291', date: '2026-10-10 11:15' },
        { id: '01-0492817', date: '2026-10-09 16:45' }
      ]
    });
  }

  // 5. POST /api/file
  if (req.method === 'POST' && pathname === '/api/file') {
    const body = await parseRequestBody(req);
    const pin = String(body.pin || '').trim();

    if (pin === '123456') {
      attemptsLeft = 4;
      return sendJson(res, 200, {
        status: 'ok',
        msg: 'File decrypted',
        file: SAMPLE_PDF_BASE64
      });
    }

    if (pin === '999999' || attemptsLeft <= 0) {
      return sendJson(res, 419, {
        status: 'error',
        msg: 'You are being rate limited'
      });
    }

    attemptsLeft = Math.max(0, attemptsLeft - 1);
    return sendJson(res, 400, {
      status: 'error',
      msg: `You have ${attemptsLeft} attempts left`
    });
  }

  // 6. POST /api/admin/login
  if (req.method === 'POST' && pathname === '/api/admin/login') {
    const body = await parseRequestBody(req);
    const username = String(body.username || '').trim();
    const password = String(body.password || '').trim();

    if ((username === 'USER' && password === 'PASS') || password === 'admin' || password === 'PASS') {
      return sendJson(res, 200, {
        status: 'ok',
        msg: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTc2MDE1MDAwMH0.signature'
      });
    }

    return sendJson(res, 400, {
      status: 'error',
      msg: 'Wrong password'
    });
  }

  // 7. POST /api/admin/terminal
  if (req.method === 'POST' && pathname === '/api/admin/terminal') {
    const body = await parseRequestBody(req);
    const command = String(body.command || '').trim();

    if (command === 'START_BATCH') {
      batchPapers = Math.max(1, batchPapers + 1);
      return sendJson(res, 200, {
        status: 'ok',
        msg: `ACK,001 (START_BATCH: Sheet ${batchPapers} in progress)`
      });
    }

    if (command === 'END_BATCH') {
      papersProcessed += batchPapers;
      batchPapers = 0;
      return sendJson(res, 200, {
        status: 'ok',
        msg: `ACK,002 (END_BATCH: Total processed: ${papersProcessed})`
      });
    }

    if (command === 'HI') {
      return sendJson(res, 200, {
        status: 'ok',
        msg: 'HELLO,000'
      });
    }

    if (command === 'SET_PIN') {
      return sendJson(res, 200, {
        status: 'ok',
        msg: 'ACK,003 (PIN SET TO 123456)'
      });
    }

    if (command === 'RESET') {
      batchPapers = 0;
      return sendJson(res, 200, {
        status: 'ok',
        msg: 'ACK,004 (SYSTEM RESET TO IDLE)'
      });
    }

    if (command.toLowerCase() === 'status') {
      return sendJson(res, 200, {
        status: 'ok',
        msg: `Batch: ${batchPapers} papers | Total: ${papersProcessed} | Temp: ${currentTemp.toFixed(1)}C | Water: ${currentWater.toFixed(1)}%`
      });
    }

    if (command.toLowerCase() === 'wifi') {
      return sendJson(res, 200, {
        status: 'ok',
        msg: 'wlan0: UP | SSID: PULP-AP-409 | IP: 192.168.4.1 | Clients: 2'
      });
    }

    if (command.toLowerCase() === '/help') {
      return sendJson(res, 200, {
        status: 'ok',
        msg: 'Commands: START_BATCH, END_BATCH, HI, SET_PIN, RESET, status, wifi'
      });
    }

    if (command.toLowerCase().includes('error')) {
      return sendJson(res, 400, {
        status: 'error',
        msg: `NACK,999,Invalid command parameter: ${command}`
      });
    }

    return sendJson(res, 200, {
      status: 'ok',
      msg: `ACK (${command} received)`
    });
  }

  // 8. GET /api/admin/status/batch
  if (req.method === 'GET' && pathname === '/api/admin/status/batch') {
    return sendJson(res, 200, {
      status: 'ok',
      msg: '',
      batch: { papers: batchPapers }
    });
  }

  // 9. GET /api/admin/status/statistics
  if (req.method === 'GET' && pathname === '/api/admin/status/statistics') {
    return sendJson(res, 200, {
      status: 'ok',
      msg: '',
      statistics: { papers_processed: papersProcessed }
    });
  }

  // 404 for unknown endpoints
  return sendJson(res, 404, {
    status: 'error',
    msg: `Endpoint not found: ${pathname}`
  });
});

// WebSocket Server for WEBSOCKET /api/admin/status/telemetry
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws) => {
  console.log('[SIMULATOR] WebSocket telemetry client connected.');

  // Immediate first telemetry frame
  ws.send(JSON.stringify({
    temp: currentTemp,
    water: currentWater,
    weight: currentWeight
  }));

  // Periodic telemetry updates with gentle realistic fluctuations
  const interval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      // Small simulated jitter
      currentTemp = +(32.0 + (Math.random() * 1.2 - 0.6)).toFixed(1);
      currentWater = +(78.0 + (Math.random() * 0.8 - 0.4)).toFixed(1);
      currentWeight = +(14.0 + (batchPapers > 0 ? batchPapers * 4.5 : 0) + (Math.random() * 0.2)).toFixed(1);

      ws.send(JSON.stringify({
        temp: currentTemp,
        water: currentWater,
        weight: currentWeight
      }));
    }
  }, 1500);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('[SIMULATOR] WebSocket telemetry client disconnected.');
  });
});

// HTTP Upgrade to WebSocket
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host || '127.0.0.1'}`);
  if (url.pathname === '/api/admin/status/telemetry') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`=================================================`);
  console.log(` PULP Backend Simulator running on port ${PORT}`);
  console.log(` Proxy target: http://127.0.0.1:${PORT}`);
  console.log(` WebSocket: ws://127.0.0.1:${PORT}/api/admin/status/telemetry`);
  console.log(`=================================================`);
});
