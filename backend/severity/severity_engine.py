from typing import Dict, Any, List, Tuple

class SeverityEngine:
    def __init__(self):
        # Configurable severity bands matching SmartSense specification
        self.LOW_MAX = 30
        self.MEDIUM_MAX = 60
        self.HIGH_MAX = 80

    def calculate_severity(
        self,
        anomaly: Dict[str, Any],
        feature_data: Dict[str, Any],
        correlation_info: Dict[str, Any]
    ) -> Tuple[str, int, List[str]]:
        """
        Calculates explainable severity level (LOW, MEDIUM, HIGH, CRITICAL), 
        score (0-100), and specific list of contributing reasons.
        """
        score = 0
        reasons = []

        anomaly_type = anomaly["anomaly_type"]
        sensor = anomaly["sensor"]
        z_score = feature_data.get("z_score", 0.0)
        baseline_dev = feature_data.get("baseline_deviation", 0.0)
        persistence = feature_data.get("persistence", 0)
        roc = abs(feature_data.get("rate_of_change", 0.0))
        active_sensor_count = correlation_info.get("active_sensor_count", 1)
        correlated_sensors = correlation_info.get("correlated_sensors", [])

        # 1. Anomaly Type Base Weight
        if anomaly_type in ["MULTI_SENSOR", "CRITICAL"]:
            score += 35
            reasons.append("Multi-sensor correlated operational disturbance")
        elif anomaly_type == "DROPOUT":
            score += 35
            reasons.append("Telemetry signal dropout / communication loss")
        elif anomaly_type == "DRIFT":
            score += 25
            reasons.append("Sustained parametric drift away from baseline")
        elif anomaly_type in ["STUCK", "STUCK SENSOR"]:
            score += 25
            reasons.append("Sensor output frozen / stuck transducer")
        elif anomaly_type == "SPIKE":
            score += 20
            reasons.append("Transient magnitude spike")

        # 2. Magnitude / Z-Score Contribution
        if anomaly_type == "DROPOUT":
            score += 20
            reasons.append("Complete sensor signal loss (NULL telemetry packet)")
        elif z_score >= 4.0 or baseline_dev >= 15.0:
            score += 25
            reasons.append(f"Large deviation magnitude (Z-score: {z_score:.1f}, Dev: {baseline_dev:.1f})")
        elif z_score >= 2.5 or baseline_dev >= 6.0:
            score += 15
            reasons.append(f"Moderate deviation from baseline (Z-score: {z_score:.1f})")
        else:
            score += 5

        # 3. Persistence / Duration
        if persistence >= 8:
            score += 20
            reasons.append(f"Long persistence ({persistence} consecutive ticks)")
        elif persistence >= 4:
            score += 12
            reasons.append(f"Sustained deviation ({persistence} ticks)")

        # 4. Rate of Change
        if roc >= 4.0 or (sensor == "vibration" and roc >= 0.4):
            score += 15
            reasons.append(f"Rapid rate of change ({roc:.2f}/tick)")

        # 5. Multi-Sensor Correlation Escalation
        if active_sensor_count > 1:
            # Temperature + Vibration + Power produces maximum multi-sensor escalation
            all_active = set([sensor] + correlated_sensors)
            boost = (active_sensor_count - 1) * 18
            if "temperature" in all_active and "vibration" in all_active:
                boost += 8
            if "power" in all_active and ("temperature" in all_active or "vibration" in all_active):
                boost += 8
            score += boost
            correlated_str = ", ".join([s.capitalize() for s in all_active])
            reasons.append(f"Multi-sensor correlation: {active_sensor_count} active sensors ({correlated_str})")

        # Clamp score to [0, 100]
        score = max(0, min(100, score))

        # Categorize using SmartSense bands
        if score > self.HIGH_MAX:
            severity = "CRITICAL"
        elif score > self.MEDIUM_MAX:
            severity = "HIGH"
        elif score > self.LOW_MAX:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        return severity, score, reasons
