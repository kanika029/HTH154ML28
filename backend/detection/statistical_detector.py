from typing import Dict, Any, Tuple

class StatisticalDetector:
    def __init__(self):
        # Statistical deviation thresholds tailored for CNC dynamics
        self.z_threshold = 2.5
        self.roc_thresholds = {
            "rpm": 90.0,         # >90 RPM rapid change
            "temperature": 3.0,  # >3°C change per tick
            "vibration": 0.35,   # >0.35 mm/s jump
            "power": 0.8,        # >0.8 kW jump
            "voltage": 12.0,     # >12V change
            "feed_rate": 35.0    # >35 mm/min jump
        }
        self.dev_thresholds = {
            "rpm": 150.0,
            "temperature": 8.0,
            "vibration": 0.50,
            "power": 1.4,
            "voltage": 18.0,
            "feed_rate": 60.0
        }

    def detect(self, feature_data: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Returns (is_anomaly: bool, detection_reason: str)
        """
        if feature_data.get("is_dropout"):
            return True, "MISSING_DATA (Dropout)"

        if feature_data.get("is_stuck"):
            return True, "FLATLINE_VARIANCE (Stuck Sensor)"

        z_score = feature_data.get("z_score", 0.0)
        roc = abs(feature_data.get("rate_of_change", 0.0))
        sensor = feature_data.get("sensor")
        persistence = feature_data.get("persistence", 0)
        baseline_dev = feature_data.get("baseline_deviation", 0.0)

        # 1. Z-Score threshold check
        if z_score >= self.z_threshold:
            return True, f"Z_SCORE_EXCEEDED ({z_score} >= {self.z_threshold})"

        # 2. Baseline deviation check
        max_dev = self.dev_thresholds.get(sensor, 10.0)
        if baseline_dev >= max_dev:
            return True, f"BASELINE_DEVIATION_EXCEEDED ({baseline_dev:.1f} >= {max_dev})"

        # 3. Rate of change check
        max_roc = self.roc_thresholds.get(sensor, 5.0)
        if roc >= max_roc:
            return True, f"RATE_OF_CHANGE_EXCEEDED ({roc} >= {max_roc})"

        # 4. Persistence check
        if persistence >= 3:
            return True, f"PERSISTENT_DEVIATION ({persistence} ticks)"

        return False, "NORMAL"
