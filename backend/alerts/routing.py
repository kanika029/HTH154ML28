from typing import Dict, Any

class AlertRoutingEngine:
    def route_alert(self, severity: str, anomaly_type: str, machine_id: str) -> Dict[str, str]:
        if severity == "CRITICAL":
            return {
                "route": "URGENT",
                "responsible_team": "Operations / Maintenance",
                "reason": "Persistent multi-sensor anomaly or critical parameter breach requiring immediate operator response."
            }
        elif severity == "HIGH":
            return {
                "route": "MONITOR",
                "responsible_team": "Maintenance & Reliability",
                "reason": "Sustained parametric abnormality flagged for technical observation."
            }
        elif severity == "MEDIUM":
            return {
                "route": "MONITOR",
                "responsible_team": "Machining Cell Operator",
                "reason": "Moderate deviation requiring routine observation."
            }
        else: # LOW
            return {
                "route": "IGNORE",
                "responsible_team": "Diagnostics Log",
                "reason": "Low-severity transient spike logged without operator dispatch."
            }
