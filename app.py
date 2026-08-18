import json
import os
import sqlite3
from datetime import datetime, timedelta
from io import BytesIO

from flask import Flask, g, jsonify, redirect, render_template, request, send_file, session, url_for
from groq import Groq
from init_db import init_db
from werkzeug.security import check_password_hash, generate_password_hash

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
except ImportError:  # pragma: no cover
    canvas = None
    letter = None

app = Flask(__name__)
init_db()
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY") or os.urandom(32)
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "database.db")
DEMO_USER_EMAIL = "gowthamiproject1@gmail.com"
DEMO_USER_PASSWORD = "123456"
DEMO_USER_ROLE = "Chief Logistics Operator"


# --------------------------------------------------------------------------
# SQLite Database Connection Helper
# --------------------------------------------------------------------------
def get_db():
    """Retrieve or create a SQLite database connection for the current context."""
    try:
        db = getattr(g, "_database", None)
    except RuntimeError:
        db = None

    if db is None:
        db = sqlite3.connect(DB_PATH)
        db.row_factory = sqlite3.Row

        try:
            g._database = db
        except RuntimeError:
            pass

    return db


@app.teardown_appcontext
def close_connection(exception):
    """Close SQLite database connection at the end of request context."""
    db = getattr(g, "_database", None)

    if db is not None:
        db.close()


# --------------------------------------------------------------------------
# Groq API Key Configuration
# --------------------------------------------------------------------------
def get_groq_api_key():
    """
    Safely retrieve the Groq API key from environment variable GROQ_API_KEY.
    Returns the key if found, None otherwise.
    Never returns empty strings; only non-empty keys or None.
    Never exposes the actual key value.
    """
    key = os.getenv("GROQ_API_KEY", "").strip()
    if key:
        return key
    return None


def report_groq_config():
    """
    Report whether GROQ_API_KEY is configured.
    Returns a dict with configuration status (YES/NO only, never the actual key).
    """
    return {
        "groq_api_key_configured": "YES" if os.getenv("GROQ_API_KEY", "").strip() else "NO",
    }


def build_ai_operational_context():
    """Collect current port telemetry context from SQLite for Groq AI prompts."""
    db = get_db()
    cursor = db.cursor()

    vessels = [dict(row) for row in cursor.execute(
        """
        SELECT vessel_id, vessel_name, imo_number, arrival_date, departure_date,
               cargo_capacity, assigned_berth, current_status
        FROM Vessels
        ORDER BY vessel_id ASC
        """
    ).fetchall()]

    cargo = [dict(row) for row in cursor.execute(
        """
        SELECT cargo_id, cargo_type, weight, source, destination,
               assigned_vessel, assigned_yard, current_status
        FROM Cargo
        ORDER BY cargo_id ASC
        """
    ).fetchall()]

    trucks = [dict(row) for row in cursor.execute(
        """
        SELECT truck_id, truck_number, driver_name, cargo_reference, entry_time,
               exit_time, gate_id, gate_status, queue_status
        FROM Trucks
        ORDER BY truck_id ASC
        """
    ).fetchall()]

    berths = [dict(row) for row in cursor.execute(
        """
        SELECT berth_id, berth_name, status, assigned_vessel
        FROM Berths
        ORDER BY berth_id ASC
        """
    ).fetchall()]

    vessel_status_counts = {}
    for vessel in vessels:
        status = (vessel.get("current_status") or "Unknown").strip()
        vessel_status_counts[status] = vessel_status_counts.get(status, 0) + 1

    cargo_status_counts = {}
    for item in cargo:
        status = (item.get("current_status") or "Unknown").strip()
        cargo_status_counts[status] = cargo_status_counts.get(status, 0) + 1

    delayed_cargo = []
    for item in cargo:
        status = str(item.get("current_status") or "").lower()
        if "delay" in status or "hold" in status or "customs" in status or "inspection" in status:
            delayed_cargo.append(
                {
                    "cargo_id": item.get("cargo_id"),
                    "cargo_type": item.get("cargo_type"),
                    "assigned_vessel": item.get("assigned_vessel"),
                    "assigned_yard": item.get("assigned_yard"),
                    "status": item.get("current_status"),
                    "weight": item.get("weight"),
                }
            )

    berth_occupancy = {
        "occupied": sum(1 for berth in berths if str(berth.get("status") or "").lower() == "occupied"),
        "available": sum(1 for berth in berths if str(berth.get("status") or "").lower() == "available"),
        "maintenance": sum(1 for berth in berths if str(berth.get("status") or "").lower() == "maintenance"),
    }

    return {
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "vessels": vessels,
        "cargo": cargo,
        "trucks": trucks,
        "berths": berths,
        "operational_statuses": {
            "vessel_statuses": vessel_status_counts,
            "cargo_statuses": cargo_status_counts,
        },
        "delays": {
            "cargo": delayed_cargo,
            "truck_gate_queues": [
                {
                    "truck_id": truck.get("truck_id"),
                    "truck_number": truck.get("truck_number"),
                    "gate_id": truck.get("gate_id"),
                    "queue_status": truck.get("queue_status"),
                    "gate_status": truck.get("gate_status"),
                }
                for truck in trucks if str(truck.get("queue_status") or "").lower() not in {"", "clear"}
            ],
        },
        "cargo_weights": {
            "total_metric_tons": round(sum(float(item.get("weight") or 0) for item in cargo), 2),
            "largest_shipment": max(cargo, key=lambda item: float(item.get("weight") or 0), default={}) if cargo else {},
        },
        "vessel_assignments": [
            {
                "vessel_name": vessel.get("vessel_name"),
                "assigned_berth": vessel.get("assigned_berth"),
                "current_status": vessel.get("current_status"),
            }
            for vessel in vessels
        ],
        "berth_occupancy": berth_occupancy,
    }


