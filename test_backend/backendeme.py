import os
import time
import random
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__)

# =============================================================================
# PHYSICAL RASPBERRY PI OS STORAGE CONFIGURATION
# On Raspberry Pi OS: directory where the scanner saves digitized PDF archives
# (e.g., /home/pi/pulp/vault/ or /var/pulp/vault/)
# =============================================================================
VAULT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vault")
os.makedirs(VAULT_DIR, exist_ok=True)

# =============================================================================
# IN-MEMORY MOCK STATE (Physical Hardware Twin)
# =============================================================================

DEFAULT_STAGES = ["Scanning", "Shredding", "Hydration", "Pulping", "Heat Pressing", "Ejection"]

system_state = {
    "status": "IDLE",                # IDLE, SCANNING, PROCESSING, EMERGENCY_STOP, ERROR
    "mode": "Scan-Shred",            # Scan-Shred, Shred-Only
    "paper_size": '8.5" x 13"',      # Standard institutional dimension
    "progress_percent": 0,
    "current_process": "READY",
    "scanned_pages": 0,
    "awaiting_paper": False,
    "hardware_display_prompt": "",
    "generated_this_batch": 0,
    "daily_total": 0,
    "lifetime_total": 0,
    "security_locked": False,
    "water_level": 50.0,             # % (from XKC-Y25-V sensor)
    "temperature": 25.0,             # °C (from MAX6675 thermocouple)
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
        "total_water_used_ml": 480,
        "drainage_rate_ml_s": 0.0,
        "chamber_relative_humidity_rh": 45.0,
        "instantaneous_power_w": 15,
        "energy_consumed_wh": 34.2,
        "rpi_cpu_temperature_c": 48.5,
        "wifi_signal_rssi_dbm": -58,
        "storage_available_mb": 18450,
        "power_rails": {"v12": 12.08, "v5": 5.04, "v3_3": 3.31}
    },
    "logs": [
        {"time_display": time.strftime("%H:%M:%S"), "level": "info", "message": "PULP Hardware Simulation Core Initialized on Raspberry Pi Zero W."},
        {"time_display": time.strftime("%H:%M:%S"), "level": "info", "message": "Sensors and actuators online on 0.0.0.0:1234."},
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
            "preview_text": "CONFIDENTIAL INSTITUTIONAL REPORT\nFiscal Period: Q1-Q3 2026\nStatus: Pre-shred archive verified.\nHash: 7f8a92...b41c [AES-256-GCM]"
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
            "preview_text": "PURCHASE ORDER: ATX Power Supply, FOTEK SSR-40DA, DN20 Ball Valve, MAX6675 Thermocouple."
        }
    ]
}


def add_log(level: str, message: str):
    """Helper to push messages to the simulated terminal log."""
    log_entry = {
        "time_display": time.strftime("%H:%M:%S"),
        "level": level.lower(),
        "message": message
    }
    system_state["logs"].append(log_entry)
    if len(system_state["logs"]) > 50:
        system_state["logs"].pop(0)


def _set_stage(name: str, status: str, stage_time: str = None):
    """Update status and completion time for a specific stage in operational timeline."""
    for s in system_state["timeline"]:
        if s["name"] == name:
            if s["status"] != status:
                s["status"] = status
                if stage_time and s["time"] == "-":
                    s["time"] = stage_time
                elif status == "Complete" and s["time"] == "-":
                    s["time"] = time.strftime("%H:%M")


# =============================================================================
# REST API ENDPOINTS (Matches static/js/api.js 1-to-1)
# =============================================================================

