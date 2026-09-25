# PULP Web Dashboard — Developer Guide

---

## 1. Quick Project Map

Here is a quick breakdown of what each file and folder does in this repository:

* **[`app.py`](app.py)**  
  **This is the frontend web server (Flask).**  
  It runs on port `5000`, serves the HTML webpage and static files, and transparently forwards all `/api/*` network requests to whatever backend service is running. You won't need to rewrite frontend code when switching backends—`app.py` handles the forwarding.

* **[`templates/index.html`](templates/index.html)**  
  **This is the entire single-page frontend UI.**  
  It contains:
  * The **Dashboard View** (real-time progress gauge, operational timeline, sensor bars, batch stats, controls, and expandable hardware diagnostics).
  * The **File Retrieval View** (searchable document table and 10-digit PIN passcode entry to download scanned PDFs).
  * The **Terminal Drawer** (slide-down diagnostic console for command line status and logs).

* **[`static/css/dashboard.css`](static/css/dashboard.css)**  
  **This is the styling and layout stylesheet.**  
  Handles the clean typography (Outfit, Plus Jakarta Sans, JetBrains Mono), responsive design, animations, gauge rings, and theme colors.

* **[`static/js/api.js`](static/js/api.js)**  
  **This is the frontend API client.**  
  Contains all browser-side `fetch()` functions (`getTelemetry`, `startBatch`, `emergencyStop`, `retrieveDocument`, etc.) with normalized data handling so the UI never crashes on missing fields.

* **[`test_backend/`](test_backend/)**  
  **⚠️ THIS IS A PLACEHOLDER MOCK BACKEND.**  
  * `test_backend/backendeme.py`: This is a simulated backend server running on port `1234`. It was created **strictly as a temporary placeholder** so the frontend could be built, styled, and tested with realistic data while the actual Raspberry Pi hardware API is being developed.
  * `test_backend/vault/`: A temporary folder simulating the file vault where pre-shred scanned `.pdf` documents are stored.

---

## 2. How the Frontend Works

The frontend was built following three simple design principles:

### A. The Frontend is 100% Presentation
* The browser does **not** simulate timers, physics, or fake percentages.
* All temperatures, water levels, timeline stages, and batch numbers come directly from polling `GET /api/telemetry` every 1.5 seconds.


### B. Two Dedicated Tabs
1. **Dashboard Tab (Will add authentication in the Future Only admins should be able to access this tab):**
   * **Process Gauge & Title:** Displays whether the system is `IDLE`, `SCANNING`, `PROCESSING`, or in `EMERGENCY_STOP`.
   * **Operational Timeline:** Shows each sequential stage (`Scanning`, `Hydration`, `Pulping`, `Heat Pressing`, `Ejection`) and its status (`Pending`, `In Progress`, `Completed`, or `Halted`).
   * **Sensors:** Live percentage and bar meters for Water Level, Chamber Temperature, and Paper Weight.
   * **Advanced Diagnostics Drawer:** Click to expand 12 detailed sensors (motor current, platen stroke, drainage speed, Raspberry Pi CPU temp, Wi-Fi signal, etc.).
2. **File Retrieval Tab (For End Users / Students):**
   * Users click on their scanned document from the list.
   * They enter their 10-digit PIN into the segmented input box.
   * Clicking **Retrieve Scanned PDF** triggers a direct browser download of the `.pdf` file.

### C. Smart Controls & Anti-Spam Safety
* **Start Batch:** Automatically disables as soon as it is clicked to prevent accidental double-clicks or spamming. The backend also rejects requests with `409 Conflict` if a batch is already active.
* **Emergency Stop & Reset Safety:** A single dynamic toggle button. Clicking "Emergency Stop" immediately stops the machine and turns the button into a red "Reset Safety" button. Clicking "Reset Safety" returns the machine to `IDLE`.
* **Single Paper Size:** The machine produces one standard recycled paper size: **`8.5" x 13"`**. No paper size selector is needed.
* **Scanning Phase:** In Scan-Shred mode, progress remains at `0%` while paper is fed, displaying the count of `Scanned Pages`. The machine automatically switches to shredding and pulping once paper feeding is finished, at which point progress moves from 0% to 100%.

---

## 3. How to Run Locally

To test and run the project on your computer:

### Step 1: Start the Placeholder Backend
Open a terminal:
```bash
cd test_backend
python backendeme.py
```
*(Runs on `http://1234` simulating the Raspberry Pi)*

### Step 2: Start the Frontend Web Gateway
Open a second terminal in the project root:
```bash
python app.py
```
*(Runs on `http://localhost:5000`)*

### Step 3: Open in Browser
Visit **`http://localhost:5000`** in your browser:
* Click **Start Batch** to watch the timeline and gauge animate through the stages.
* Click **Emergency Stop** to test the safety halt and reset flow.
* Switch to the **File Retrieval** tab, select document `01-0222344`, click **Test PIN** (fills `1A2B3C4D5E`), and click **Retrieve Scanned PDF** to test downloading the sample PDF.
* Click **Open Terminal** in the top right to test diagnostic commands like `/help` or `/status`.

---

# Backend Placeholders
**Endpoints the Frontend Calls**:
   * `GET /api/telemetry` — Returns current status, sensor readings, progress percentage, and timeline array.
   * `POST /api/control/start` — Starts a cycle (`{"mode": "Scan-Shred" | "Shred-Only"}`).
   * `POST /api/control/emergency-stop` — Immediately de-energizes motors and heaters.
   * `POST /api/control/reset` — Clears safety halt and returns to IDLE.
   * `GET /api/documents` — Returns list of archived document records.
   * `POST /api/documents/retrieve` — Validates document ID and PIN.
   * `GET /api/documents/download/<doc_id>` — Streams the `.pdf` file from disk using Flask `send_from_directory()`.
   * `GET /api/terminal/logs` & `POST /api/terminal/command` — Terminal Commands


---
