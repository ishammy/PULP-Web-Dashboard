# PULP — Web Dashboard & Backend

Recycling & document destruction system: scans confidential paper, saves an encrypted PDF archive, shreds the paper, then pulps & presses it into new recycled institutional sheets.

---

## 🏗 System Structure

```
PULP/
├── backend/
│   ├── server.py               # Hardware simulation
│   ├── requirements.txt       
│   └── vault/                  # Stored pre-shred PDF archives
│
├── src/
│   ├── components/             # UI components 
│   ├── context/PulpContext.jsx 
│   └── services/api.js         # API caller
│
├── index.html
├── package.json
└── vite.config.js              # Proxies /api and /download to :1234
```

### Notes
1. **Frontend**: Calls `GET /api/telemetry` every 1.5s to display live sensors, stages, and stats. Sends actions (`start`, `scan`, `e-stop`, PIN retrieval).
2. **Backend**: Just a simulation of the hardware


---

## 📁 Important Files for Backend

| File | What it does | What to look at |
| :--- | :--- | :--- |
| **`backend/server.py`** | This is where you'll find the sample REST routes. Use this as reference| `get_telemetry()`, `start_batch()`, `retrieve_document()` |
| **`backend/vault/`** | This is where I stored the sample PDF |  |
| **`src/services/api.js`** | The frontend API client. | Look at `normalizeTelemetry()` and the `API` object to see the exact field names the UI expects. |
| **`src/context/PulpContext.jsx`** | Polling frontend updates  | Polling interval is set to 1500ms in `useEffect()`. |
| **`vite.config.js`** | Dev proxy configuration. | Forwards `/api` and `/download` calls from Vite to Flask port `1234`. |

---

## 🔌 API Quick Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/telemetry` | `GET` | Main status endpoint (polled every 1.5s by frontend) |
| `/api/control/start` | `POST` | Starts a cycle (`{"mode": "Scan-Shred"}` or `"Shred-Only"`) |
| `/api/control/scan-page` | `POST` | Simulates scanning another page before shredding |
| `/api/control/proceed-to-shred` | `POST` | Finishes scanning and begins shredding |
| `/api/control/emergency-stop` | `POST` | Cuts power and locks machine to `EMERGENCY_STOP` |
| `/api/control/reset` | `POST` | Resets safety interlocks back to `IDLE` |
| `/api/documents` | `GET` | List of scanned documents (`?search=` optional) |
| `/api/documents/retrieve` | `POST` | Verify 10-char PIN (`{"doc_id": "...", "pin": "..."}`). 3 failed tries = 60s lockout |
| `/download/<doc_id>` | `GET` | Download decrypted PDF from `backend/vault/` pwede natin irequire token dito or siguro diretos nalng natin sa /retrieve tas no need na magclick ng download pdf, possible ba un? |
| `/api/terminal/logs` | `GET` | Get recent log messages (last 60) |
| `/api/terminal/command` | `POST` | Send command string (`/status`, `/start`, `/stop`, `/clear`, etc.) |

---

## Suggestions 

1. Ngaun merong scan feature tas pwede ka mag select ng option here to scan next sheet. Kaso ang issue is diba pang admin lang etong dashboard. So tanggalin ko nalng ba siya and sa machine nalng sila mag pindot pindot
2. If ever ikekeep natin pwede naman natin ichange ung sa start at emergency stop buttons na siguro hindi siya pwede mapindot if hindi authorized. 
3. Yung terminal medyo wala pa siyang kwenta now, Wala pa me maisip other use, pero kung di na natin siya gagamitin palitan ko ung terminal na tab ng "logs". 
4. Pag may commands na us sa terminal, gawin nalng din natin hindi pwede mag input ng certain commands pag hindi authorized.


TLDR; Hide Dashboard sa User or Disable certain controls if di authorized