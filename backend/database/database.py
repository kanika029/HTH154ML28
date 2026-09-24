import sqlite3
import os
import json
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "smartsense.db")

def get_db_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
    except Exception:
        pass
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Machines table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS machines (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            location TEXT,
            status TEXT DEFAULT 'NORMAL',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Sensors table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sensors (
            id TEXT PRIMARY KEY,
            machine_id TEXT NOT NULL,
            name TEXT NOT NULL,
            unit TEXT NOT NULL,
            min_normal REAL,
            max_normal REAL,
            FOREIGN KEY (machine_id) REFERENCES machines(id)
        )
    ''')

    # Sensor readings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sensor_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TIMESTAMP NOT NULL,
            machine_id TEXT NOT NULL,
            sensor TEXT NOT NULL,
            value REAL,
            is_injected_anomaly BOOLEAN DEFAULT 0,
            injected_type TEXT
        )
    ''')

    # Anomalies table (Raw detected anomalies)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS anomalies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TIMESTAMP NOT NULL,
            machine_id TEXT NOT NULL,
            sensor TEXT NOT NULL,
            anomaly_type TEXT NOT NULL,
            confidence REAL NOT NULL,
            value REAL,
            detection_method TEXT NOT NULL,
            is_injected_ground_truth BOOLEAN DEFAULT 0
        )
    ''')

    # Alerts table (Triaged & Deduplicated alerts)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TIMESTAMP NOT NULL,
            machine_id TEXT NOT NULL,
            sensor TEXT NOT NULL,
            anomaly_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            severity_score INTEGER NOT NULL,
            reasons TEXT,
            correlated_sensors TEXT,
            root_cause_hint TEXT,
            routing TEXT NOT NULL,
            responsible_team TEXT NOT NULL,
            duration_seconds INTEGER DEFAULT 0,
            current_value REAL,
            normal_range TEXT,
            explanation TEXT,
            status TEXT DEFAULT 'ACTIVE',
            suppressed_count INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Alert history / audit log
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alert_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alert_id INTEGER NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            action TEXT NOT NULL,
            details TEXT,
            FOREIGN KEY (alert_id) REFERENCES alerts(id)
        )
    ''')

    # Seed machines and sensors if empty
    cursor.execute('SELECT COUNT(*) as count FROM machines')
    if cursor.fetchone()['count'] == 0:
        machines = [
            ('CNC-M01', 'CNC-M01 (3-Axis Milling Center)', 'CNC Vertical Machining Center', 'Cell Alpha - Bay 1'),
            ('CNC-M02', 'CNC-M02 (Horizontal Milling Center)', 'CNC Horizontal Milling Center', 'Cell Beta - Bay 2'),
            ('CNC-M03', 'CNC-M03 (High-Precision Lathe)', 'CNC Precision Lathe', 'Cell Gamma - Bay 3')
        ]
        cursor.executemany('INSERT INTO machines (id, name, type, location) VALUES (?, ?, ?, ?)', machines)

        sensor_configs = [
            ('rpm', 'Spindle Speed', 'RPM', 1050.0, 1350.0),
            ('temperature', 'Spindle Temperature', '°C', 25.0, 48.0),
            ('vibration', 'Spindle Vibration', 'mm/s', 0.6, 1.8),
            ('power', 'Power Consumption', 'kW', 3.5, 6.2),
            ('voltage', 'Line Voltage', 'V', 400.0, 425.0),
            ('feed_rate', 'Feed Rate', 'mm/min', 450.0, 550.0)
        ]

        for m_id, _, _, _ in machines:
            for s_id, s_name, unit, min_n, max_n in sensor_configs:
                s_pk = f"{m_id}_{s_id}"
                cursor.execute(
                    'INSERT INTO sensors (id, machine_id, name, unit, min_normal, max_normal) VALUES (?, ?, ?, ?, ?, ?)',
                    (s_pk, m_id, s_id, unit, min_n, max_n)
                )

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