# 1. getTelemetry() -> GET /api/telemetry (All-in-One Complete Telemetry)
@app.route('/api/telemetry', methods=['GET'])
def get_telemetry():
    now_time = time.strftime("%H:%M")

    # A. AUTOMATED RECYCLING PIPELINE PROGRESSION
    if system_state["status"] == "PROCESSING":
        # Increment progress percent by 2 per poll for smooth dashboard movement
        system_state["progress_percent"] = min(100, system_state["progress_percent"] + 2)
        p = system_state["progress_percent"]

        # Stage 1: Shredding (0% - 20%)
        if p <= 20:
            system_state["current_process"] = "SHREDDING"
            _set_stage("Shredding", "In Progress", now_time)
            system_state["advanced"]["shredder_rpm"] = 3400
            system_state["advanced"]["shredder_motor_current_a"] = round(random.uniform(2.1, 2.5), 2)
            system_state["advanced"]["instantaneous_power_w"] = 380
            system_state["weight"] = max(0.0, system_state["weight"] - random.uniform(0.05, 0.15))

        # Stage 2: Hydration (21% - 40%)
        elif p <= 40:
            system_state["current_process"] = "HYDRATION"
            _set_stage("Shredding", "Complete")
            _set_stage("Hydration", "In Progress", now_time)
            system_state["advanced"]["shredder_rpm"] = 0
            system_state["advanced"]["shredder_motor_current_a"] = 0.05
            system_state["advanced"]["water_flow_rate_lpm"] = 1.8
            system_state["water_level"] = min(90.0, system_state["water_level"] + 1.5)
            system_state["advanced"]["total_water_used_ml"] += 12
            system_state["advanced"]["instantaneous_power_w"] = 45

        # Stage 3: Pulping (41% - 70%)
        elif p <= 70:
            system_state["current_process"] = "PULPING"
            _set_stage("Hydration", "Complete")
            _set_stage("Pulping", "In Progress", now_time)
            system_state["advanced"]["water_flow_rate_lpm"] = 0.0
            system_state["advanced"]["agitator_rpm"] = 1200
            system_state["advanced"]["instantaneous_power_w"] = 210
            system_state["water_level"] = max(35.0, system_state["water_level"] - 0.5)
            system_state["temperature"] = min(48.0, system_state["temperature"] + 0.3)

        # Stage 4: Heat Pressing (71% - 90%)
        elif p <= 90:
            system_state["current_process"] = "HEAT PRESSING"
            _set_stage("Pulping", "Complete")
            _set_stage("Heat Pressing", "In Progress", now_time)
            system_state["advanced"]["agitator_rpm"] = 0
            system_state["advanced"]["press_compression_force_n"] = 1450
            system_state["advanced"]["linear_actuator_position_mm"] = 92
            system_state["advanced"]["drainage_rate_ml_s"] = 16.5
            system_state["temperature"] = min(112.0, system_state["temperature"] + 1.2)
            system_state["advanced"]["chamber_relative_humidity_rh"] = max(20.0, system_state["advanced"]["chamber_relative_humidity_rh"] - 0.6)
            system_state["advanced"]["instantaneous_power_w"] = 520

        # Stage 5: Ejection (91% - 99%)
        elif p < 100:
            system_state["current_process"] = "EJECTION"
            _set_stage("Heat Pressing", "Complete")
            _set_stage("Ejection", "In Progress", now_time)
            system_state["advanced"]["pinch_roller_status"] = "RUNNING"
            system_state["advanced"]["press_compression_force_n"] = 0
            system_state["advanced"]["drainage_rate_ml_s"] = 0.0
            system_state["advanced"]["instantaneous_power_w"] = 65

        # Final: Cycle Finished (100%)
        else:
            _set_stage("Ejection", "Complete", now_time)
            system_state["status"] = "IDLE"
            system_state["current_process"] = "READY"
            system_state["generated_this_batch"] += 1
            system_state["daily_total"] += 1
            system_state["lifetime_total"] += 1
            system_state["advanced"]["pinch_roller_status"] = "IDLE"
            system_state["advanced"]["instantaneous_power_w"] = 15
            system_state["awaiting_paper"] = False
            system_state["hardware_display_prompt"] = ""
            add_log("INFO", f"Batch complete. Recycled sheet #{system_state['generated_this_batch']} (8.5\" x 13\") ejected.")

    # B. SCANNING / PAPER INPUT PHASE (Hardware simulates user sheet feeding & transition)
    elif system_state["status"] == "SCANNING":
        system_state["current_process"] = "SCANNING"
        system_state["awaiting_paper"] = True
        _set_stage("Scanning", "In Progress", now_time)
        system_state["scanning_ticks"] = system_state.get("scanning_ticks", 0) + 1

        # Simulate user paper input on hardware display:
        # Tick 1 (after 2s): User inserts 2nd sheet into the scanner slot
        if system_state["scanning_ticks"] == 1:
            system_state["scanned_pages"] = 2
            doc_id = f"01-{random.randint(1000000, 9999999)}"
            system_state["documents"].insert(0, {
                "doc_id": doc_id,
                "title": f"Pre-Shred Scanned Document - Sheet 2",
                "filename": f"PulpScan_{doc_id}.pdf",
                "scanned_at": time.strftime("%Y-%m-%d %H:%M"),
                "pin": "".join(random.choices("0123456789ABCDEF", k=10)),
                "status": "SECURED_FOR_SHRED",
                "size_kb": random.randint(900, 1800),
                "preview_text": f"DIGITIZED PAGE #2\nOptical Capture Certified (AES-256-GCM)\nVerification Hash: {random.randbytes(16).hex()}"
            })
            system_state["hardware_display_prompt"] = "Sheet #2 scanned. Would you like to input more paper?"
            add_log("SECURITY", f"Sheet #2 scanned (Doc: {doc_id}). Hardware LCD: 'Would you like to input more paper?'")

        # Tick 2 (after 4s): User finishes inputting paper on machine display.
        # The hardware automatically transitions from SCANNING to SHREDDING!
        elif system_state["scanning_ticks"] >= 2:
            system_state["status"] = "PROCESSING"
            system_state["current_process"] = "SHREDDING"
            system_state["awaiting_paper"] = False
            system_state["progress_percent"] = 0
            system_state["hardware_display_prompt"] = "Paper input complete. Commencing mechanical shredding."
            _set_stage("Scanning", "Complete", now_time)
            _set_stage("Shredding", "In Progress", now_time)
            add_log("INFO", f"User confirmed no more paper on hardware display ({system_state['scanned_pages']} total sheets). Transitioning to SHREDDING.")

    # C. IDLE COOL-DOWN
    else:
        system_state["temperature"] += (25.0 - system_state["temperature"]) * 0.02
        system_state["water_level"] += random.uniform(-0.02, 0.02)
        system_state["weight"] += random.uniform(-0.01, 0.01)

    return jsonify({
        "state": system_state["status"],
        "status": system_state["status"],
        "mode": system_state["mode"],
        "paper_size": "8.5\" x 13\"",  # Fixed single size
        "progress_percent": system_state["progress_percent"],
        "current_process": system_state["current_process"],
        "scanned_pages": system_state["scanned_pages"],
        "awaiting_paper": system_state["awaiting_paper"],
        "hardware_display_prompt": system_state["hardware_display_prompt"],
        "generated_this_batch": system_state["generated_this_batch"],
        "daily_total": system_state["daily_total"],
        "lifetime_total": system_state["lifetime_total"],
        "water_level": round(system_state["water_level"], 1),
        "temperature": round(system_state["temperature"], 1),
        "weight": round(system_state["weight"], 1),
        "sensors": {
            "water_level": round(system_state["water_level"], 1),
            "temperature": round(system_state["temperature"], 1),
            "weight": round(system_state["weight"], 1)
        },
        "mechanical": {
            "shredder_motor_current_a": round(system_state["advanced"]["shredder_motor_current_a"], 2),
            "shredder_rpm": system_state["advanced"]["shredder_rpm"],
            "press_compression_force_n": system_state["advanced"]["press_compression_force_n"],
            "linear_actuator_position_mm": system_state["advanced"]["linear_actuator_position_mm"],
            "agitator_rpm": system_state["advanced"]["agitator_rpm"],
            "pinch_roller_status": system_state["advanced"]["pinch_roller_status"]
        },
        "hydration": {
            "water_flow_rate_lpm": system_state["advanced"]["water_flow_rate_lpm"],
            "total_water_used_ml": system_state["advanced"]["total_water_used_ml"],
            "drainage_rate_ml_s": system_state["advanced"]["drainage_rate_ml_s"]
        },
        "thermal": {
            "heating_pad_temp_c": round(system_state["temperature"], 1),
            "chamber_relative_humidity_rh": round(system_state["advanced"]["chamber_relative_humidity_rh"], 1),
            "instantaneous_power_w": system_state["advanced"]["instantaneous_power_w"],
            "energy_consumed_wh": system_state["advanced"]["energy_consumed_wh"]
        },
        "edge_controller": {
            "rpi_cpu_temperature_c": round(system_state["advanced"]["rpi_cpu_temperature_c"] + random.uniform(-0.1, 0.1), 1),
            "wifi_signal_rssi_dbm": system_state["advanced"]["wifi_signal_rssi_dbm"],
            "storage_available_mb": system_state["advanced"]["storage_available_mb"],
            "power_rails": system_state["advanced"]["power_rails"]
        },
        "sustainability": {
            "recycled_paper_sheets": system_state["daily_total"],
            "carbon_avoided_g": round(system_state["daily_total"] * 4.5, 1),
            "water_reclaimed_percent": 65.0
        },
        "timeline": system_state["timeline"],
        "timestamp": time.time()
    })


