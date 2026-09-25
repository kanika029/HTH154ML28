import os
import json
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.database.database import init_db, get_db_connection
from backend.simulator.anomaly_injector import AnomalyInjector
from backend.simulator.sensor_generator import SensorGenerator
from backend.processing.feature_engineering import FeatureEngineer
from backend.detection.statistical_detector import StatisticalDetector
from backend.detection.isolation_forest import IsolationForestDetector
from backend.classification.anomaly_classifier import AnomalyClassifier
from backend.context.correlation_engine import CorrelationEngine
from backend.severity.severity_engine import SeverityEngine
from backend.rootcause.rootcause_hints import RootCauseHintEngine
from backend.alerts.routing import AlertRoutingEngine
from backend.alerts.fatigue_filter import FatigueFilter
from backend.websocket.manager import manager

app = FastAPI(title="SmartSense Industrial Monitoring API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
injector = AnomalyInjector()
generator = SensorGenerator(injector)
feature_engineer = FeatureEngineer(window_size=20)
stat_detector = StatisticalDetector()
iforest_detector = IsolationForestDetector()
classifier = AnomalyClassifier()
correlation_engine = CorrelationEngine()
severity_engine = SeverityEngine()
root_cause_engine = RootCauseHintEngine()
routing_engine = AlertRoutingEngine()
fatigue_filter = FatigueFilter()

# Ground-truth evaluation metrics counters
metrics_store = {
    "true_positives": 0,
    "false_positives": 0,
    "false_negatives": 0,
    "true_negatives": 0,
    "start_time": datetime.now(timezone.utc).isoformat()
}

machine_statuses = {
    "CNC-M01": "NORMAL",
    "CNC-M02": "NORMAL",
    "CNC-M03": "NORMAL"
}

machine_health_scores = {
    "CNC-M01": 98,
    "CNC-M02": 99,
    "CNC-M03": 97
}

machine_operational_states = {
    "CNC-M01": "RUNNING",
    "CNC-M02": "RUNNING",
    "CNC-M03": "RUNNING"
}

simulation_task: Optional[asyncio.Task] = None

class InjectRequest(BaseModel):
    machine_id: str = "CNC-M01"
    anomaly_type: str = "SPIKE" # SPIKE, DRIFT, DROPOUT, STUCK, MULTI_SENSOR, ALERT_FLOOD, NORMAL
    sensor: str = "temperature"
    duration_ticks: int = 20

class MachineControlRequest(BaseModel):
    machine_id: str = "CNC-M01"
    action: str = "STOP" # START, STOP, RESTART

def compute_operational_health(machine_id: str, readings_dict: dict, active_alerts: list) -> int:
    """
    Computes real-time Operational Health Indicator (0-100%) incorporating:
    - Temperature condition (nominal ~32°C, >45°C degrades, >55°C critical)
    - Vibration condition (nominal ~1.2 mm/s, >1.8 degrades, >3.0 critical)
    - Power condition (nominal ~4.8 kW, >6.5 kW overload)
    - Active anomaly penalties (CRITICAL: -25, HIGH: -15, MEDIUM: -8)
    """
    health = 100.0

    temp = readings_dict.get("temperature", 32.0)
    vib = readings_dict.get("vibration", 1.20)
    power = readings_dict.get("power", 4.80)

    if temp is not None:
        if temp >= 55.0:
            health -= min(35.0, (temp - 55.0) * 2.5 + 20.0)
        elif temp >= 45.0:
            health -= (temp - 45.0) * 1.5

    if vib is not None:
        if vib >= 3.0:
            health -= min(30.0, (vib - 3.0) * 12.0 + 15.0)
        elif vib >= 1.8:
            health -= (vib - 1.8) * 8.0

    if power is not None and power >= 6.5:
        health -= min(20.0, (power - 6.5) * 6.0)

    for a in active_alerts:
        if a.get("machine_id") == machine_id:
            sev = a.get("severity", "LOW")
            if sev == "CRITICAL":
                health -= 25.0
            elif sev == "HIGH":
                health -= 15.0
            elif sev == "MEDIUM":
                health -= 8.0

    return max(15, min(100, round(health)))

@app.on_event("startup")
async def startup_event():
    init_db()
    global simulation_task
    simulation_task = asyncio.create_task(run_simulation_loop())

@app.on_event("shutdown")
async def shutdown_event():
    global simulation_task
    if simulation_task:
        simulation_task.cancel()

async def run_simulation_loop():
    while True:
        try:
            readings = generator.generate_tick(machine_operational_states)
            conn = get_db_connection()
            cursor = conn.cursor()

            # Group readings by machine for multivariate vectors
            machine_vectors: Dict[str, Dict[str, float]] = {m: {} for m in ["CNC-M01", "CNC-M02", "CNC-M03"]}
            active_keys_this_tick = []

            for r in readings:
                machine_vectors[r["machine_id"]][r["sensor"]] = r["value"]
                # Save reading to SQLite
                cursor.execute('''
                    INSERT INTO sensor_readings (timestamp, machine_id, sensor, value, is_injected_anomaly, injected_type)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (r["timestamp"], r["machine_id"], r["sensor"], r["value"], r["is_injected_anomaly"], r["injected_type"]))

            conn.commit()

            # Process features, detect, classify, triage
            tick_anomalies = []
            
            for r in readings:
                m_id = r["machine_id"]
                s_id = r["sensor"]
                
                # If machine is STOPPED, skip anomaly detection and active alert generation
                if machine_operational_states.get(m_id) == "STOPPED":
                    continue

                feat = feature_engineer.process_reading(r)
                
                # 1. Statistical Detection
                is_stat, stat_reason = stat_detector.detect(feat)
                
                # 2. Isolation Forest Detection
                is_iforest, iforest_score = iforest_detector.predict(machine_vectors[m_id])

                # 3. Anomaly Classification
                anomaly_dict = classifier.classify(feat, is_stat, is_iforest)

                # Ground Truth Metrics
                is_ground_truth = r["is_injected_anomaly"]
                is_detected = (anomaly_dict is not None)

                if is_ground_truth and is_detected:
                    metrics_store["true_positives"] += 1
                elif not is_ground_truth and is_detected:
                    metrics_store["false_positives"] += 1
                elif is_ground_truth and not is_detected:
                    metrics_store["false_negatives"] += 1
                else:
                    metrics_store["true_negatives"] += 1

                if anomaly_dict:
                    active_keys_this_tick.append(f"{m_id}_{s_id}")

                    # Record raw anomaly in DB
                    cursor.execute('''
                        INSERT INTO anomalies (timestamp, machine_id, sensor, anomaly_type, confidence, value, detection_method, is_injected_ground_truth)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        anomaly_dict["timestamp"],
                        m_id,
                        s_id,
                        anomaly_dict["anomaly_type"],
                        anomaly_dict["confidence"],
                        r["value"],
                        "HYBRID_STAT_IFOREST",
                        1 if is_ground_truth else 0
                    ))

                    # 4. Context & Correlation
                    correlation_info = correlation_engine.evaluate_correlation(anomaly_dict, feat)

                    # 5. Explainable Severity Scoring
                    severity_level, severity_score, severity_reasons = severity_engine.calculate_severity(
                        anomaly_dict, feat, correlation_info
                    )

                    # 6. Possible Root Cause Hint
                    root_cause_info = root_cause_engine.get_hint(
                        anomaly_dict["anomaly_type"], s_id, correlation_info["correlated_sensors"]
                    )

                    # 7. Alert Routing
                    routing_info = routing_engine.route_alert(severity_level, anomaly_dict["anomaly_type"], m_id)

                    # 8. Alert Fatigue Reduction Filter
                    alert_record = fatigue_filter.process_anomaly_event(
                        anomaly_dict,
                        (severity_level, severity_score, severity_reasons),
                        correlation_info,
                        root_cause_info,
                        routing_info,
                        r["value"],
                        conn=conn
                    )

                    tick_anomalies.append(alert_record)

            # Auto-resolve stale alerts
            fatigue_filter.resolve_stale_alerts(active_keys_this_tick, conn=conn)
            conn.commit()

            # Query active alerts
            cursor.execute("SELECT * FROM alerts WHERE status = 'ACTIVE' ORDER BY updated_at DESC LIMIT 30")
            active_alerts_list = [dict(row) for row in cursor.fetchall()]

            # Update Machine overall statuses and health scores
            for m in ["CNC-M01", "CNC-M02", "CNC-M03"]:
                if machine_operational_states.get(m) == "STOPPED":
                    machine_statuses[m] = "STOPPED"
                    machine_health_scores[m] = 100
                else:
                    m_sevs = [row["severity"] for row in active_alerts_list if row["machine_id"] == m]
                    if "CRITICAL" in m_sevs:
                        machine_statuses[m] = "CRITICAL"
                    elif "HIGH" in m_sevs:
                        machine_statuses[m] = "HIGH"
                    elif "MEDIUM" in m_sevs:
                        machine_statuses[m] = "MEDIUM"
                    else:
                        machine_statuses[m] = "NORMAL"

                    machine_health_scores[m] = compute_operational_health(
                        m, machine_vectors.get(m, {}), active_alerts_list
                    )

            conn.close()

            # Broadcast comprehensive real-time payload over WebSocket
            ws_payload = {
                "type": "SENSOR_TICK",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "readings": readings,
                "machine_statuses": machine_statuses,
                "machine_health": machine_health_scores,
                "active_alerts": active_alerts_list,
                "fatigue_stats": fatigue_filter.get_fatigue_stats(),
                "ground_truth_metrics": get_precision_recall_f1()
            }

            await manager.broadcast(ws_payload)

        except Exception as e:
            print(f"[Simulation Error] {e}")

        await asyncio.sleep(1.0)