def _groq_error_message(exc):
    """Normalize API exceptions into a user-safe Groq error message."""
    message = str(exc).strip()
    print("[GROQ ERROR]", repr(exc), flush=True)
    lower = message.lower()

    if not message:
        return "The AI service could not answer this request right now. Please try again later."

    if "api key" in lower or "authentication" in lower or "unauthenticated" in lower or "invalid key" in lower or "invalid_api_key" in lower:
        return "The Groq API key appears to be invalid or unauthorized. Check GROQ_API_KEY and try again."

    if "quota" in lower or "rate limit" in lower or "429" in lower or "rate_limit" in lower or "exhausted" in lower:
        return "Groq quota or rate limits have been reached for this account. Please try again later."

    if "timeout" in lower or "timed out" in lower or "network" in lower or "connection" in lower or "unavailable" in lower:
        return "The Groq service could not be reached right now. Please try again later."

    return "The AI service could not answer this request right now. Please try again later."


def generate_ai_chat_response(question, context=None):
    """Generate an AI response using the Groq API on the backend using live port data."""
    if not question or not str(question).strip():
        return {"status": "error", "message": "Please enter a question for the port operations assistant."}

    operational_context = context or build_ai_operational_context()
    api_key = get_groq_api_key()
    if not api_key:
        return {
            "status": "error",
            "message": "AI integration is configured but GROQ_API_KEY is not set in the environment. Configure this environment variable before live Groq responses can be tested.",
        }

    try:
        client = Groq(api_key=api_key)
        prompt = f"""
You are a port operations assistant for Terminal Alpha.
Use the following operational information as your only source of truth.
Do not invent values. If the data is missing, say so clearly.

Port data context:
{json.dumps(operational_context, default=str)}

User question: {question}

Answer the user question using this data. If relevant, include concise operational insights, delays, cargo totals, berth occupancy, and vessel assignments. Keep the answer practical and actionable for a port operator.
"""

        message = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": "You are a port operations assistant. Provide accurate, concise answers based only on the provided port telemetry data."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1024,
        )

        answer = message.choices[0].message.content
        if not answer or not str(answer).strip():
            raise ValueError("Groq returned an empty response.")

        return {
            "status": "success",
            "answer": str(answer).strip(),
            "context_summary": {
                "vessel_count": len(operational_context.get("vessels", [])),
                "cargo_count": len(operational_context.get("cargo", [])),
                "berth_count": len(operational_context.get("berths", [])),
                "truck_count": len(operational_context.get("trucks", [])),
            },
        }
    except Exception as exc:
        return {
            "status": "error",
            "message": _groq_error_message(exc),
        }

