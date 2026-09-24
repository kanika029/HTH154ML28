import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "models", "isolation_forest.joblib")

class IsolationForestDetector:
    def __init__(self):
        self.model = None
        self.feature_names = ["rpm", "temperature", "vibration", "power", "voltage", "feed_rate"]
        self.defaults = {
            "rpm": 1200.0,
            "temperature": 32.0,
            "vibration": 1.20,
            "power": 4.80,
            "voltage": 415.0,
            "feed_rate": 500.0
        }
        self._ensure_model()

    def _ensure_model(self):
        if os.path.exists(MODEL_PATH):
            try:
                loaded = joblib.load(MODEL_PATH)
                # Verify feature count matches 6 CNC parameters
                if hasattr(loaded, "n_features_in_") and loaded.n_features_in_ == len(self.feature_names):
                    self.model = loaded
                    return
            except Exception:
                pass
        # Retrain baseline model on CNC machine distribution
        self.train_baseline()

    def train_baseline(self, num_samples: int = 2100):
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        from backend.simulator.anomaly_injector import AnomalyInjector
        from backend.simulator.sensor_generator import SensorGenerator

        clean_inj = AnomalyInjector()
        gen = SensorGenerator(clean_inj)
        data = []
        # Generate clean ticks across all machines
        for _ in range(num_samples // 3):
            readings = gen.generate_tick()
            vecs = {"CNC-M01": {}, "CNC-M02": {}, "CNC-M03": {}}
            for r in readings:
                vecs[r["machine_id"]][r["sensor"]] = r["value"]
            for m in ["CNC-M01", "CNC-M02", "CNC-M03"]:
                row = [vecs[m].get(s, self.defaults[s]) for s in self.feature_names]
                data.append(row)

        X = np.array(data)
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.005,
            random_state=42
        )
        self.model.fit(X)
        joblib.dump(self.model, MODEL_PATH)

    def predict(self, machine_readings_dict: dict[str, float]) -> tuple[bool, float]:
        """
        Expects a dictionary with CNC sensor keys: rpm, temperature, vibration, power, voltage, feed_rate.
        Returns (is_unusual: bool, score: float)
        """
        if self.model is None:
            return False, 0.0

        try:
            vec = []
            for feat in self.feature_names:
                v = machine_readings_dict.get(feat)
                if v is None or np.isnan(v):
                    v = self.defaults[feat]
                vec.append(v)

            X = np.array([vec])
            pred = self.model.predict(X)[0] # 1 for inlier, -1 for outlier
            raw_score = self.model.score_samples(X)[0] # Higher = normal, lower = anomaly
            
            is_unusual = (pred == -1)
            return is_unusual, float(raw_score)
        except Exception as e:
            return False, 0.0
