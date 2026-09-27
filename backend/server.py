import os
import time
import random
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__)

# Storage for digitized pre-shred PDF archives
VAULT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vault")
os.makedirs(VAULT_DIR, exist_ok=True)

# -----------------------------------------------------------------------------
# GLOBAL CORS HEADERS & PREFLIGHT
# -----------------------------------------------------------------------------
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,PUT,POST,DELETE,OPTIONS"
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    return response

@app.route("/", defaults={"path": ""}, methods=["OPTIONS"])
@app.route("/<path:path>", methods=["OPTIONS"])
def handle_options(path):
    return "", 204

# -----------------------------------------------------------------------------
# IN-MEMORY HARDWARE TWIN STATE
# -----------------------------------------------------------------------------
DEFAULT_STAGES = ["Scanning", "Shredding", "Hydration", "Pulping", "Heat Pressing", "Ejection"]

system_state = {
    "status": "IDLE",                # IDLE, SCANNING, PROCESSING, EMERGENCY_STOP, ERROR
    "mode": "Scan-Shred",            # Scan-Shred, Shred-Only
    "paper_size": '8.5" x 13"',      # Standard institutional dimension
    "progress_percent": 0,
    "current_process": "READY",
    "scanned_pages": 0,
    "scanning_ticks": 0,
    "awaiting_paper": False,
    "hardware_display_prompt": "",
    "generated_this_batch": 0,
    "daily_total": 4,
    "lifetime_total": 128,
    "security_locked": False,
    "failed_attempts": 0,
    "lockout_until": 0,
    "water_level": 68.4,             # % (from XKC-Y25-V sensor)
    "temperature": 26.2,             # °C (from MAX6675 thermocouple)
    "weight": 0.0,                   # g (from HX711 load cell)
    "timeline": [
        {"name": "Scanning", "status": "Pending", "time": "-"},
        {"name": "Shredding", "status": "Pending", "time": "-"},
        {"name": "Hydration", "status": "Pending", "time": "-"},
        {"name": "Pulping", "status": "Pending", "time": "-"},
        {"name": "Heat Pressing", "status": "Pending", "time": "-"},
        {"name": "Ejection", "status": "Pending", "time": "-"}
    ],
    "advanced": {
        "shredder_motor_current_a": 0.0,
        "shredder_rpm": 0,
        "press_compression_force_n": 0,
        "linear_actuator_position_mm": 0,
        "agitator_rpm": 0,
        "pinch_roller_status": "IDLE",
        "water_flow_rate_lpm": 0.0,
        "total_water_used_ml": 540,
        "drainage_rate_ml_s": 0.0,
        "chamber_relative_humidity_rh": 42.0,
        "instantaneous_power_w": 14,
        "energy_consumed_wh": 38.6,
        "rpi_cpu_temperature_c": 47.8,
        "wifi_signal_rssi_dbm": -56,
        "storage_available_mb": 18420,
        "power_rails": {"v12": 12.06, "v5": 5.02, "v3_3": 3.31},
        "carbon_avoided_g": 142.5,
        "water_reclaimed_percent": 88.4
    },
    "logs": [
        {"time_display": time.strftime("%H:%M:%S"), "level": "info", "message": "PULP Hardware Core Initialized on Raspberry Pi Controller."},
        {"time_display": time.strftime("%H:%M:%S"), "level": "info", "message": "Sensors and actuators online on port 1234."},
        {"time_display": time.strftime("%H:%M:%S"), "level": "security", "message": "AES-256-GCM hardware crypto acceleration ready."}
    ],
    "documents": [
        {
            "doc_id": "01-0222344",
            "title": "Institutional Financial Assessment 2026",
            "filename": "Financial_Assessment_2026.pdf",
            "scanned_at": "2026-09-25 09:41",
            "pin": "1A2B3C4D5E",
            "status": "DESTROYED",
            "size_kb": 1420,
            "preview_text": "CONFIDENTIAL INSTITUTIONAL REPORT\nFiscal Period: Q1-Q3 2026\nStatus: Pre-shred archive verified.\nHash: 7f8a92...b41c [AES-256-GCM]\nPages: 4 | Security Clearance: Level 3"
        },
        {
            "doc_id": "01-0222345",
            "title": "Department Memorandum - Examination Formats",
            "filename": "Dept_Memo_Exams.pdf",
            "scanned_at": "2026-09-25 08:30",
            "pin": "2B3C4D5E6F",
            "status": "DESTROYED",
            "size_kb": 890,
            "preview_text": "MEMORANDUM NO. 42-2026\nSubject: Final Examination Printing Guidelines.\nDepartment of Computer and Electronics Engineering."
        },
        {
            "doc_id": "01-0222346",
            "title": "Hardware Procurement Requisition Bill",
            "filename": "Hardware_Requisition_Bill.pdf",
            "scanned_at": "2026-09-24 16:15",
            "pin": "3C4D5E6F7A",
            "status": "DESTROYED",
            "size_kb": 2150,
            "preview_text": "PURCHASE ORDER: ATX Power Supply, FOTEK SSR-40DA Solid State Relay,\nDN20 Solenoid Ball Valve, MAX6675 K-Type Thermocouple."
        }
    ]
}