def ensure_demo_user():
    """Ensure the single local demo account exists with a secure password hash."""
    db = sqlite3.connect(DB_PATH)
    cursor = db.cursor()

    try:
        cursor.execute(
            "DELETE FROM Users WHERE user_id NOT IN (SELECT MIN(user_id) FROM Users GROUP BY LOWER(username))"
        )

        cursor.execute(
            "SELECT user_id, username, password, role FROM Users WHERE LOWER(username) = LOWER(?)",
            (DEMO_USER_EMAIL,),
        )
        row = cursor.fetchone()

        if row is None:
            cursor.execute(
                "INSERT INTO Users (username, password, role) VALUES (?, ?, ?)",
                (DEMO_USER_EMAIL, generate_password_hash(DEMO_USER_PASSWORD), DEMO_USER_ROLE),
            )
            db.commit()
            return

        if not check_password_hash(row[2], DEMO_USER_PASSWORD):
            cursor.execute(
                "UPDATE Users SET password = ?, role = ? WHERE user_id = ?",
                (generate_password_hash(DEMO_USER_PASSWORD), DEMO_USER_ROLE, row[0]),
            )
            db.commit()

        cursor.execute("DELETE FROM Users WHERE LOWER(username) != LOWER(?)", (DEMO_USER_EMAIL,))
        db.commit()
    finally:
        db.close()
ensure_demo_user()

def authenticate_user(email_or_username, password):
    """Validate the single configured demo account."""
    if not email_or_username or not password:
        return None

    normalized = str(email_or_username).strip().lower()
    db = sqlite3.connect(DB_PATH)
    cursor = db.cursor()

    try:
        cursor.execute(
            "SELECT user_id, username, password, role FROM Users WHERE LOWER(username) = ?",
            (normalized,),
        )
        row = cursor.fetchone()
        if row is None:
            return None

        user_id, username, password_hash, role = row
        if not check_password_hash(password_hash, str(password)):
            return None

        return {"user_id": user_id, "username": username, "role": role}
    finally:
        db.close()


def ensure_db_exists():
    """Ensure database.db exists and the Cargo table is seeded on server startup."""
    if not os.path.exists(DB_PATH):
        init_db()

    try:
        db = sqlite3.connect(DB_PATH)
        cursor = db.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='Cargo'")
        cargo_table_exists = cursor.fetchone() is not None

        if not cargo_table_exists:
            init_db()
            return

        cursor.execute("SELECT COUNT(*) FROM Cargo")
        if cursor.fetchone()[0] == 0:
            init_db()
    except Exception:
        init_db()
    finally:
        try:
            db.close()
        except Exception:
            pass

    ensure_demo_user()


