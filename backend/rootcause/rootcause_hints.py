from typing import Dict, Any, List

class RootCauseHintEngine:
    def get_hint(
        self,
        anomaly_type: str,
        primary_sensor: str,
        correlated_sensors: List[str]
    ) -> Dict[str, str]:
        all_sensors = set([primary_sensor] + (correlated_sensors or []))
        
        hint = "General operating disturbance"
        
        # Explainable heuristics for CNC Milling machine
        if anomaly_type == "DROPOUT":
            hint = "Possible sensor or communication failure"
        elif anomaly_type in ["STUCK", "STUCK SENSOR"]:
            hint = "Possible sensor malfunction"
        elif "temperature" in all_sensors and "vibration" in all_sensors and "power" in all_sensors:
            hint = "Possible severe mechanical binding, spindle bearing seizure, or motor overload"
        elif "temperature" in all_sensors and "vibration" in all_sensors:
            hint = "Possible mechanical stress or overheating"
        elif "temperature" in all_sensors and "power" in all_sensors:
            hint = "Possible motor overload / thermal stress"
        elif "vibration" in all_sensors:
            hint = "Possible mechanical imbalance or bearing issue"
        elif primary_sensor == "temperature":
            hint = "Possible spindle cooling failure or thermal expansion"
        elif primary_sensor == "rpm":
            hint = "Possible spindle drive belt slipping or inverter frequency oscillation"
        elif primary_sensor == "power":
            hint = "Possible cutting tool resistance or excessive depth of cut"
        elif primary_sensor == "voltage":
            hint = "Possible mains line supply fluctuation or power bus disturbance"
        elif primary_sensor == "feed_rate":
            hint = "Possible axis drive servo lag or ball screw friction"

        return {
            "possible_cause": f"Possible root-cause hint: {hint}",
            "disclaimer": "Diagnostic hint only, not a certified failure diagnosis."
        }
