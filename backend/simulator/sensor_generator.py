import time
import math
import random
from datetime import datetime, timezone
from typing import Dict, Any, List
from backend.simulator.anomaly_injector import AnomalyInjector

class SensorGenerator:
    def __init__(self, injector: AnomalyInjector):
        self.injector = injector
        self.machines = ["CNC-M01", "CNC-M02", "CNC-M03"]
        self.step_counter = 0
        
        # Industrial CNC Sensor baselines: nominal mean and std
        self.baselines = {
            "rpm": {"mean": 1200.0, "std": 14.0},
            "temperature": {"mean": 32.0, "std": 0.75},
            "vibration": {"mean": 1.20, "std": 0.08},
            "power": {"mean": 4.80, "std": 0.18},
            "voltage": {"mean": 415.0, "std": 1.2},
            "feed_rate": {"mean": 500.0, "std": 4.5}
        }

    def generate_tick(self, machine_states: dict = None) -> List[Dict[str, Any]]:
        self.step_counter += 1
        t_now = datetime.now(timezone.utc).isoformat()
        readings = []

        for machine_id in self.machines:
            is_stopped = bool(machine_states and machine_states.get(machine_id) == "STOPPED")
            m_offset = 0.0 if machine_id == "CNC-M01" else (1.0 if machine_id == "CNC-M02" else -0.8)
            
            for sensor_name, config in self.baselines.items():
                if is_stopped:
                    # Stopped machine output: 0 or ambient
                    if sensor_name == "temperature":
                        val, is_injected, inj_type = 25.0, False, None
                    elif sensor_name == "voltage":
                        val, is_injected, inj_type = 0.0, False, None
                    else:
                        val, is_injected, inj_type = 0.0, False, None
                else:
                    noise = random.gauss(0, config["std"])
                    sine_wave = math.sin(self.step_counter / 12.0 + (hash(machine_id) % 7)) * config["std"]
                    raw_val = round(config["mean"] + m_offset * (config["mean"] / 100.0) + noise + sine_wave, 2)
                    val, is_injected, inj_type = self.injector.apply_injection(machine_id, sensor_name, raw_val)
                
                readings.append({
                    "timestamp": t_now,
                    "machine_id": machine_id,
                    "sensor": sensor_name,
                    "value": val,
                    "is_injected_anomaly": is_injected,
                    "injected_type": inj_type
                })
                
        return readings
