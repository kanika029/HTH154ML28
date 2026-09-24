import time
import random
import numpy as np

class AnomalyInjector:
    def __init__(self):
        # Active injection per machine: { 'CNC-M01': {'type': 'SPIKE', 'sensor': 'temperature', 'step': 0, 'max_steps': 15, 'params': {...}} }
        self.active_injections = {}
        
    def set_injection(self, machine_id: str, anomaly_type: str, sensor: str = "temperature", duration_ticks: int = 15):
        clean_type = anomaly_type.upper().strip()
        if clean_type == "NORMAL":
            if machine_id in self.active_injections:
                del self.active_injections[machine_id]
            return {"status": "reset", "machine_id": machine_id}
            
        self.active_injections[machine_id] = {
            "type": clean_type,
            "sensor": sensor,
            "step": 0,
            "max_steps": duration_ticks,
            "params": {}
        }
        return {"status": "injected", "machine_id": machine_id, "type": clean_type, "sensor": sensor}

    def reset_all(self):
        self.active_injections.clear()
        return {"status": "all_reset"}

    def apply_injection(self, machine_id: str, sensor: str, base_value: float) -> tuple[float | None, bool, str | None]:
        """
        Returns (modified_value, is_injected, injected_type)
        """
        if machine_id not in self.active_injections:
            return base_value, False, None
            
        injection = self.active_injections[machine_id]
        inj_type = injection["type"]
        inj_sensor = injection["sensor"]
        step = injection["step"]
        
        # Check if duration expired
        if step >= injection["max_steps"]:
            del self.active_injections[machine_id]
            return base_value, False, None

        # Determine if this sensor is affected by the active injection
        if inj_type in ["MULTI_SENSOR", "CRITICAL"]:
            # Critical multi-sensor affects temperature, vibration, and power
            if sensor not in ["temperature", "vibration", "power"]:
                return base_value, False, None
        elif inj_type == "ALERT_FLOOD":
            if sensor != inj_sensor:
                return base_value, False, None
        else:
            if sensor != inj_sensor:
                return base_value, False, None

        # Increment step count once per tick (tracked on primary sensor check)
        if sensor == inj_sensor or (inj_type in ["MULTI_SENSOR", "CRITICAL"] and sensor == "temperature"):
            injection["step"] += 1

        is_injected = True

        if inj_type == "SPIKE":
            # Sudden peak for first 3 steps
            if step <= 3:
                multiplier_map = {
                    "temperature": 1.75, # jumps from ~32°C to ~56°C
                    "vibration": 2.8,    # jumps from ~1.2 mm/s to ~3.3 mm/s
                    "power": 1.6,        # jumps from ~4.8 kW to ~7.7 kW
                    "rpm": 1.45,         # jumps from 1200 to 1740
                    "voltage": 1.15,     # jumps to 477V
                    "feed_rate": 1.6
                }
                mult = multiplier_map.get(sensor, 1.8)
                return round(base_value * mult, 2), is_injected, inj_type
            else:
                return base_value, False, None

        elif inj_type == "DRIFT":
            # Sustained linear creep upward away from nominal baseline
            rate_map = {
                "temperature": 1.8, # +1.8°C per tick
                "vibration": 0.16,  # +0.16 mm/s per tick
                "power": 0.28,      # +0.28 kW per tick
                "rpm": 30.0,
                "voltage": 2.0,
                "feed_rate": 12.0
            }
            drift = step * rate_map.get(sensor, 1.5)
            return round(base_value + drift, 2), is_injected, inj_type

        elif inj_type == "DROPOUT":
            # Missing / null sensor value
            return None, is_injected, inj_type

        elif inj_type in ["STUCK", "STUCK SENSOR"]:
            # Value frozen flatline on fixed reading
            if "stuck_val" not in injection:
                injection["stuck_val"] = base_value
            return injection["stuck_val"], is_injected, "STUCK"

        elif inj_type in ["MULTI_SENSOR", "CRITICAL"]:
            # High severity correlated escalation across Temperature, Vibration, and Power
            if sensor == "temperature":
                val = base_value + 26.0 + (step * 1.2) # jumps to ~58-65°C
            elif sensor == "vibration":
                val = base_value + 2.2 + (step * 0.15) # jumps to ~3.4-4.5 mm/s
            elif sensor == "power":
                val = base_value + 2.5 + (step * 0.2)  # jumps to ~7.3-8.8 kW
            else:
                val = base_value
            return round(val, 2), is_injected, "MULTI_SENSOR"

        elif inj_type == "ALERT_FLOOD":
            # Generates continuous rapid oscillating spikes to produce 20+ raw anomaly events
            burst_multiplier = 1.65 + (0.15 * (step % 3))
            return round(base_value * burst_multiplier, 2), is_injected, "ALERT_FLOOD"

        return base_value, False, None