def _parse_project_datetime(value):
    """Normalize a range of project date strings into Python datetime values."""
    if value is None:
        return None

    text = str(value).strip().replace("(EST)", "").replace("(UTC)", "")
    if not text:
        return None

    formats = [
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%b %d, %H:%M",
        "%b %d %H:%M",
        "%b %d, %Y",
        "%b %d %Y",
        "%d-%m-%Y %H:%M",
        "%d-%m-%Y",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue

    return None


def _range_bounds(range_key):
    """Return date range start/end for analytics periods."""
    anchor = datetime(2026, 8, 16, 12, 0, 0)
    range_key = (range_key or "last_30_days").strip().lower()

    if range_key == "today":
        start = datetime(anchor.year, anchor.month, anchor.day, 0, 0, 0)
        end = datetime(anchor.year, anchor.month, anchor.day, 23, 59, 59)
    elif range_key == "last_7_days":
        start = anchor - timedelta(days=6)
        end = anchor
    elif range_key == "last_15_days":
        start = anchor - timedelta(days=14)
        end = anchor
    elif range_key == "last_30_days":
        start = anchor - timedelta(days=29)
        end = anchor
    elif range_key == "aug_2026":
        start = datetime(2026, 8, 1, 0, 0, 0)
        end = datetime(2026, 8, 31, 23, 59, 59)
    else:
        start = anchor - timedelta(days=29)
        end = anchor

    return start, end


def _bucket_labels(start, end, bucket_count):
    if end < start:
        start, end = end, start

    date_labels = []
    delta = (end - start).days + 1
    for idx in range(bucket_count):
        current = start + timedelta(days=(delta * idx) / bucket_count)
        date_labels.append(current.strftime("%b %d"))
    return date_labels


def build_analytics_snapshot(range_key="last_30_days"):
    """Build analytics data for the requested date range from the SQLite project data."""
    db = get_db()
    cursor = db.cursor()

    vessel_rows = cursor.execute(
        """
        SELECT vessel_id, vessel_name, arrival_date, departure_date, cargo_capacity, assigned_berth, current_status
        FROM Vessels
        ORDER BY arrival_date ASC
        """
    ).fetchall()
    cargo_rows = cursor.execute(
        """
        SELECT cargo_id, cargo_type, weight, assigned_vessel, assigned_yard, current_status
        FROM Cargo
        """
    ).fetchall()
    berth_rows = cursor.execute(
        "SELECT berth_id, status, assigned_vessel FROM Berths ORDER BY berth_id ASC"
    ).fetchall()

    start, end = _range_bounds(range_key)
    filtered_vessels = []

    for row in vessel_rows:
        vessel = dict(row)
        arr = _parse_project_datetime(vessel.get("arrival_date"))
        dep = _parse_project_datetime(vessel.get("departure_date"))
        relevant = arr or dep
        if relevant and start <= relevant <= end:
            filtered_vessels.append(vessel)

    if range_key == "today":
        labels = ["00:00", "06:00", "12:00", "18:00"]
        cargo_volume = [0, 0, 0, 0]
        for vessel in filtered_vessels:
            arrival = _parse_project_datetime(vessel.get("arrival_date")) or _parse_project_datetime(vessel.get("departure_date"))
            if not arrival:
                continue
            hour = arrival.hour
            idx = 0 if hour < 6 else 1 if hour < 12 else 2 if hour < 18 else 3
            cargo_volume[idx] += int(vessel.get("cargo_capacity") or 0)
    else:
        if range_key == "last_7_days":
            bucket_count = 7
        elif range_key == "last_15_days":
            bucket_count = 6
        elif range_key == "aug_2026":
            bucket_count = 7
        else:
            bucket_count = 6

        labels = _bucket_labels(start, end, bucket_count)
        cargo_volume = [0 for _ in labels]
        for vessel in filtered_vessels:
            arrival = _parse_project_datetime(vessel.get("arrival_date")) or _parse_project_datetime(vessel.get("departure_date"))
            if not arrival:
                continue
            index = min(len(labels) - 1, max(0, (arrival.date() - start.date()).days))
            cargo_volume[index % len(labels)] += int(vessel.get("cargo_capacity") or 0)

    vessel_category_counts = {"Container": 0, "Bulk": 0, "Tanker": 0, "General": 0}
    for vessel in filtered_vessels:
        name = (vessel.get("vessel_name") or "").lower()
        if any(token in name for token in ["container", "oceanic", "maersk", "cma", "ever", "zephyr", "vessel"]):
            vessel_category_counts["Container"] += 1
        elif any(token in name for token in ["bulk", "voyager", "grain"]):
            vessel_category_counts["Bulk"] += 1
        elif any(token in name for token in ["wave", "tanker", "energy", "liquid", "petro"]):
            vessel_category_counts["Tanker"] += 1
        else:
            vessel_category_counts["General"] += 1

    vessel_movement = {
        "labels": ["Container", "Bulk", "Tanker", "General"],
        "data": [
            vessel_category_counts["Container"],
            vessel_category_counts["Bulk"],
            vessel_category_counts["Tanker"],
            vessel_category_counts["General"],
        ],
    }

    berth_status_counts = {"Occupied": 0, "Available": 0, "Maintenance": 0}
    for row in berth_rows:
        berth_status = (row[1] or "Available").strip()
        berth_status_counts[berth_status] = berth_status_counts.get(berth_status, 0) + 1

    berth_utilization = {
        "labels": ["Occupied", "Available", "Maintenance"],
        "data": [
            berth_status_counts.get("Occupied", 0),
            berth_status_counts.get("Available", 0),
            berth_status_counts.get("Maintenance", 0),
        ],
    }

    yard_blocks = {}
    for row in cargo_rows:
        cargo = dict(row)
        yard = (cargo.get("assigned_yard") or "General").strip()
        if not yard:
            continue
        key = yard.split()[0] + " " + yard.split()[1] if len(yard.split()) > 1 else yard
        yard_blocks[key] = yard_blocks.get(key, 0) + 1

    yard_capacity = {
        "labels": list(yard_blocks.keys())[:6] or ["No data"],
        "data": list(yard_blocks.values())[:6] or [0],
    }

    return {
        "range": range_key,
        "labels": labels,
        "cargoVolume": cargo_volume,
        "vesselMovement": vessel_movement,
        "berthUtilization": berth_utilization,
        "yardCapacity": yard_capacity,
    }


def create_customer_report_record(report_type="Customer Report"):
    """Create a report row for the SQLite Reports table using current project data."""
    db = get_db()
    cursor = db.cursor()

    vessel_count = cursor.execute("SELECT COUNT(*) FROM Vessels").fetchone()[0]
    cargo_count = cursor.execute("SELECT COUNT(*) FROM Cargo").fetchone()[0]
    cargo_total = cursor.execute("SELECT COALESCE(SUM(weight), 0) FROM Cargo").fetchone()[0]
    berth_count = cursor.execute("SELECT COUNT(*) FROM Berths").fetchone()[0]
    occupied_count = cursor.execute("SELECT COUNT(*) FROM Berths WHERE status = 'Occupied'").fetchone()[0]

    generated_date = datetime.now().strftime("%Y-%m-%d")
    report_id = f"REP-{datetime.now().strftime('%Y%m%d')}-{(cursor.execute('SELECT COUNT(*) FROM Reports').fetchone()[0] + 1):03d}"
    title = "Customer Operations Summary Report"
    summary = (
        f"Customer activity snapshot for {generated_date}. {vessel_count} vessels are currently tracked, "
        f"{cargo_count} cargo items are in the operational system, and {occupied_count}/{berth_count} berths are occupied. "
        f"Cargo volume currently recorded is {float(cargo_total):,.1f} MT."
    )

    report_data = {
        "report_type": report_type,
        "generated_date": generated_date,
        "title": title,
        "summary": summary,
        "metrics": {
            "total_vessels": vessel_count,
            "total_cargo_records": cargo_count,
            "total_cargo_mt": round(float(cargo_total), 1),
            "occupied_berths": occupied_count,
            "available_berths": berth_count - occupied_count,
        },
    }

    return {
        "report_id": report_id,
        "report_type": report_type,
        "generated_date": generated_date,
        "title": title,
        "summary": summary,
        "report_data": json.dumps(report_data),
    }


def _render_pdf_report(report_id, report_data_dict):
    """Generate a PDF from the report payload in memory and return the PDF bytes."""
    if canvas is None:
        raise RuntimeError("reportlab is not installed in the current environment.")

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    pdf.setTitle(report_id)
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(72, 750, "Smart Port Logistics - Operational Report")
    pdf.setFont("Helvetica", 11)
    pdf.drawString(72, 730, f"Report ID: {report_id}")
    pdf.drawString(72, 714, f"Generated: {report_data_dict.get('generated_date', '')}")
    pdf.drawString(72, 698, f"Type: {report_data_dict.get('report_type', 'Customer Report')}")

    lines = [
        "Summary:",
        report_data_dict.get("summary", "No summary available."),
        "",
        "Metrics:",
    ]
    for key, value in (report_data_dict.get("metrics") or {}).items():
        lines.append(f"- {key.replace('_', ' ').title()}: {value}")

    y = 660
    for line in lines:
        if y < 72:
            pdf.showPage()
            y = 750
        pdf.drawString(72, y, line[:100])
        y -= 18

    pdf.save()
    buffer.seek(0)
    return buffer.getvalue()


# --------------------------------------------------------------------------
# Authentication Routes
# --------------------------------------------------------------------------
@app.route("/")
def home():
    """Render the login page when logged out, otherwise show the main app."""
    if not session.get("user_id"):
        return redirect(url_for("login_page"))
    return render_template(
        "index.html",
        current_user={
            "email": session.get("username"),
            "role": session.get("role"),
            "full_name": session.get("full_name") or "Gowthami Latha",
        },
    )


@app.route("/login", methods=["GET", "POST"])
def login_page():
    """Render the branded login page or process the single demo-user login."""
    if session.get("user_id"):
        return redirect(url_for("home"))

    if request.method == "POST":
        email = str(request.form.get("email") or "").strip()
        password = str(request.form.get("password") or "")
        user = authenticate_user(email, password)

        if user is None:
            return render_template("login.html", error="Invalid email or password")

        session.clear()
        session["user_id"] = user["user_id"]
        session["username"] = user["username"]
        session["role"] = user["role"]
        session["full_name"] = "Gowthami Latha"
        return redirect(url_for("home"))

    return render_template("login.html")


@app.route("/api/login", methods=["POST"])
def api_login():
    """JSON login endpoint for the branded login page."""
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email") or payload.get("username") or "").strip()
    password = str(payload.get("password") or "")
    user = authenticate_user(email, password)

    if user is None:
        return jsonify({"status": "error", "message": "Invalid email or password"}), 401

    session.clear()
    session["user_id"] = user["user_id"]
    session["username"] = user["username"]
    session["role"] = user["role"]
    session["full_name"] = "Gowthami Latha"

    return jsonify({
        "status": "success",
        "message": "Login successful",
        "redirect": url_for("home"),
        "user": {"email": user["username"], "role": user["role"]},
    })


@app.route("/api/logout", methods=["POST"])
def api_logout():
    """Log out the current session."""
    session.clear()
    return jsonify({"status": "success", "redirect": url_for("login_page")})


@app.route("/logout")
def logout():
    """Clear the session and return to the login screen."""
    session.clear()
    return redirect(url_for("login_page"))


# --------------------------------------------------------------------------
# Application Routes
# --------------------------------------------------------------------------


# --------------------------------------------------------------------------
# Database Test API
# --------------------------------------------------------------------------
@app.route("/api/test-db")
def test_db():
    """Diagnostic endpoint to verify Flask connection to SQLite database.db."""
    try:
        db = get_db()
        cursor = db.cursor()

        tables = ["Vessels", "Cargo", "Trucks", "Berths", "Reports", "Users"]
        table_counts = {}

        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            table_counts[table] = cursor.fetchone()[0]

        return jsonify(
            {
                "status": "success",
                "message": "Flask successfully connected to SQLite database.db",
                "database_path": DB_PATH,
                "table_counts": table_counts,
            }
        )

    except Exception as e:
        return jsonify(
            {
                "status": "error",
                "message": str(e),
            }
        ), 500


# --------------------------------------------------------------------------
# Vessel Management API Endpoints
# --------------------------------------------------------------------------
@app.route("/api/vessels", methods=["GET"])
def get_vessels():
    """Retrieve all vessel records from SQLite database.db."""
    try:
        db = get_db()
        cursor = db.cursor()

        cursor.execute(
            """
            SELECT vessel_id,
                   vessel_name,
                   imo_number,
                   arrival_date,
                   departure_date,
                   cargo_capacity,
                   assigned_berth,
                   current_status
            FROM Vessels
            ORDER BY vessel_id ASC
            """
        )

        rows = cursor.fetchall()
        vessels = [dict(row) for row in rows]

        return jsonify(
            {
                "status": "success",
                "vessels": vessels,
            }
        )

    except Exception as e:
        return jsonify(
            {
                "status": "error",
                "message": str(e),
            }
        ), 500


@app.route("/api/vessels", methods=["POST"])
def add_vessel():
    """Add a new vessel record to SQLite database.db using parameterized queries."""
    try:
        data = request.get_json() or {}

        vessel_name = str(data.get("vessel_name", "")).strip()
        imo_number = str(data.get("imo_number", "")).strip()
        arrival_date = str(data.get("arrival_date", "")).strip()
        departure_date = str(data.get("departure_date", "")).strip()
        cargo_capacity_raw = data.get("cargo_capacity")
        assigned_berth = str(data.get("assigned_berth", "")).strip()
        current_status = str(data.get("current_status", "")).strip()

        # Validation
        if not all(
            [
                vessel_name,
                imo_number,
                arrival_date,
                departure_date,
                cargo_capacity_raw,
                assigned_berth,
                current_status,
            ]
        ):
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "All fields are required. Please complete all form inputs.",
                    }
                ),
                400,
            )

        try:
            cargo_capacity = int(cargo_capacity_raw)

            if cargo_capacity <= 0:
                raise ValueError()

        except (ValueError, TypeError):
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Cargo capacity must be a positive number.",
                    }
                ),
                400,
            )

        db = get_db()
        cursor = db.cursor()

        # Generate vessel ID automatically if not provided
        vessel_id = data.get("vessel_id")

        if not vessel_id:
            cursor.execute("SELECT COUNT(*) FROM Vessels")
            count = cursor.fetchone()[0]
            vessel_id = f"VSL-{101 + count}"

        # Insert vessel using parameterized query
        cursor.execute(
            """
            INSERT INTO Vessels (
                vessel_id,
                vessel_name,
                imo_number,
                arrival_date,
                departure_date,
                cargo_capacity,
                assigned_berth,
                current_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                vessel_id,
                vessel_name,
                imo_number,
                arrival_date,
                departure_date,
                cargo_capacity,
                assigned_berth,
                current_status,
            ),
        )

        db.commit()

        return (
            jsonify(
                {
                    "status": "success",
                    "message": f"Vessel '{vessel_name}' ({vessel_id}) registered successfully!",
                    "vessel": {
                        "vessel_id": vessel_id,
                        "vessel_name": vessel_name,
                        "imo_number": imo_number,
                        "arrival_date": arrival_date,
                        "departure_date": departure_date,
                        "cargo_capacity": cargo_capacity,
                        "assigned_berth": assigned_berth,
                        "current_status": current_status,
                    },
                }
            ),
            201,
        )

    except sqlite3.IntegrityError as e:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": f"Database integrity error: {str(e)}",
                }
            ),
            400,
        )

    except Exception as e:
        return jsonify(
            {
                "status": "error",
                "message": str(e),
            }
        ), 500


# --------------------------------------------------------------------------
# Cargo Management API Endpoints
# --------------------------------------------------------------------------
@app.route("/api/cargo", methods=["GET"])
def get_cargo():
    """Retrieve all cargo records from SQLite database.db."""
    try:
        db = get_db()
        cursor = db.cursor()

        cursor.execute(
            """
            SELECT cargo_id,
                   cargo_type,
                   weight,
                   source,
                   destination,
                   assigned_vessel,
                   assigned_yard,
                   current_status
            FROM Cargo
            ORDER BY cargo_id ASC
            """
        )

        rows = cursor.fetchall()
        cargo = [dict(row) for row in rows]

        return jsonify(
            {
                "status": "success",
                "cargo": cargo,
            }
        )

    except Exception as e:
        return jsonify(
            {
                "status": "error",
                "message": str(e),
            }
        ), 500


@app.route("/api/cargo", methods=["POST"])
def add_cargo():
    """Add a new cargo record to SQLite database.db."""
    try:
        data = request.get_json() or {}

        cargo_id = str(data.get("cargo_id", "")).strip()
        cargo_type = str(data.get("cargo_type", "")).strip()
        weight_raw = data.get("weight")
        source = str(data.get("source", "")).strip()
        destination = str(data.get("destination", "")).strip()
        assigned_vessel = str(data.get("assigned_vessel", "")).strip()
        assigned_yard = str(data.get("assigned_yard", "")).strip()
        current_status = str(data.get("current_status", "")).strip()

        # Validation
        if not all(
            [
                cargo_id,
                cargo_type,
                weight_raw,
                source,
                destination,
                assigned_vessel,
                assigned_yard,
                current_status,
            ]
        ):
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "All cargo fields are required.",
                    }
                ),
                400,
            )

        try:
            weight = float(weight_raw)

            if weight <= 0:
                raise ValueError()

        except (ValueError, TypeError):
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Cargo weight must be a positive number.",
                    }
                ),
                400,
            )

        db = get_db()
        cursor = db.cursor()

        # Insert cargo using parameterized query
        cursor.execute(
            """
            INSERT INTO Cargo (
                cargo_id,
                cargo_type,
                weight,
                source,
                destination,
                assigned_vessel,
                assigned_yard,
                current_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                cargo_id,
                cargo_type,
                weight,
                source,
                destination,
                assigned_vessel,
                assigned_yard,
                current_status,
            ),
        )

        db.commit()

        return (
            jsonify(
                {
                    "status": "success",
                    "message": f"Cargo '{cargo_id}' registered successfully!",
                    "cargo": {
                        "cargo_id": cargo_id,
                        "cargo_type": cargo_type,
                        "weight": weight,
                        "source": source,
                        "destination": destination,
                        "assigned_vessel": assigned_vessel,
                        "assigned_yard": assigned_yard,
                        "current_status": current_status,
                    },
                }
            ),
            201,
        )

    except sqlite3.IntegrityError as e:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": f"Database integrity error: {str(e)}",
                }
            ),
            400,
        )

    except Exception as e:
        return jsonify(
            {
                "status": "error",
                "message": str(e),
            }
        ), 500