# 2. startBatch(mode) -> POST /api/control/start
@app.route('/api/control/start', methods=['POST'])
def start_batch():
    if system_state["security_locked"]:
        return jsonify({"status": "error", "message": "System is locked by security protocol. Admin unlock required."}), 403

    # Guard: Reject starting if a batch is already running
    if system_state["status"] in ("PROCESSING", "SCANNING"):
        return jsonify({
            "status": "error",
            "message": "A recycling batch is already in progress. Please wait for completion or trigger Emergency Stop."
        }), 409

    # Guard: Reject starting if Emergency Stop is active
    if system_state["status"] == "EMERGENCY_STOP":
        return jsonify({
            "status": "error",
            "message": "Emergency Stop is active. Reset the safety system before starting a new batch."
        }), 400

    payload = request.get_json(silent=True) or {}
    mode = payload.get("mode", system_state["mode"])
    system_state["mode"] = mode
    now_time = time.strftime("%H:%M")

    # In Scan-Shred mode: User inserts paper sheet by sheet.
    # The machine scans the first sheet and asks if they want to input more.
    if mode == "Scan-Shred":
        system_state["status"] = "SCANNING"
        system_state["current_process"] = "SCANNING"
        system_state["scanned_pages"] = 1
        system_state["scanning_ticks"] = 0
        system_state["awaiting_paper"] = True
        system_state["progress_percent"] = 0
        prompt = "Sheet #1 scanned. Would you like to input more paper?"
        system_state["hardware_display_prompt"] = prompt

        # Reset timeline: Scanning is In Progress, subsequent stages Pending
        system_state["timeline"] = [
            {"name": "Scanning", "status": "In Progress", "time": now_time},
            {"name": "Shredding", "status": "Pending", "time": "-"},
            {"name": "Hydration", "status": "Pending", "time": "-"},
            {"name": "Pulping", "status": "Pending", "time": "-"},
            {"name": "Heat Pressing", "status": "Pending", "time": "-"},
            {"name": "Ejection", "status": "Pending", "time": "-"}
        ]

        # Auto-create first digitized document in vault
        doc_id = f"01-{random.randint(1000000, 9999999)}"
        system_state["documents"].insert(0, {
            "doc_id": doc_id,
            "title": f"Pre-Shred Scanned Document - Sheet 1",
            "filename": f"PulpScan_{doc_id}.pdf",
            "scanned_at": time.strftime("%Y-%m-%d %H:%M"),
            "pin": "".join(random.choices("0123456789ABCDEF", k=10)),
            "status": "SECURED_FOR_SHRED",
            "size_kb": random.randint(900, 1800),
            "preview_text": f"DIGITIZED PAGE #1\nCaptured via Raspberry Pi Camera Module v2\nEncryption: AES-256-GCM\nVerification Hash: {random.randbytes(16).hex()}"
        })

        add_log("SECURITY", f"Sheet #1 scanned & encrypted (Doc: {doc_id}). Hardware LCD: '{prompt}'")
        msg = f"Started Scan-Shred batch. Sheet #1 scanned. Hardware prompt: '{prompt}'"

    # In Shred-Only mode: Skip scanning entirely and start shredding immediately
    else:
        system_state["status"] = "PROCESSING"
        system_state["current_process"] = "SHREDDING"
        system_state["scanned_pages"] = 0
        system_state["awaiting_paper"] = False
        system_state["progress_percent"] = 0
        system_state["hardware_display_prompt"] = ""

        # Reset timeline: Scanning is Skipped, Shredding is In Progress
        system_state["timeline"] = [
            {"name": "Scanning", "status": "Skipped", "time": "-"},
            {"name": "Shredding", "status": "In Progress", "time": now_time},
            {"name": "Hydration", "status": "Pending", "time": "-"},
            {"name": "Pulping", "status": "Pending", "time": "-"},
            {"name": "Heat Pressing", "status": "Pending", "time": "-"},
            {"name": "Ejection", "status": "Pending", "time": "-"}
        ]

        msg = "Started Shred-Only batch. Scanning stage skipped; shredder motor engaged."
        add_log("INFO", msg)

    return jsonify({
        "status": "success",
        "message": msg,
        "system_status": system_state["status"],
        "scanned_pages": system_state["scanned_pages"],
        "hardware_prompt": system_state["hardware_display_prompt"]
    })


