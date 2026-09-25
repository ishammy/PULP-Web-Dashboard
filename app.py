import os
import json
import urllib.request
import urllib.error
from flask import Flask, render_template, request, jsonify

# Set your target physical hardware API base address here
HARDWARE_API_BASE_URL = "http://localhost:1234"

# =============================================================================
# FLASK WEB APPLICATION SETUP (Frontend Host & API Proxy)
# =============================================================================

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['SECRET_KEY'] = 'pulp_iot_secret_2026'
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0


@app.after_request
def add_no_cache_headers(response):

    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response


def forward_to_hardware(path: str, method: str = "GET", payload: dict = None):
    target_url = f"{HARDWARE_API_BASE_URL}{path}"
    headers = {"Content-Type": "application/json"} if payload else {}
    data = json.dumps(payload).encode("utf-8") if payload else None

    try:
        req = urllib.request.Request(target_url, data=data, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return jsonify(body), resp.status
    except urllib.error.HTTPError as err:
        try:
            error_body = json.loads(err.read().decode("utf-8"))
            return jsonify(error_body), err.code
        except Exception:
            return jsonify({"status": "error", "message": f"Hardware HTTP Error {err.code}"}), err.code
    except Exception as err:
        print(f"[API PROXY ERROR] Failed to reach {target_url}: {err}")
        return jsonify({
            "status": "error", 
            "message": f"Hardware unreachable at {HARDWARE_API_BASE_URL}: {err}"
        }), 502


@app.route('/api/telemetry', methods=['GET'])
def api_get_telemetry():
    return forward_to_hardware('/api/telemetry', method='GET')

@app.route('/api/control/start', methods=['POST'])
def api_start_batch():
    payload = request.get_json(silent=True) or {}
    clean_payload = {"mode": payload.get("mode", "Scan-Shred")}
    return forward_to_hardware('/api/control/start', method='POST', payload=clean_payload)

@app.route('/api/control/scan-page', methods=['POST'])
def api_scan_page():
    payload = request.get_json(silent=True) or {}
    return forward_to_hardware('/api/control/scan-page', method='POST', payload=payload)

@app.route('/api/control/proceed-to-shred', methods=['POST'])
def api_proceed_to_shred():
    payload = request.get_json(silent=True) or {}
    return forward_to_hardware('/api/control/proceed-to-shred', method='POST', payload=payload)

@app.route('/api/control/emergency-stop', methods=['POST'])
def api_emergency_stop():
    return forward_to_hardware('/api/control/emergency-stop', method='POST', payload={})

@app.route('/api/control/reset', methods=['POST'])
def api_reset_system():
    return forward_to_hardware('/api/control/reset', method='POST', payload={})

@app.route('/api/control/settings', methods=['POST'])
def api_update_settings():
    payload = request.get_json(silent=True) or {}
    clean_payload = {"mode": payload.get("mode", "Scan-Shred")}
    return forward_to_hardware('/api/control/settings', method='POST', payload=clean_payload)

@app.route('/api/terminal/logs', methods=['GET'])
def api_get_terminal_logs():
    return forward_to_hardware('/api/terminal/logs', method='GET')

@app.route('/api/terminal/command', methods=['POST'])
def api_send_terminal_command():
    payload = request.get_json(silent=True) or {}
    return forward_to_hardware('/api/terminal/command', method='POST', payload=payload)

@app.route('/api/documents', methods=['GET'])
def api_get_documents():
    search = request.args.get('search', '')
    query_param = f"?search={urllib.parse.quote(search)}" if search else ""
    return forward_to_hardware(f'/api/documents{query_param}', method='GET')

@app.route('/api/documents/retrieve', methods=['POST'])
def api_retrieve_document():
    payload = request.get_json(silent=True) or {}
    return forward_to_hardware('/api/documents/retrieve', method='POST', payload=payload)


@app.route('/api/security/status', methods=['GET'])
def api_get_security_status():
    return forward_to_hardware('/api/security/status', method='GET')

@app.route('/api/admin/unlock', methods=['POST'])
def api_admin_unlock():
    return forward_to_hardware('/api/admin/unlock', method='POST', payload={})

@app.route('/download/<doc_id>', methods=['GET'])
@app.route('/api/documents/download/<doc_id>', methods=['GET'])
def download_document(doc_id):
    """Proxies the PDF download request directly to the hardware backend."""
    token = request.args.get('token', '')
    query = f"?token={urllib.parse.quote(token)}" if token else ""
    target_url = f"{HARDWARE_API_BASE_URL}/api/documents/download/{doc_id}{query}"
    try:
        req = urllib.request.Request(target_url, method="GET")
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
            from flask import Response
            return Response(
                data,
                status=resp.status,
                content_type=resp.headers.get("Content-Type", "application/pdf"),
                headers={"Content-Disposition": resp.headers.get("Content-Disposition", f'attachment; filename="{doc_id}.pdf"')}
            )
    except Exception as err:
        return jsonify({"status": "error", "message": f"Hardware file service unreachable: {err}"}), 502


@app.route('/')
def page_dashboard():
    return render_template('index.html', active_tab='dashboard')

@app.route('/retrieval')
def page_retrieval():
    return render_template('index.html', active_tab='retrieval')



if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_DEBUG', 'false').lower() in ('true', '1')
    print(f" * PULP Web Gateway listening on http://0.0.0.0:5000")
    print(f" * Proxying JS API calls to hardware API: {HARDWARE_API_BASE_URL}")
    app.run(host='0.0.0.0', port=5000, debug=debug_mode, threaded=True)