def add_log(level: str, message: str):
    log_entry = {
        "time_display": time.strftime("%H:%M:%S"),
        "level": level.lower(),
        "message": message
    }
    system_state["logs"].append(log_entry)
    if len(system_state["logs"]) > 60:
        system_state["logs"].pop(0)

def _set_stage(name: str, status: str, stage_time: str = None):
    for s in system_state["timeline"]:
        if s["name"] == name:
            s["status"] = status
            if stage_time and s["time"] == "-":
                s["time"] = stage_time
            elif status == "Complete" and s["time"] == "-":
                s["time"] = time.strftime("%H:%M")

def _ensure_vault_pdf(doc_id: str, title: str):
    """Ensures a valid PDF file exists in the vault directory for downloading."""
    file_path = os.path.join(VAULT_DIR, f"{doc_id}.pdf")
    if not os.path.exists(file_path):
        header_text = f"PULP VAULT REPOSITORY - DOC ID: {doc_id}"
        meta_text = f"Title: {title} | AES-256-GCM Verified | PULP v2.0"
        pdf_bytes = (
            b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
            b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
            b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
            b"4 0 obj\n<< /Length 180 >>\nstream\n"
            b"BT /F1 16 Tf 50 720 Td (" + header_text.encode("latin1", "replace") + b") Tj /F1 11 Tf 0 -30 Td (" + meta_text.encode("latin1", "replace") + b") Tj ET\n"
            b"endstream\nendobj\n"
            b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
            b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000476 00000 n \n"
            b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n552\n%%EOF\n"
        )
        with open(file_path, "wb") as f:
            f.write(pdf_bytes)
    return file_path

# -----------------------------------------------------------------------------
# API ENDPOINTS
# -----------------------------------------------------------------------------

