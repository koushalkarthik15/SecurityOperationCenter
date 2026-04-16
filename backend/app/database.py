import sqlite3

DB_NAME = "soc.db"


def get_connection():

    conn = sqlite3.connect(DB_NAME)

    conn.row_factory = sqlite3.Row

    return conn


def init_db():

    conn = get_connection()

    cursor = conn.cursor()


    cursor.execute("""

    CREATE TABLE IF NOT EXISTS threat_logs (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

        source_ip TEXT,
                   latitude FLOAT,

longitude FLOAT,

country TEXT,

        risk_score FLOAT,

        classification TEXT,

        email_sent BOOLEAN DEFAULT 0

    )

    """)


    cursor.execute("""

    CREATE TABLE IF NOT EXISTS system_settings (

        key TEXT PRIMARY KEY,

        value TEXT

    )

    """)


    defaults = {

        "admin_email": "reviewer@gmail.com",

        "alert_threshold": "75",

        "cooldown_minutes": "10"

    }


    for k,v in defaults.items():

        cursor.execute("""

        INSERT OR IGNORE INTO system_settings (key,value)

        VALUES (?,?)

        """,(k,v))


    conn.commit()

    conn.close()