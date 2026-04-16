from fastapi import FastAPI
from pathlib import Path
from threading import Lock
import subprocess
import sys

from app.database import init_db, get_connection

from app.model import predict

from app.schemas import LogInput, SettingsInput

from app.email_service import send_email
from fastapi.middleware.cors import CORSMiddleware

from app.geoip import get_location


app = FastAPI()

simulator_process = None
simulator_lock = Lock()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True
)


init_db()


def get_setting(key):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute(

        "SELECT value FROM system_settings WHERE key=?",

        (key,)

    )

    val = cur.fetchone()

    conn.close()

    return val["value"] if val else None


def set_setting(key,value):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute("""

    INSERT INTO system_settings(key,value)

    VALUES(?,?)

    ON CONFLICT(key)

    DO UPDATE SET value=excluded.value

    """,(key,str(value)))

    conn.commit()

    conn.close()


def _simulator_script_path():
    return Path(__file__).resolve().parent.parent / "simulator.py"


def _simulator_running():
    return simulator_process is not None and simulator_process.poll() is None


# change email from dashboard

@app.put("/api/settings")

def update_settings(data:SettingsInput):

    if data.admin_email:

        set_setting(

            "admin_email",

            data.admin_email

        )


    if data.alert_threshold:

        set_setting(

            "alert_threshold",

            data.alert_threshold

        )


    return {"status":"updated"}



# fetch settings

@app.get("/api/settings")

def get_settings():

    conn = get_connection()

    cur = conn.cursor()

    cur.execute(

        "SELECT * FROM system_settings"

    )

    rows = cur.fetchall()

    conn.close()


    return {

        r["key"]:r["value"]

        for r in rows

    }



# manual log injection

@app.post("/api/manual-log")

def manual_log(data:LogInput):


    features = data.dict()


    ip = features.pop("source_ip")


    risk,label = predict(features)

    location = get_location(ip)

    lat = location["latitude"]

    lng = location["longitude"]

    country = location["country"]


    conn = get_connection()

    cur = conn.cursor()


    cur.execute("""

    INSERT INTO threat_logs(

    source_ip,
    latitude,

    longitude,

    country,


    risk_score,

    classification

    )

    VALUES(?,?,?, ?, ?, ?)

    """,(ip,lat, lng, country, risk, label))


    conn.commit()

    log_id = cur.lastrowid


    threshold = float(

        get_setting("alert_threshold")

    )


    if risk >= threshold:


        email = get_setting(

            "admin_email"

        )


        send_email(

            email,

            ip,

            risk

        )


        cur.execute("""

        UPDATE threat_logs

        SET email_sent=1

        WHERE id=?

        """,(log_id,))


        conn.commit()


    conn.close()


    return {

        "risk_score":risk,

        "classification":label

    }



# fetch logs for dashboard

@app.get("/api/logs")

def get_logs(limit:int=50):


    conn = get_connection()

    cur = conn.cursor()


    cur.execute("""

    SELECT *

    FROM threat_logs

    ORDER BY timestamp DESC

    LIMIT ?

    """,(limit,))


    rows = cur.fetchall()

    conn.close()


    return [

        dict(r)

        for r in rows

    ]


@app.get("/api/simulator/status")
def simulator_status():
    return {
        "running": _simulator_running()
    }


@app.post("/api/simulator/start")
def start_simulator():
    global simulator_process

    with simulator_lock:
        if _simulator_running():
            return {
                "status": "already_running",
                "running": True
            }

        script = _simulator_script_path()

        if not script.exists():
            return {
                "status": "error",
                "running": False,
                "message": "simulator.py not found"
            }

        simulator_process = subprocess.Popen(
            [sys.executable, str(script)],
            cwd=str(script.parent),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )

        return {
            "status": "started",
            "running": True
        }


@app.post("/api/simulator/stop")
def stop_simulator():
    global simulator_process

    with simulator_lock:
        if not _simulator_running():
            simulator_process = None
            return {
                "status": "not_running",
                "running": False
            }

        simulator_process.terminate()

        try:
            simulator_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            simulator_process.kill()
            simulator_process.wait(timeout=5)

        simulator_process = None

        return {
            "status": "stopped",
            "running": False
        }