# 1. GET /api/telemetry
@app.route('/api/telemetry', methods=['GET'])
def get_telemetry():
    now_time = time.strftime("%H:%M")

    # Check lockout expiry
    if system_state["security_locked"] and time.time() > system_state["lockout_until"]:
        system_state["security_locked"] = False
        system_state["failed_attempts"] = 0
        add_log("SECURITY", "Security lockout expired. PIN entry unlocked.")

    # A. PROCESSING PIPELINE STEPPING
    if system_state["status"] == "PROCESSING":
        system_state["progress_percent"] = min(100, system_state["progress_percent"] + 3)
        p = system_state["progress_percent"]

        # Stage 1: Shredding (0% - 20%)
        if p <= 20:
            system_state["current_process"] = "SHREDDING"
            _set_stage("Shredding", "In Progress", now_time)
            system_state["advanced"]["shredder_rpm"] = 3400 + random.randint(0, 80)
            system_state["advanced"]["shredder_motor_current_a"] = round(random.uniform(2.1, 2.5), 2)
            system_state["advanced"]["instantaneous_power_w"] = 380
            system_state["weight"] = max(0.0, round(system_state["weight"] - 0.2, 1))

        # Stage 2: Hydration (21% - 40%)
        elif p <= 40:
            system_state["current_process"] = "HYDRATION"
            _set_stage("Shredding", "Complete")
            _set_stage("Hydration", "In Progress", now_time)
            system_state["advanced"]["shredder_rpm"] = 0
            system_state["advanced"]["shredder_motor_current_a"] = 0.05
            system_state["advanced"]["water_flow_rate_lpm"] = 1.8
            system_state["water_level"] = min(92.0, round(system_state["water_level"] + 1.2, 1))
            system_state["advanced"]["total_water_used_ml"] += 14
            system_state["advanced"]["instantaneous_power_w"] = 48

        # Stage 3: Pulping (41% - 70%)
        elif p <= 70:
            system_state["current_process"] = "PULPING"
            _set_stage("Hydration", "Complete")
            _set_stage("Pulping", "In Progress", now_time)
            system_state["advanced"]["water_flow_rate_lpm"] = 0.0
            system_state["advanced"]["agitator_rpm"] = 1200 + random.randint(0, 50)
            system_state["advanced"]["instantaneous_power_w"] = 220
            system_state["water_level"] = max(30.0, round(system_state["water_level"] - 0.4, 1))
            system_state["temperature"] = min(50.0, round(system_state["temperature"] + 0.3, 1))

        # Stage 4: Heat Pressing (71% - 90%)
        elif p <= 90:
            system_state["current_process"] = "HEAT PRESSING"
            _set_stage("Pulping", "Complete")
            _set_stage("Heat Pressing", "In Progress", now_time)
            system_state["advanced"]["agitator_rpm"] = 0
            system_state["advanced"]["press_compression_force_n"] = 1450
            system_state["advanced"]["linear_actuator_position_mm"] = 92
            system_state["advanced"]["drainage_rate_ml_s"] = 16.5
            system_state["temperature"] = min(114.0, round(system_state["temperature"] + 1.4, 1))
            system_state["advanced"]["chamber_relative_humidity_rh"] = max(18.0, round(system_state["advanced"]["chamber_relative_humidity_rh"] - 0.8, 1))
            system_state["advanced"]["instantaneous_power_w"] = 530

        # Stage 5: Ejection (91% - 99%)
        elif p < 100:
            system_state["current_process"] = "EJECTION"
            _set_stage("Heat Pressing", "Complete")
            _set_stage("Ejection", "In Progress", now_time)
            system_state["advanced"]["pinch_roller_status"] = "RUNNING"
            system_state["advanced"]["press_compression_force_n"] = 0
            system_state["advanced"]["drainage_rate_ml_s"] = 0.0
            system_state["advanced"]["instantaneous_power_w"] = 62

        # Cycle Finished (100%)
        else:
            _set_stage("Ejection", "Complete", now_time)
            system_state["status"] = "IDLE"
            system_state["current_process"] = "READY"
            system_state["generated_this_batch"] += 1
            system_state["daily_total"] += 1
            system_state["lifetime_total"] += 1
            system_state["advanced"]["pinch_roller_status"] = "IDLE"
            system_state["advanced"]["instantaneous_power_w"] = 14
            system_state["awaiting_paper"] = False
            system_state["hardware_display_prompt"] = ""
            system_state["advanced"]["carbon_avoided_g"] = round(system_state["advanced"]["carbon_avoided_g"] + 24.8, 1)
            add_log("INFO", f"Batch complete. Recycled sheet #{system_state['generated_this_batch']} (8.5\" x 13\") ejected.")

    # B. SCANNING PHASE
    elif system_state["status"] == "SCANNING":
        system_state["current_process"] = "SCANNING"
        system_state["awaiting_paper"] = True
        _set_stage("Scanning", "In Progress", now_time)
        system_state["advanced"]["shredder_rpm"] = 0
        system_state["advanced"]["instantaneous_power_w"] = 28

    # C. IDLE COOL-DOWN
    else:
        system_state["temperature"] = round(system_state["temperature"] + (25.5 - system_state["temperature"]) * 0.03, 1)
        system_state["water_level"] = round(system_state["water_level"] + random.uniform(-0.05, 0.05), 1)
        system_state["advanced"]["shredder_rpm"] = 0
        system_state["advanced"]["agitator_rpm"] = 0
        system_state["advanced"]["shredder_motor_current_a"] = 0.0
        system_state["advanced"]["instantaneous_power_w"] = 12

    # RPi CPU temp variation
    system_state["advanced"]["rpi_cpu_temperature_c"] = round(47.5 + random.uniform(-0.5, 0.5), 1)

    return jsonify({
        "state": system_state["status"],
        "status": system_state["status"],
        "mode": system_state["mode"],
        "paper_size": system_state["paper_size"],
        "progress_percent": system_state["progress_percent"],
        "current_process": system_state["current_process"],
        "scanned_pages": system_state["scanned_pages"],
        "awaiting_paper": system_state["awaiting_paper"],
        "hardware_display_prompt": system_state["hardware_display_prompt"],
        "generated_this_batch": system_state["generated_this_batch"],
        "daily_total": system_state["daily_total"],
        "lifetime_total": system_state["lifetime_total"],
        "security_locked": system_state["security_locked"],
        "lockout_until": system_state["lockout_until"],
        "water_level": system_state["water_level"],
        "temperature": system_state["temperature"],
        "weight": system_state["weight"],
        "sensors": {
            "water_level": system_state["water_level"],
            "temperature": system_state["temperature"],
            "weight": system_state["weight"]
        },
        "mechanical": system_state["advanced"],
        "hydration": {
            "water_flow_rate_lpm": system_state["advanced"]["water_flow_rate_lpm"],
            "total_water_used_ml": system_state["advanced"]["total_water_used_ml"],
            "drainage_rate_ml_s": system_state["advanced"]["drainage_rate_ml_s"]
        },
        "thermal": {
            "heating_pad_temp_c": system_state["temperature"],
            "chamber_relative_humidity_rh": system_state["advanced"]["chamber_relative_humidity_rh"],
            "instantaneous_power_w": system_state["advanced"]["instantaneous_power_w"],
            "energy_consumed_wh": system_state["advanced"]["energy_consumed_wh"]
        },
        "edge_controller": {
            "rpi_cpu_temperature_c": system_state["advanced"]["rpi_cpu_temperature_c"],
            "wifi_signal_rssi_dbm": system_state["advanced"]["wifi_signal_rssi_dbm"],
            "storage_available_mb": system_state["advanced"]["storage_available_mb"],
            "power_rails": system_state["advanced"]["power_rails"]
        },
        "sustainability": {
            "carbon_avoided_g": system_state["advanced"]["carbon_avoided_g"],
            "water_reclaimed_percent": system_state["advanced"]["water_reclaimed_percent"]
        },
        "timeline": system_state["timeline"],
        "timestamp": time.time()
    })