# 2a. scanPage() -> POST /api/control/scan-page
@app.route('/api/control/scan-page', methods=['POST'])
def scan_page():
    """Triggered when the user inserts another sheet of paper into the scanner."""
    if system_state["status"] != "SCANNING" and system_state["current_process"] != "SCANNING":
        return jsonify({"status": "error", "message": "Machine is not in paper scanning phase."}), 400

    system_state["scanned_pages"] += 1
    page_num = system_state["scanned_pages"]
    doc_id = f"01-{random.randint(1000000, 9999999)}"

    system_state["documents"].insert(0, {
        "doc_id": doc_id,
        "title": f"Pre-Shred Scanned Document - Sheet {page_num}",
        "filename": f"PulpScan_{doc_id}.pdf",
        "scanned_at": time.strftime("%Y-%m-%d %H:%M"),
        "pin": "".join(random.choices("0123456789ABCDEF", k=10)),
        "status": "SECURED_FOR_SHRED",
        "size_kb": random.randint(900, 1800),
        "preview_text": f"DIGITIZED PAGE #{page_num}\nCaptured via Raspberry Pi Camera Module v2\nEncryption: AES-256-GCM\nVerification Hash: {random.randbytes(16).hex()}"
    })

    prompt = f"Sheet #{page_num} scanned. Would you like to input more paper?"
    system_state["hardware_display_prompt"] = prompt
    add_log("SECURITY", f"Sheet #{page_num} scanned (Doc: {doc_id}). Hardware LCD: '{prompt}'")

    return jsonify({
        "status": "success",
        "scanned_pages": page_num,
        "hardware_prompt": prompt,
        "document_created": doc_id,
        "message": f"Sheet #{page_num} scanned and encrypted successfully."
    })