@app.route("/api/analytics", methods=["GET"])
def get_analytics():
    """Return analytics snapshot data for the selected date range."""
    range_key = request.args.get("range", "last_30_days")
    return jsonify({"status": "success", "analytics": build_analytics_snapshot(range_key)})


@app.route("/api/ai/config", methods=["GET"])
def ai_config():
    """Return safe diagnostic information about Groq API key configuration."""
    config = report_groq_config()
    return jsonify({
        "status": "success",
        "configuration": config,
        "message": "See 'configuration' for environment variable status. GROQ_API_KEY must be set for the AI Assistant to function.",
    })


@app.route("/api/ai/chat", methods=["POST"])
def ai_chat():
    """Accept a natural-language question and return Groq's answer from the backend."""
    try:
        payload = request.get_json(silent=True) or {}
        question = str(payload.get("question") or payload.get("query") or "").strip()

        if not question:
            return jsonify({"status": "error", "message": "Please provide a question for the AI assistant."}), 400

        result = generate_ai_chat_response(question)
        if result.get("status") == "success":
            return jsonify(result)

        return jsonify(result), 500 if "not set" in result.get("message", "") or "could not answer" in result.get("message", "").lower() else 400
    except Exception:
        return jsonify({"status": "error", "message": "The AI service could not process this request."}), 500