# 2. POST /api/control/start
@app.route('/api/control/start', methods=['POST'])
def start_batch():
    if system_state["security_locked"]:
        return jsonify({"status": "error", "message": "Security lockout engaged. Unlock first."}), 403

    if system_state["status"] in ("PROCESSING", "SCANNING"):
        return jsonify({"status": "error", "message": "Recycling batch already in progress."}), 409

    if system_state["status"] == "EMERGENCY_STOP":
        return jsonify({"status": "error", "message": "Emergency Stop engaged. Reset safety first."}), 400

    payload = request.get_json(silent=True) or {}
    mode = payload.get("mode", system_state["mode"])
    system_state["mode"] = mode
    now_time = time.strftime("%H:%M")

    if mode == "Scan-Shred":
        system_state["status"] = "SCANNING"
        system_state["current_process"] = "SCANNING"
        system_state["scanned_pages"] = 1
        system_state["awaiting_paper"] = True
        system_state["progress_percent"] = 0

        system_state["timeline"] = [
            {"name": "Scanning", "status": "In Progress", "time": now_time},
            {"name": "Shredding", "status": "Pending", "time": "-"},
            {"name": "Hydration", "status": "Pending", "time": "-"},
            {"name": "Pulping", "status": "Pending", "time": "-"},
            {"name": "Heat Pressing", "status": "Pending", "time": "-"},
            {"name": "Ejection", "status": "Pending", "time": "-"}
        ]

        doc_id = f"01-{random.randint(1000000, 9999999)}"
        pin = "".join(random.choices("0123456789ABCDEF", k=10))
        title = f"Pre-Shred Scanned Document - Sheet 1"
        system_state["documents"].insert(0, {
            "doc_id": doc_id,
            "title": title,
            "filename": f"PulpScan_{doc_id}.pdf",
            "scanned_at": time.strftime("%Y-%m-%d %H:%M"),
            "pin": pin,
            "status": "SECURED_FOR_SHRED",
            "size_kb": random.randint(900, 1800),
            "preview_text": f"DIGITIZED PAGE #1\nCaptured via Optical Module\nEncryption: AES-256-GCM\nVerification Hash: {random.randbytes(16).hex()}"
        })
        _ensure_vault_pdf(doc_id, title)
        add_log("SECURITY", f"Sheet #1 scanned & encrypted (Doc: {doc_id}). PIN: {pin}")
        msg = f"Started Scan-Shred cycle. Sheet #1 scanned."

    else:
        system_state["status"] = "PROCESSING"
        system_state["current_process"] = "SHREDDING"
        system_state["scanned_pages"] = 0
        system_state["awaiting_paper"] = False
        system_state["progress_percent"] = 0
        system_state["hardware_display_prompt"] = ""

        system_state["timeline"] = [
            {"name": "Scanning", "status": "Skipped", "time": "-"},
            {"name": "Shredding", "status": "In Progress", "time": now_time},
            {"name": "Hydration", "status": "Pending", "time": "-"},
            {"name": "Pulping", "status": "Pending", "time": "-"},
            {"name": "Heat Pressing", "status": "Pending", "time": "-"},
            {"name": "Ejection", "status": "Pending", "time": "-"}
        ]
        msg = "Started Shred-Only batch. Shredder motor engaged."
        add_log("INFO", msg)

    return jsonify({
        "status": "success",
        "message": msg,
        "system_status": system_state["status"],
        "scanned_pages": system_state["scanned_pages"]
    })

