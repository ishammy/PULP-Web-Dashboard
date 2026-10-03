# PULP — Web Dashboard & Backend

Recycling & document destruction system: scans confidential paper, saves an encrypted PDF archive, shreds the paper, then pulps & presses it into new recycled institutional sheets.

---

## 🏗 System Structure

```
PULP/
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

Run with `npm run dev -- --host 0.0.0.0 --port 5173`
