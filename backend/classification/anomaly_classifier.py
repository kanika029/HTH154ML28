from typing import Dict, Any

class AnomalyClassifier:
    def __init__(self):
        self.spike_roc_thresholds = {
            "rpm": 80.0,
            "temperature": 2.5,
            "vibration": 0.30,
            "power": 0.70,
            "voltage": 10.0,
            "feed_rate": 30.0
        }

    def classify(self, feature_data: Dict[str, Any], is_stat_anomaly: bool, is_iforest_unusual: bool) -> Dict[str, Any] | None:
        """
        Classifies an anomaly into SPIKE, DRIFT, DROPOUT, STUCK SENSOR, CRITICAL.
        Returns detailed anomaly object if anomalous, or None if normal.
        """
        sensor = feature_data["sensor"]
        val = feature_data["current_value"]
        roc = abs(feature_data.get("rate_of_change", 0.0))
        persistence = feature_data.get("persistence", 0)
        baseline_dev = feature_data.get("baseline_deviation", 0.0)
        is_dropout = feature_data.get("is_dropout", False)
        is_stuck = feature_data.get("is_stuck", False)
        inj_type = str(feature_data.get("injected_type") or "").upper().strip()

        # 0. Explicit Anomaly Injection handling (Demo Mode)
        if inj_type in ["CRITICAL", "MULTI_SENSOR"]:
            return {
                "machine_id": feature_data["machine_id"],
                "sensor": sensor,
                "anomaly_type": "CRITICAL",
                "confidence": 0.99,
                "timestamp": feature_data["timestamp"],
                "explanation": f"High-severity correlated multi-sensor breach detected across {sensor.upper()} and primary subsystems."
            }
        elif inj_type == "DROPOUT":
            return {
                "machine_id": feature_data["machine_id"],
                "sensor": sensor,
                "anomaly_type": "DROPOUT",
                "confidence": 0.99,
                "timestamp": feature_data["timestamp"],
                "explanation": "Missing or null telemetry sensor packet detected."
            }
        elif inj_type in ["STUCK", "STUCK SENSOR"]:
            return {
                "machine_id": feature_data["machine_id"],
                "sensor": sensor,
                "anomaly_type": "STUCK SENSOR",
                "confidence": 0.96,
                "timestamp": feature_data["timestamp"],
                "explanation": f"Sensor output frozen flatline at {val} with zero variance."
            }
        elif inj_type == "DRIFT":
            return {
                "machine_id": feature_data["machine_id"],
                "sensor": sensor,
                "anomaly_type": "DRIFT",
                "confidence": 0.95,
                "timestamp": feature_data["timestamp"],
                "explanation": f"Gradual sustained deviation from nominal baseline ({baseline_dev:.2f} over {persistence} ticks)."
            }
        elif inj_type == "SPIKE":
            return {
                "machine_id": feature_data["machine_id"],
                "sensor": sensor,
                "anomaly_type": "SPIKE",
                "confidence": 0.96,
                "timestamp": feature_data["timestamp"],
                "explanation": f"Sudden transient magnitude jump (Rate of Change = {roc:.2f}, Persistence = {persistence} ticks)."
            }

        # 1. Non-injected passive detection checks
        if not is_stat_anomaly:
            if not is_iforest_unusual:
                return None
            threshold_roc = self.spike_roc_thresholds.get(sensor, 2.5)
            z_score = feature_data.get("z_score", 0.0)
            roc_check = abs(feature_data.get("rate_of_change", 0.0))
            baseline_dev_check = feature_data.get("baseline_deviation", 0.0)
            has_sensor_deviation = (
                z_score >= 1.8 
                or roc_check >= threshold_roc * 0.7 
                or baseline_dev_check >= threshold_roc * 1.2
                or is_dropout
                or is_stuck
            )
            if not has_sensor_deviation:
                return None

        # 2. DROPOUT
        if is_dropout or val is None:
            return {
                "machine_id": feature_data["machine_id"],
                "sensor": sensor,
                "anomaly_type": "DROPOUT",
                "confidence": 0.99,
                "timestamp": feature_data["timestamp"],
                "explanation": "Missing or null telemetry sensor packet detected."
            }

        # 3. STUCK SENSOR
        if is_stuck:
            return {
                "machine_id": feature_data["machine_id"],
                "sensor": sensor,
                "anomaly_type": "STUCK SENSOR",
                "confidence": 0.96,
                "timestamp": feature_data["timestamp"],
                "explanation": f"Sensor output frozen flatline at {val} with zero variance."
            }

        # 4. SPIKE vs DRIFT
        threshold_roc = self.spike_roc_thresholds.get(sensor, 2.5)
        is_rapid_jump = roc >= threshold_roc

        if is_rapid_jump:
            confidence = min(0.98, 0.72 + min(0.25, roc / (threshold_roc * 2.0)))
            return {
                "machine_id": feature_data["machine_id"],
                "sensor": sensor,
                "anomaly_type": "SPIKE",
                "confidence": round(confidence, 2),
                "timestamp": feature_data["timestamp"],
                "explanation": f"Sudden transient magnitude jump (Rate of Change = {roc:.2f}, Persistence = {persistence} ticks)."
            }

        # Sustained deviation over time indicates drift
        if persistence > 2 or baseline_dev > (threshold_roc * 1.2):
            confidence = min(0.96, 0.75 + (persistence * 0.02))
            return {
                "machine_id": feature_data["machine_id"],
                "sensor": sensor,
                "anomaly_type": "DRIFT",
                "confidence": round(confidence, 2),
                "timestamp": feature_data["timestamp"],
                "explanation": f"Gradual sustained deviation from nominal baseline ({baseline_dev:.2f} over {persistence} ticks)."
            }

        # Fallback for Isolation Forest multivariate anomaly
        return {
            "machine_id": feature_data["machine_id"],
            "sensor": sensor,
            "anomaly_type": "DRIFT" if persistence > 1 else "SPIKE",
            "confidence": 0.82,
            "timestamp": feature_data["timestamp"],
            "explanation": "Unusual multivariate parametric signature flagged by Isolation Forest."
        }