# 3. POST /api/control/scan-page
@app.route('/api/control/scan-page', methods=['POST'])
def scan_page():
    if system_state["status"] != "SCANNING":
        return jsonify({"status": "error", "message": "Machine is not in paper scanning state."}), 400

    system_state["scanned_pages"] += 1
    page_num = system_state["scanned_pages"]
    doc_id = f"01-{random.randint(1000000, 9999999)}"
    pin = "".join(random.choices("0123456789ABCDEF", k=10))
    title = f"Pre-Shred Scanned Document - Sheet {page_num}"

    system_state["documents"].insert(0, {
        "doc_id": doc_id,
        "title": title,
        "filename": f"PulpScan_{doc_id}.pdf",
        "scanned_at": time.strftime("%Y-%m-%d %H:%M"),
        "pin": pin,
        "status": "SECURED_FOR_SHRED",
        "size_kb": random.randint(900, 1800),
        "preview_text": f"DIGITIZED PAGE #{page_num}\nOptical Capture Certified\nAES-256-GCM Integrity OK."
    })
    _ensure_vault_pdf(doc_id, title)
    prompt = f"Sheet #{page_num} scanned. Would you like to input more paper?"
    system_state["hardware_display_prompt"] = prompt
    add_log("SECURITY", f"Sheet #{page_num} scanned (Doc: {doc_id}). PIN: {pin}")

    return jsonify({
        "status": "success",
        "scanned_pages": page_num,
        "hardware_prompt": prompt,
        "document_created": doc_id
    })

# 4. POST /api/control/proceed-to-shred
@app.route('/api/control/proceed-to-shred', methods=['POST'])
def proceed_to_shred():
    if system_state["status"] != "SCANNING":
        return jsonify({"status": "error", "message": "Machine is not in paper input state."}), 400

    now_time = time.strftime("%H:%M")
    _set_stage("Scanning", "Complete", now_time)
    _set_stage("Shredding", "In Progress", now_time)
    system_state["status"] = "PROCESSING"
    system_state["current_process"] = "SHREDDING"
    system_state["awaiting_paper"] = False
    system_state["progress_percent"] = 0
    system_state["hardware_display_prompt"] = "Paper input complete. Commencing mechanical shredding."
    add_log("INFO", f"Paper input closed ({system_state['scanned_pages']} total sheets). Transitioning to SHREDDING.")

    return jsonify({
        "status": "success",
        "message": "Commencing shredding sequence.",
        "scanned_pages": system_state["scanned_pages"]
    })