@app.route("/api/reports", methods=["GET"])
def get_reports():
    """Return persisted reports in the SQLite Reports table."""
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            """
            SELECT report_id, report_type, generated_date, report_data
            FROM Reports
            ORDER BY generated_date DESC, report_id DESC
            """
        )
        rows = cursor.fetchall()
        reports = []
        for row in rows:
            payload = json.loads(row[3]) if row[3] else {}
            reports.append(
                {
                    "id": row[0],
                    "type": row[1],
                    "dateGenerated": row[2],
                    "title": payload.get("title", row[1]),
                    "summary": payload.get("summary", ""),
                    "totalCargoMT": f"{float(payload.get('metrics', {}).get('total_cargo_mt', 0)):,.1f} MT",
                    "efficiencyScore": "N/A",
                    "author": "Port Ops Operations",
                    "period": payload.get("generated_date", row[2]),
                }
            )
        return jsonify({"status": "success", "reports": reports})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/reports", methods=["POST"])
def create_report():
    """Create a real customer report and persist it to SQLite."""
    try:
        report_payload = create_customer_report_record()
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            """
            INSERT INTO Reports (report_id, report_type, generated_date, report_data)
            VALUES (?, ?, ?, ?)
            """,
            (
                report_payload["report_id"],
                report_payload["report_type"],
                report_payload["generated_date"],
                report_payload["report_data"],
            ),
        )
        db.commit()
        return jsonify({"status": "success", "report": report_payload}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/reports/<report_id>/pdf", methods=["GET"])
def download_report_pdf(report_id):
    """Generate and download an actual PDF for the selected report."""
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            "SELECT report_id, report_type, generated_date, report_data FROM Reports WHERE report_id = ?",
            (report_id,),
        )
        row = cursor.fetchone()
        if row is None:
            return jsonify({"status": "error", "message": f"Report '{report_id}' was not found."}), 404

        report_data = json.loads(row[3]) if row[3] else {}
        pdf_bytes = _render_pdf_report(row[0], report_data)
        return send_file(
            BytesIO(pdf_bytes),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"{row[0]}.pdf",
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/berths/<berth_id>/assign", methods=["POST"])
def assign_berth_schedule(berth_id):
    """Assign a vessel to a berth and update its arrival/departure schedule."""
    try:
        data = request.get_json() or {}

        vessel_id = str(data.get("vessel_id", "")).strip()
        arrival_date = str(data.get("arrival_date", "")).strip()
        departure_date = str(data.get("departure_date", "")).strip()

        if not all([vessel_id, berth_id, arrival_date, departure_date]):
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Vessel, berth, arrival time, and departure time are required.",
                    }
                ),
                400,
            )

        db = get_db()
        cursor = db.cursor()

        cursor.execute(
            "SELECT vessel_name FROM Vessels WHERE vessel_id = ?",
            (vessel_id,),
        )
        row = cursor.fetchone()
        if row is None:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": f"Vessel '{vessel_id}' was not found.",
                    }
                ),
                404,
            )

        vessel_name = row[0]

        cursor.execute(
            """
            UPDATE Vessels
            SET assigned_berth = ?,
                arrival_date = ?,
                departure_date = ?,
                current_status = ?
            WHERE vessel_id = ?
            """,
            (
                berth_id,
                arrival_date,
                departure_date,
                "Docked",
                vessel_id,
            ),
        )

        cursor.execute(
            """
            UPDATE Berths
            SET assigned_vessel = ?,
                status = ?
            WHERE berth_id = ?
            """,
            (
                vessel_name,
                "Occupied",
                berth_id,
            ),
        )

        db.commit()

        return jsonify(
            {
                "status": "success",
                "message": f"Berth '{berth_id}' reassigned to vessel '{vessel_id}' successfully.",
                "berth_id": berth_id,
                "vessel_id": vessel_id,
                "arrival_date": arrival_date,
                "departure_date": departure_date,
            }
        )

    except Exception as e:
        return jsonify(
            {
                "status": "error",
                "message": str(e),
            }
        ), 500


# --------------------------------------------------------------------------
# Start Flask Application
# --------------------------------------------------------------------------
if __name__ == "__main__":
    ensure_db_exists()
    
    # Log Groq API key configuration status at startup
    config = report_groq_config()
    print(f"[Startup] Groq API Configuration: {config}")
    if config['groq_api_key_configured'] == 'NO':
        print("[Warning] GROQ_API_KEY is not configured. AI Assistant will not function.")
    else:
        print("[OK] Using GROQ_API_KEY for AI Assistant.")
    
    app.run(debug=True)