# 2b. proceedToShred() -> POST /api/control/proceed-to-shred
@app.route('/api/control/proceed-to-shred', methods=['POST'])
def proceed_to_shred():
    """Triggered when user confirms on hardware/UI that they have no more paper to input."""
    if system_state["status"] != "SCANNING" and system_state["current_process"] != "SCANNING":
        return jsonify({"status": "error", "message": "Machine is not in paper input phase."}), 400

    now_time = time.strftime("%H:%M")
    _set_stage("Scanning", "Complete", now_time)
    _set_stage("Shredding", "In Progress", now_time)

    system_state["status"] = "PROCESSING"
    system_state["current_process"] = "SHREDDING"
    system_state["awaiting_paper"] = False
    system_state["progress_percent"] = 0
    system_state["hardware_display_prompt"] = "Paper input closed. Commencing mechanical shredding."

    add_log("INFO", f"User confirmed no more paper ({system_state['scanned_pages']} total sheets). Transitioning to SHREDDING.")

    return jsonify({
        "status": "success",
        "message": f"Paper input finalized with {system_state['scanned_pages']} sheets. Commencing shredding sequence.",
        "scanned_pages": system_state["scanned_pages"],
        "system_status": "PROCESSING",
        "current_process": "SHREDDING"
    })


# 3. emergencyStop() -> POST /api/control/emergency-stop
@app.route('/api/control/emergency-stop', methods=['POST'])
def emergency_stop():
    if system_state["status"] == "EMERGENCY_STOP":
        return jsonify({
            "status": "success",
            "message": "Emergency Stop is already engaged.",
            "system_status": "EMERGENCY_STOP"
        })

    system_state["status"] = "EMERGENCY_STOP"
    system_state["current_process"] = "EMERGENCY_STOP"
    system_state["awaiting_paper"] = False
    system_state["advanced"]["shredder_rpm"] = 0
    system_state["advanced"]["agitator_rpm"] = 0
    system_state["advanced"]["instantaneous_power_w"] = 0

    # Mark active stage in timeline as Halted
    for s in system_state["timeline"]:
        if s["status"] == "In Progress":
            s["status"] = "Halted"

    msg = "EMERGENCY STOP TRIGGERED! All motors, heaters, and actuators halted immediately."
    add_log("CRITICAL", msg)

    return jsonify({
        "status": "success",
        "message": msg,
        "system_status": system_state["status"]
    })