# 5. POST /api/control/emergency-stop
@app.route('/api/control/emergency-stop', methods=['POST'])
def emergency_stop():
    system_state["status"] = "EMERGENCY_STOP"
    system_state["current_process"] = "HALTED"
    system_state["awaiting_paper"] = False
    system_state["advanced"]["shredder_rpm"] = 0
    system_state["advanced"]["agitator_rpm"] = 0
    system_state["advanced"]["instantaneous_power_w"] = 0

    for s in system_state["timeline"]:
        if s["status"] == "In Progress":
            s["status"] = "Halted"

    msg = "EMERGENCY STOP TRIGGERED: Contactors opened, heaters cut, motors halted."
    add_log("CRITICAL", msg)

    return jsonify({"status": "success", "message": msg, "system_status": "EMERGENCY_STOP"})

# 6. POST /api/control/reset
@app.route('/api/control/reset', methods=['POST'])
def reset_system():
    system_state["status"] = "IDLE"
    system_state["progress_percent"] = 0
    system_state["current_process"] = "READY"
    system_state["scanned_pages"] = 0
    system_state["awaiting_paper"] = False
    system_state["hardware_display_prompt"] = ""
    system_state["advanced"]["shredder_rpm"] = 0
    system_state["advanced"]["agitator_rpm"] = 0
    system_state["advanced"]["pinch_roller_status"] = "IDLE"

    for s in system_state["timeline"]:
        s["status"] = "Pending"
        s["time"] = "-"

    msg = "System safety interlock reset. Returned to IDLE."
    add_log("INFO", msg)
    return jsonify({"status": "success", "message": msg, "system_status": "IDLE"})

# 7. POST /api/control/settings
@app.route('/api/control/settings', methods=['POST'])
def update_settings():
    payload = request.get_json(silent=True) or {}
    if "mode" in payload:
        system_state["mode"] = payload["mode"]
    add_log("INFO", f"Operating mode set to: {system_state['mode']}")
    return jsonify({"status": "success", "mode": system_state["mode"]})

# 8. GET /api/terminal/logs
@app.route('/api/terminal/logs', methods=['GET'])
def get_terminal_logs():
    return jsonify({"status": "success", "logs": system_state["logs"]})

# 9. POST /api/terminal/command
@app.route('/api/terminal/command', methods=['POST'])
def send_terminal_command():
    payload = request.get_json(silent=True) or {}
    cmd = payload.get("command", "").strip()
    if not cmd:
        return jsonify({"status": "error", "message": "Empty command provided."}), 400

    add_log("COMMAND", f"> {cmd}")
    cmd_lower = cmd.lower()

    if cmd_lower in ["/clear", "clear"]:
        system_state["logs"] = []
        return jsonify({"success": True, "output": "CLEAR_COMMAND"})
    elif cmd_lower in ["/status", "status"]:
        response = f"State: [{system_state['status']}] | Process: [{system_state['current_process']}]\nMode: [{system_state['mode']}] | Paper: {system_state['paper_size']}\nSensors: Temp={system_state['temperature']}C | Water={system_state['water_level']}% | Weight={system_state['weight']}g\nDaily Total: {system_state['daily_total']} | Lifetime: {system_state['lifetime_total']}"
    elif cmd_lower in ["/help", "help"]:
        response = "Available Commands: /status, /start, /stop, /reset, /temp, /water, /weight, /scan, /shred, /clear"
    elif cmd_lower in ["/start", "start"]:
        start_batch()
        response = f"Started batch ({system_state['mode']}). Status: {system_state['status']}."
    elif cmd_lower in ["/stop", "stop", "/estop"]:
        emergency_stop()
        response = "Emergency Stop engaged. Motors de-energized."
    elif cmd_lower in ["/reset", "reset"]:
        reset_system()
        response = "System safety interlock reset. Status: IDLE."
    elif cmd_lower in ["/temp", "temp"]:
        response = f"MAX6675 Thermocouple: {system_state['temperature']}C"
    elif cmd_lower in ["/water", "water"]:
        response = f"XKC-Y25-V Fluid Sensor: {system_state['water_level']}%"
    else:
        response = f"Instruction executed: {cmd}"

    add_log("RESULT", response)
    return jsonify({"success": True, "status": "success", "command": cmd, "output": response})