def get_precision_recall_f1():
    tp = metrics_store["true_positives"]
    fp = metrics_store["false_positives"]
    fn = metrics_store["false_negatives"]

    precision = round(tp / (tp + fp), 3) if (tp + fp) > 0 else 1.0
    recall = round(tp / (tp + fn), 3) if (tp + fn) > 0 else 1.0
    f1 = round(2 * (precision * recall) / (precision + recall), 3) if (precision + recall) > 0 else 1.0

    return {
        "true_positives": tp,
        "false_positives": fp,
        "false_negatives": fn,
        "precision": precision,
        "recall": recall,
        "f1_score": f1
    }

# --- REST ENDPOINTS ---

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "SmartSense API", "version": "1.0.0"}

@app.get("/api/machines")
def get_machines():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM machines")
    machines = [dict(row) for row in cursor.fetchall()]
    conn.close()
    for m in machines:
        m["status"] = machine_statuses.get(m["id"], "NORMAL")
        m["health"] = machine_health_scores.get(m["id"], 98)
    return machines

@app.get("/api/sensors/history/{machine_id}")
def get_sensor_history(machine_id: str, limit: int = 50):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT timestamp, sensor, value, is_injected_anomaly, injected_type
        FROM sensor_readings
        WHERE machine_id = ?
        ORDER BY id DESC LIMIT ?
    ''', (machine_id, limit * 6))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    rows.reverse()
    return rows

@app.get("/api/alerts")
def get_alerts(limit: int = 50):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts ORDER BY id DESC LIMIT ?", (limit,))
    alerts = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return alerts

@app.post("/api/demo/inject")
def inject_anomaly(req: InjectRequest):
    res = injector.set_injection(
        machine_id=req.machine_id,
        anomaly_type=req.anomaly_type,
        sensor=req.sensor,
        duration_ticks=req.duration_ticks
    )
    return {"status": "success", "result": res}

@app.post("/api/demo/flood")
def flood_alerts(machine_id: str = "CNC-M01", sensor: str = "temperature"):
    """
    Triggers an intense flood of 25 rapid anomaly events on target sensor
    to demonstrate live incident grouping and >90% alert fatigue reduction.
    """
    res = injector.set_injection(
        machine_id=machine_id,
        anomaly_type="ALERT_FLOOD",
        sensor=sensor,
        duration_ticks=25
    )
    return {
        "status": "success",
        "action": "ALERT_FLOOD_STARTED",
        "machine_id": machine_id,
        "sensor": sensor,
        "duration_ticks": 25,
        "description": "25 rapid anomaly bursts injected to demonstrate real-time fatigue deduplication."
    }

@app.post("/api/machines/control")
def control_machine(req: MachineControlRequest):
    m_id = req.machine_id
    act = req.action.upper().strip()
    if act == "STOP":
        machine_operational_states[m_id] = "STOPPED"
        machine_statuses[m_id] = "STOPPED"
        machine_health_scores[m_id] = 100
        # Immediately resolve active alerts for stopped machine to halt live severity
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE alerts SET status = 'RESOLVED' WHERE machine_id = ? AND status = 'ACTIVE'", (m_id,))
        conn.commit()
        conn.close()
    elif act in ["START", "RESTART"]:
        machine_operational_states[m_id] = "RUNNING"
        machine_statuses[m_id] = "NORMAL"
        machine_health_scores[m_id] = 98
    return {"status": "success", "machine_id": m_id, "state": machine_operational_states[m_id]}

@app.post("/api/demo/reset")
def reset_demo():
    res = injector.reset_all()
    fatigue_filter.active_alert_ids.clear()
    for k in feature_engineer.persistence_counters:
        feature_engineer.persistence_counters[k] = 0
    for m in machine_statuses:
        machine_operational_states[m] = "RUNNING"
        machine_statuses[m] = "NORMAL"
        machine_health_scores[m] = 98
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE alerts SET status = 'RESOLVED' WHERE status = 'ACTIVE'")
    conn.commit()
    conn.close()
    return {"status": "success", "result": res}

@app.get("/api/reports/summary")
def get_report_summary():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total_events FROM sensor_readings")
    total_events = cursor.fetchone()["total_events"]

    cursor.execute("SELECT COUNT(*) as total_anomalies FROM anomalies")
    total_anomalies = cursor.fetchone()["total_anomalies"]

    # Anomaly breakdown
    cursor.execute("SELECT anomaly_type, COUNT(*) as cnt FROM anomalies GROUP BY anomaly_type")
    anomaly_breakdown = {row["anomaly_type"]: row["cnt"] for row in cursor.fetchall()}

    # Severity breakdown
    cursor.execute("SELECT severity, COUNT(*) as cnt FROM alerts GROUP BY severity")
    severity_breakdown = {row["severity"]: row["cnt"] for row in cursor.fetchall()}

    # Routing breakdown
    cursor.execute("SELECT routing, COUNT(*) as cnt FROM alerts GROUP BY routing")
    routing_breakdown = {row["routing"]: row["cnt"] for row in cursor.fetchall()}

    conn.close()

    fatigue_stats = fatigue_filter.get_fatigue_stats()
    metrics = get_precision_recall_f1()

    start_dt = datetime.fromisoformat(metrics_store["start_time"])
    duration_sec = int((datetime.now(timezone.utc) - start_dt).total_seconds())

    return {
        "monitoring_duration_seconds": duration_sec,
        "total_sensor_events": total_events,
        "total_anomalies_detected": total_anomalies,
        "anomaly_breakdown": anomaly_breakdown,
        "severity_breakdown": severity_breakdown,
        "routing_breakdown": routing_breakdown,
        "fatigue_metrics": fatigue_stats,
        "detection_metrics": metrics
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                if payload.get("action") == "inject":
                    injector.set_injection(
                        machine_id=payload.get("machine_id", "CNC-M01"),
                        anomaly_type=payload.get("anomaly_type", "SPIKE"),
                        sensor=payload.get("sensor", "temperature"),
                        duration_ticks=payload.get("duration_ticks", 20)
                    )
                elif payload.get("action") == "flood":
                    injector.set_injection(
                        machine_id=payload.get("machine_id", "CNC-M01"),
                        anomaly_type="ALERT_FLOOD",
                        sensor=payload.get("sensor", "temperature"),
                        duration_ticks=25
                    )
                elif payload.get("action") == "reset":
                    injector.reset_all()
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