# 4. resetSystem() -> POST /api/control/reset
@app.route('/api/control/reset', methods=['POST'])
def reset_system():
    if system_state["status"] == "IDLE":
        return jsonify({
            "status": "success",
            "message": "System is already IDLE.",
            "system_status": "IDLE"
        })

    system_state["status"] = "IDLE"
    system_state["progress_percent"] = 0
    system_state["current_process"] = "READY"
    system_state["scanned_pages"] = 0
    system_state["scanning_ticks"] = 0
    system_state["awaiting_paper"] = False
    system_state["hardware_display_prompt"] = ""
    system_state["advanced"]["shredder_rpm"] = 0
    system_state["advanced"]["agitator_rpm"] = 0
    system_state["advanced"]["pinch_roller_status"] = "IDLE"

    # Reset all timeline stages to Pending
    for s in system_state["timeline"]:
        s["status"] = "Pending"
        s["time"] = "-"

    msg = "System state reset successfully to IDLE. Actuators homed."
    add_log("INFO", msg)

    return jsonify({
        "status": "success",
        "message": msg,
        "system_status": system_state["status"]
    })


# 5. updateSettings(mode) -> POST /api/control/settings
@app.route('/api/control/settings', methods=['POST'])
def update_settings():
    payload = request.get_json(silent=True) or {}
    if "mode" in payload:
        system_state["mode"] = payload["mode"]

    msg = f"Updated system configuration: Mode={system_state['mode']}"
    add_log("INFO", msg)

    return jsonify({
        "status": "success",
        "message": msg,
        "mode": system_state["mode"],
        "paper_size": "8.5\" x 13\""
    })


