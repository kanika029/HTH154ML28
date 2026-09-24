from typing import Dict, Any, List
from collections import defaultdict
import time

class CorrelationEngine:
    def __init__(self):
        # Store recent active anomalies by machine: { "pump_3": { "temperature": timestamp, "vibration": timestamp } }
        self.machine_anomalies = defaultdict(dict)
        self.window_seconds = 10.0

    def evaluate_correlation(self, anomaly: Dict[str, Any], current_feature: Dict[str, Any]) -> Dict[str, Any]:
        machine_id = anomaly["machine_id"]
        sensor = anomaly["sensor"]
        now = time.time()

        # Update current sensor anomaly timestamp
        self.machine_anomalies[machine_id][sensor] = now

        # Prune stale anomalies outside correlation window
        active_sensors = []
        for s_name, ts in list(self.machine_anomalies[machine_id].items()):
            if now - ts <= self.window_seconds:
                active_sensors.append(s_name)
            else:
                del self.machine_anomalies[machine_id][s_name]

        is_correlated = len(active_sensors) > 1
        correlated_sensors = [s for s in active_sensors if s != sensor]

        if is_correlated:
            sensor_str = ", ".join([sensor.capitalize()] + [s.capitalize() for s in correlated_sensors])
            explanation = f"{sensor_str} abnormal simultaneously on {machine_id.replace('_', ' ').title()}."
        else:
            explanation = f"Single-sensor anomaly on {sensor}."

        return {
            "is_correlated": is_correlated,
            "active_sensor_count": len(active_sensors),
            "correlated_sensors": correlated_sensors,
            "explanation": explanation
        }