# 10. GET /api/documents
@app.route('/api/documents', methods=['GET'])
def get_documents():
    search = request.args.get("search", "").lower()
    docs = system_state["documents"]
    if search:
        docs = [d for d in docs if search in d["doc_id"].lower() or search in d["title"].lower() or search in d["filename"].lower()]

    sanitized = [
        {
            "doc_id": d["doc_id"],
            "timestamp": d["scanned_at"],
            "status": d["status"]
        }
        for d in docs
    ]
    return jsonify({"status": "success", "total": len(sanitized), "documents": sanitized})

# 11. POST /api/documents/retrieve
@app.route('/api/documents/retrieve', methods=['POST'])
def retrieve_document():
    if system_state["security_locked"]:
        rem = max(0, int(system_state["lockout_until"] - time.time()))
        return jsonify({"success": False, "is_locked": True, "message": f"Security lockout engaged. Try again in {rem}s."}), 403

    payload = request.get_json(silent=True) or {}
    doc_id = payload.get("doc_id", "")
    pin = str(payload.get("pin", "")).upper()

    doc = next((d for d in system_state["documents"] if d["doc_id"] == doc_id), None)
    if not doc:
        return jsonify({"success": False, "message": f"Document ID '{doc_id}' not found."}), 404

    if doc["pin"].upper() != pin:
        system_state["failed_attempts"] += 1
        add_log("WARNING", f"Failed PIN attempt ({system_state['failed_attempts']}/3) for {doc_id}.")
        if system_state["failed_attempts"] >= 3:
            system_state["security_locked"] = True
            system_state["lockout_until"] = time.time() + 60
            add_log("SECURITY", "SECURITY LOCKOUT: 3 failed attempts. Terminal locked for 60s.")
            return jsonify({"success": False, "is_locked": True, "message": "Maximum PIN attempts exceeded. Security lockout engaged for 60 seconds."}), 403
        return jsonify({"success": False, "is_locked": False, "message": f"Invalid PIN. {3 - system_state['failed_attempts']} attempts remaining."}), 401

    system_state["failed_attempts"] = 0
    add_log("SECURITY", f"Document {doc_id} decrypted. Access granted.")
    _ensure_vault_pdf(doc_id, doc.get("title", f"PULP Document {doc_id}"))

    return jsonify({
        "success": True,
        "status": "success",
        "doc_id": doc_id,
        "timestamp": doc["scanned_at"],
        "download_url": f"/download/{doc_id}?token=token_pulp_{doc_id}_{int(time.time())}",
        "message": "PIN verified successfully. Access granted."
    })

# 12. GET /download/<doc_id> and /api/documents/download/<doc_id>
@app.route('/download/<doc_id>', methods=['GET'])
@app.route('/api/documents/download/<doc_id>', methods=['GET'])
def download_pdf(doc_id):
    doc = next((d for d in system_state["documents"] if d["doc_id"] == doc_id), None)
    title = doc["title"] if doc else f"PULP Record {doc_id}"
    _ensure_vault_pdf(doc_id, title)
    return send_from_directory(
        VAULT_DIR,
        f"{doc_id}.pdf",
        as_attachment=True,
        mimetype="application/pdf"
    )

# 13. POST /api/admin/unlock
@app.route('/api/admin/unlock', methods=['POST'])
def admin_unlock():
    system_state["security_locked"] = False
    system_state["failed_attempts"] = 0
    system_state["lockout_until"] = 0
    add_log("SECURITY", "Administrator override: Security lockout cleared.")
    return jsonify({"success": True, "message": "Security lockout cleared."})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 1234))
    print(f" * PULP Hardware Backend API running on http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