# 6. getTerminalLogs() -> GET /api/terminal/logs
@app.route('/api/terminal/logs', methods=['GET'])
def get_terminal_logs():
    return jsonify({
        "status": "success",
        "logs": system_state["logs"]
    })


# 7. sendTerminalCommand(command) -> POST /api/terminal/command
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
        response = f"State: [{system_state['status']}] | Process: [{system_state['current_process']}]\nMode: [{system_state['mode']}] | Paper: {system_state['paper_size']}\nScanned Sheets: {system_state['scanned_pages']} | Progress: {system_state['progress_percent']}%\nTemp: {round(system_state['temperature'], 1)}°C | Water: {round(system_state['water_level'], 1)}% | Weight: {round(system_state['weight'], 1)}g"
    elif cmd_lower in ["/temp", "temp"]:
        response = f"MAX6675 Thermocouple: {round(system_state['temperature'], 1)}°C (Setpoint: 85.0°C)"
    elif cmd_lower in ["/water", "water"]:
        response = f"XKC-Y25-V Fluid Sensor: {round(system_state['water_level'], 1)}%"
    elif cmd_lower in ["/weight", "weight"]:
        response = f"HX711 Load Cell: {round(system_state['weight'], 1)}g"
    elif cmd_lower in ["/help", "help"]:
        response = "Available Commands: /status, /start, /stop, /reset, /temp, /water, /weight, /clear"
    elif cmd_lower in ["/start", "start"]:
        if system_state["status"] in ("PROCESSING", "SCANNING"):
            response = "Error: Batch already in progress. Use /stop first if needed."
        elif system_state["status"] == "EMERGENCY_STOP":
            response = "Error: Emergency Stop active. Use /reset before starting."
        else:
            res_obj = start_batch()
            response = f"Started recycling batch ({system_state['mode']}). Status: {system_state['status']}."
    elif cmd_lower in ["/stop", "stop"]:
        emergency_stop()
        response = "EMERGENCY STOP engaged. All actuators halted."
    elif cmd_lower in ["/reset", "reset"]:
        reset_system()
        response = "System state reset to IDLE."
    elif cmd_lower in ["/scan", "scan"]:
        if system_state["status"] == "SCANNING":
            system_state["scanned_pages"] += 1
            response = f"Sheet #{system_state['scanned_pages']} scanned. Would you like to input more paper?"
        else:
            response = "Error: System not in scanning state. Use /start first."
    elif cmd_lower in ["/shred", "shred"]:
        if system_state["status"] == "SCANNING":
            proceed_to_shred()
            response = f"Paper input finalized. Commencing shredding sequence."
        else:
            response = "Error: System not in scanning state."
    else:
        response = f"Executed shell instruction: '{cmd}'"

    add_log("RESULT", response)

    return jsonify({
        "success": True,
        "status": "success",
        "command": cmd,
        "output": response
    })


# 8. getDocuments(search = '') -> GET /api/documents?search=...
@app.route('/api/documents', methods=['GET'])
def get_documents():
    search = request.args.get("search", "").lower()
    docs = system_state["documents"]

    if search:
        docs = [d for d in docs if search in d["doc_id"].lower() or search in d["title"].lower() or search in d["filename"].lower()]

    sanitized_docs = [
        {
            "doc_id": d["doc_id"],
            "title": d["title"],
            "filename": d["filename"],
            "timestamp": d["scanned_at"],
            "status": d["status"],
            "size_kb": d["size_kb"]
        }
        for d in docs
    ]

    return jsonify({
        "status": "success",
        "total": len(sanitized_docs),
        "documents": sanitized_docs
    })


