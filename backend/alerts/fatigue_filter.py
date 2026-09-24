import time
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
from backend.database.database import get_db_connection

class FatigueFilter:
    def __init__(self):
        # Active tracked alerts by machine_sensor key: { "CNC-M01_temperature": alert_id }
        self.active_alert_ids: Dict[str, int] = {}
        self.raw_anomaly_count = 0
        self.meaningful_alert_count = 0
        self.suppressed_event_count = 0
        self.escalated_incident_count = 0
        self.inactivity_timeout_seconds = 10.0

    def process_anomaly_event(
        self,
        anomaly: Dict[str, Any],
        severity_info: Tuple[str, int, List[str]],
        correlation_info: Dict[str, Any],
        root_cause_info: Dict[str, str],
        routing_info: Dict[str, str],
        current_val: float | None,
        conn = None
    ) -> Dict[str, Any]:
        """
        Deduplicates raw anomalies into meaningful alerts.
        Escalates existing incident without suppression if severity escalates.
        Returns the alert object (created or updated).
        """
        self.raw_anomaly_count += 1
        
        machine_id = anomaly["machine_id"]
        sensor = anomaly["sensor"]
        key = f"{machine_id}_{sensor}"
        
        severity, severity_score, reasons = severity_info
        now_iso = datetime.now(timezone.utc).isoformat()

        should_close = False
        if conn is None:
            conn = get_db_connection()
            should_close = True
            
        cursor = conn.cursor()

        # Check for active existing incident for this machine and sensor
        cursor.execute('''
            SELECT id, timestamp, suppressed_count, severity, severity_score 
            FROM alerts 
            WHERE machine_id = ? AND sensor = ? AND status = 'ACTIVE'
            ORDER BY updated_at DESC LIMIT 1
        ''', (machine_id, sensor))
        
        existing = cursor.fetchone()

        baseline_map = {
            "rpm": "1050.0 - 1350.0 RPM",
            "temperature": "25.0 - 45.0 °C",
            "vibration": "0.60 - 1.80 mm/s",
            "power": "3.50 - 6.20 kW",
            "voltage": "400.0 - 425.0 V",
            "feed_rate": "450.0 - 550.0 mm/min"
        }

        if existing:
            alert_id = existing["id"]
            prev_severity = existing["severity"]
            prev_score = existing["severity_score"]
            suppressed = existing["suppressed_count"] + 1

            # Check if severity is increasing (Escalation)
            severity_rank = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
            is_escalating = (severity_rank.get(severity, 1) > severity_rank.get(prev_severity, 1)) or (severity_score > prev_score + 10)
            
            if is_escalating:
                self.escalated_incident_count += 1
                effective_severity = severity
                effective_score = max(prev_score, severity_score)
            else:
                self.suppressed_event_count += 1
                effective_severity = severity if severity_rank.get(severity, 1) >= severity_rank.get(prev_severity, 1) else prev_severity
                effective_score = max(prev_score, severity_score)

            start_dt = datetime.fromisoformat(existing["timestamp"])
            duration_sec = int((datetime.now(timezone.utc) - start_dt).total_seconds())

            cursor.execute('''
                UPDATE alerts SET
                    severity = ?,
                    severity_score = ?,
                    reasons = ?,
                    current_value = ?,
                    duration_seconds = ?,
                    suppressed_count = ?,
                    routing = ?,
                    responsible_team = ?,
                    updated_at = ?
                WHERE id = ?
            ''', (
                effective_severity,
                effective_score,
                json.dumps(reasons),
                current_val,
                duration_sec,
                suppressed,
                routing_info["route"],
                routing_info["responsible_team"],
                now_iso,
                alert_id
            ))
            conn.commit()

            cursor.execute('SELECT * FROM alerts WHERE id = ?', (alert_id,))
            alert_row = dict(cursor.fetchone())
            
            if should_close:
                conn.close()
            
            alert_row["is_new"] = False
            alert_row["is_escalated"] = is_escalating
            return alert_row

        else:
            # New meaningful incident created
            self.meaningful_alert_count += 1

            cursor.execute('''
                INSERT INTO alerts (
                    timestamp, machine_id, sensor, anomaly_type, severity,
                    severity_score, reasons, correlated_sensors, root_cause_hint,
                    routing, responsible_team, duration_seconds, current_value,
                    normal_range, explanation, status, suppressed_count, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 0, ?)
            ''', (
                now_iso,
                machine_id,
                sensor,
                anomaly["anomaly_type"],
                severity,
                severity_score,
                json.dumps(reasons),
                json.dumps(correlation_info.get("correlated_sensors", [])),
                f"{root_cause_info['possible_cause']} ({root_cause_info['disclaimer']})",
                routing_info["route"],
                routing_info["responsible_team"],
                0,
                current_val,
                baseline_map.get(sensor, "Nominal Operating Range"),
                f"Active {anomaly['anomaly_type']} incident on {machine_id} ({sensor.upper()}). {correlation_info.get('explanation', '')}",
                now_iso
            ))
            
            alert_id = cursor.lastrowid
            conn.commit()
            
            cursor.execute('SELECT * FROM alerts WHERE id = ?', (alert_id,))
            alert_row = dict(cursor.fetchone())
            
            if should_close:
                conn.close()
            
            alert_row["is_new"] = True
            alert_row["is_escalated"] = False
            return alert_row

    def resolve_stale_alerts(self, active_keys_this_tick: List[str], conn = None):
        """
        Auto-resolves active alerts if no anomaly was reported for >10 seconds.
        """
        should_close = False
        if conn is None:
            conn = get_db_connection()
            should_close = True
            
        cursor = conn.cursor()
        cursor.execute("SELECT id, machine_id, sensor, updated_at FROM alerts WHERE status = 'ACTIVE'")
        rows = cursor.fetchall()
        
        now = datetime.now(timezone.utc)
        for r in rows:
            key = f"{r['machine_id']}_{r['sensor']}"
            if key not in active_keys_this_tick:
                upd_dt = datetime.fromisoformat(r['updated_at'])
                if (now - upd_dt).total_seconds() > self.inactivity_timeout_seconds:
                    cursor.execute("UPDATE alerts SET status = 'RESOLVED' WHERE id = ?", (r['id'],))
        conn.commit()
        if should_close:
            conn.close()

    def get_fatigue_stats(self) -> Dict[str, Any]:
        reduction_pct = 0.0
        if self.raw_anomaly_count > 0:
            reduction_pct = round(((self.raw_anomaly_count - self.meaningful_alert_count) / self.raw_anomaly_count) * 100.0, 1)
        return {
            "raw_anomaly_events": self.raw_anomaly_count,
            "meaningful_alerts": self.meaningful_alert_count,
            "suppressed_events": self.suppressed_event_count,
            "escalated_incidents": self.escalated_incident_count,
            "alert_reduction_pct": max(0.0, reduction_pct)
        }
