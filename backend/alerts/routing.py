from typing import Dict, Any

class AlertRoutingEngine:
    def route_alert(self, severity: str, anomaly_type: str, machine_id: str) -> Dict[str, str]:
        if severity == "CRITICAL":
            return {
                "route": "URGENT",
                "responsible_team": "Maintenance Engineer + Production Supervisor",
                "action": "Take immediate action and check/stop the machine if required",
                "reason": "Persistent multi-sensor anomaly or critical parameter breach requiring immediate operator response."
            }
        elif severity == "HIGH":
            return {
                "route": "INSPECT",
                "responsible_team": "Maintenance Technician / Engineer",
                "action": "Inspect the machine and schedule maintenance",
                "reason": "Sustained parametric abnormality flagged for technical observation."
            }
        elif severity == "MEDIUM":
            return {
                "route": "OBSERVE",
                "responsible_team": "Machine Operator",
                "action": "Observe the machine and monitor the condition",
                "reason": "Moderate deviation requiring routine observation."
            }
        else: # LOW
            return {
                "route": "LOG_ONLY",
                "responsible_team": "No immediate person",
                "action": "Log the event and continue monitoring",
                "reason": "Low-severity transient spike logged without operator dispatch."
            }