# 9. retrieveDocument(docId, pin) -> POST /api/documents/retrieve
@app.route('/api/documents/retrieve', methods=['POST'])
def retrieve_document():
    payload = request.get_json(silent=True) or {}
    doc_id = payload.get("doc_id", "")
    pin = str(payload.get("pin", "")).upper()

    doc = next((d for d in system_state["documents"] if d["doc_id"] == doc_id), None)

    if not doc:
        return jsonify({"success": False, "status": "error", "message": f"Document ID '{doc_id}' not found."}), 404

    if doc["pin"].upper() != pin:
        add_log("WARNING", f"Failed retrieval attempt for {doc_id} using invalid PIN.")
        return jsonify({"success": False, "is_locked": False, "message": "Invalid 10-digit hexadecimal PIN."}), 401

    add_log("SECURITY", f"Document {doc_id} decrypted with AES-256-GCM. Download token generated.")

    return jsonify({
        "success": True,
        "status": "success",
        "doc_id": doc_id,
        "title": doc["title"],
        "file_name": doc["filename"],
        "file_size_kb": doc["size_kb"],
        "timestamp": doc["scanned_at"],
        "preview_text": doc.get("preview_text", "PREVIEW: Document content successfully decrypted."),
        "download_url": f"/download/{doc_id}?token=token_hw_{doc_id}_{int(time.time())}",
        "download_token": f"token_hw_{doc_id}_{int(time.time())}",
        "message": "PIN verified successfully. Access granted."
    })


# 9b. Hardware Core PDF File Storage Endpoint
def _ensure_vault_pdf(doc_id: str, title: str):
    """Ensures a real PDF archive file exists on the Raspberry Pi filesystem."""
    file_path = os.path.join(VAULT_DIR, f"{doc_id}.pdf")
    if not os.path.exists(file_path):
        header_text = f"PULP RECYCLING ARCHIVE - DOC ID: {doc_id}"
        meta_text = f"Title: {title} | Encryption: AES-256-GCM | Captured on Raspberry Pi OS"
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


@app.route('/api/documents/download/<doc_id>', methods=['GET'])
def download_hardware_pdf(doc_id):
    """
    Production Raspberry Pi OS Implementation:
    Serves the digitized PDF file directly from the Raspberry Pi's local storage
    (e.g., /home/pi/pulp/vault/<doc_id>.pdf) using Flask's send_from_directory().
    """
    token = request.args.get("token", "")
    doc = next((d for d in system_state["documents"] if d["doc_id"] == doc_id), None)
    title = doc["title"] if doc else f"PULP Digitized Record {doc_id}"

    # Ensure actual file exists on disk in VAULT_DIR
    _ensure_vault_pdf(doc_id, title)

    # Deliver file directly from the Raspberry Pi OS filesystem
    return send_from_directory(
        VAULT_DIR,
        f"{doc_id}.pdf",
        as_attachment=True,
        mimetype="application/pdf"
    )


# 10. getSecurityStatus() -> GET /api/security/status
@app.route('/api/security/status', methods=['GET'])
def get_security_status():
    return jsonify({
        "status": "success",
        "security_locked": system_state["security_locked"],
        "tamper_detected": False,
        "enclosure_closed": True,
        "encryption": "AES-256-GCM"
    })


# 11. adminUnlock() -> POST /api/admin/unlock
@app.route('/api/admin/unlock', methods=['POST'])
def admin_unlock():
    system_state["security_locked"] = False
    if system_state["status"] == "ERROR":
        system_state["status"] = "IDLE"

    msg = "Admin override authorized: Security lock disengaged."
    add_log("SECURITY", msg)

    return jsonify({
        "success": True,
        "status": "success",
        "message": msg,
        "security_locked": False
    })


if __name__ == '__main__':
    print(" * Running Complete Mock Hardware API Server on http://0.0.0.0:1234")
    app.run(host='0.0.0.0', port=1234, debug=True)