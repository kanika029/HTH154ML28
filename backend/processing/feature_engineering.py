import pandas as pd
import numpy as np
from collections import deque
from typing import Dict, Any, List

class FeatureEngineer:
    def __init__(self, window_size: int = 20):
        self.window_size = window_size
        # History store: { "CNC-M01_temperature": deque(maxlen=20) }
        self.history: Dict[str, deque] = {}
        # Persistence counters: { "CNC-M01_temperature": 0 }
        self.persistence_counters: Dict[str, int] = {}
        
        # Baselines for industrial CNC parameters
        self.baselines = {
            "rpm": 1200.0,
            "temperature": 32.0,
            "vibration": 1.20,
            "power": 4.80,
            "voltage": 415.0,
            "feed_rate": 500.0
        }

    def process_reading(self, reading: Dict[str, Any]) -> Dict[str, Any]:
        machine_id = reading["machine_id"]
        sensor = reading["sensor"]
        val = reading["value"]
        key = f"{machine_id}_{sensor}"

        if key not in self.history:
            self.history[key] = deque(maxlen=self.window_size)
            self.persistence_counters[key] = 0

        hist = self.history[key]
        hist.append(val)

        numeric_vals = [v for v in hist if v is not None]
        missing_count = sum(1 for v in hist if v is None)

        if val is None:
            # Dropout case
            self.persistence_counters[key] += 1
            features = {
                "current_value": None,
                "rolling_mean": np.mean(numeric_vals) if numeric_vals else self.baselines.get(sensor, 0.0),
                "rolling_std": np.std(numeric_vals) if len(numeric_vals) > 1 else 0.0,
                "baseline_deviation": 0.0,
                "z_score": 0.0,
                "rate_of_change": 0.0,
                "persistence": self.persistence_counters[key],
                "missing_count": missing_count,
                "sensor_variance": 0.0,
                "is_dropout": True,
                "is_stuck": False
            }
            return {**reading, **features}

        # Calculate statistics
        mean_val = float(np.mean(numeric_vals)) if numeric_vals else val
        std_val = float(np.std(numeric_vals)) if len(numeric_vals) > 1 else 0.001
        if std_val < 1e-4:
            std_val = 1e-4

        baseline = self.baselines.get(sensor, mean_val)
        baseline_deviation = abs(val - baseline)
        z_score = abs(val - mean_val) / std_val

        # Rate of change
        prev_val = numeric_vals[-2] if len(numeric_vals) >= 2 else val
        rate_of_change = val - prev_val

        # Sensor variance (over last 3 to 5 numeric readings to detect stuck sensor)
        recent_5 = numeric_vals[-5:]
        variance = float(np.var(recent_5)) if len(recent_5) >= 5 else 1.0

        # Check stuck sensor (flatline with near-zero variance for 3+ ticks or explicit injection)
        recent_3 = numeric_vals[-3:]
        var_3 = float(np.var(recent_3)) if len(recent_3) >= 3 else 1.0
        is_stuck = False
        if (len(recent_3) >= 3 and var_3 < 1e-4) or reading.get("injected_type") == "STUCK":
            is_stuck = True

        # Persistence calculation (consecutive ticks with z_score > 2.0 or >15% deviation or stuck)
        if z_score > 2.0 or baseline_deviation > (baseline * 0.15) or is_stuck:
            self.persistence_counters[key] += 1
        else:
            self.persistence_counters[key] = 0

        features = {
            "current_value": val,
            "rolling_mean": round(mean_val, 2),
            "rolling_std": round(std_val, 4),
            "baseline_deviation": round(baseline_deviation, 2),
            "z_score": round(z_score, 2),
            "rate_of_change": round(rate_of_change, 2),
            "persistence": self.persistence_counters[key],
            "missing_count": missing_count,
            "sensor_variance": round(variance, 6),
            "is_dropout": False,
            "is_stuck": is_stuck
        }

        return {**reading, **features}
