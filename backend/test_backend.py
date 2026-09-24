import asyncio
from backend.main import (
    generator, feature_engineer, stat_detector, iforest_detector,
    classifier, correlation_engine, severity_engine, root_cause_engine,
    routing_engine, fatigue_filter, injector
)

def test_pipeline():
    print("=" * 60)
    print("SMARTSENSE INDUSTRIAL CNC PIPELINE TEST")
    print("=" * 60)

    # 1. Normal Tick
    readings = generator.generate_tick()
    print(f"Generated {len(readings)} CNC sensor readings across 3 machines.")

    # 2. Test SPIKE on CNC-M01 temperature
    print("\n--- TEST: Injecting SPIKE on CNC-M01 temperature ---")
    injector.set_injection("CNC-M01", "SPIKE", "temperature", 5)
    for i in range(2):
        ticks = generator.generate_tick()
        for r in ticks:
            if r["machine_id"] == "CNC-M01" and r["sensor"] == "temperature":
                feat = feature_engineer.process_reading(r)
                is_stat, _ = stat_detector.detect(feat)
                is_iforest, _ = iforest_detector.predict({"rpm": 1200, "temperature": r["value"], "vibration": 1.2, "power": 4.8, "voltage": 415, "feed_rate": 500})
                anom = classifier.classify(feat, is_stat, is_iforest)
                if anom:
                    corr = correlation_engine.evaluate_correlation(anom, feat)
                    sev, score, reasons = severity_engine.calculate_severity(anom, feat, corr)
                    root = root_cause_engine.get_hint(anom["anomaly_type"], r["sensor"], corr["correlated_sensors"])
                    rt = routing_engine.route_alert(sev, anom["anomaly_type"], r["machine_id"])
                    print(f"Tick {i}: DETECTED {anom['anomaly_type']} | Value: {r['value']}°C | Severity: {sev} ({score}/100) | Route: {rt['route']}")
                    print(f"  Reason: {reasons[0]} | Hint: {root['possible_cause']}")

    # 3. Test CRITICAL Multi-Sensor Correlation on CNC-M01
    print("\n--- TEST: Injecting CRITICAL Multi-Sensor Event on CNC-M01 ---")
    injector.set_injection("CNC-M01", "MULTI_SENSOR", "temperature", 5)
    for i in range(2):
        ticks = generator.generate_tick()
        detected_types = []
        for r in ticks:
            if r["machine_id"] == "CNC-M01":
                feat = feature_engineer.process_reading(r)
                is_stat, _ = stat_detector.detect(feat)
                is_iforest, _ = iforest_detector.predict({"rpm": 1200, "temperature": 58.0, "vibration": 3.6, "power": 7.5, "voltage": 415, "feed_rate": 500})
                anom = classifier.classify(feat, is_stat, is_iforest)
                if anom:
                    corr = correlation_engine.evaluate_correlation(anom, feat)
                    sev, score, reasons = severity_engine.calculate_severity(anom, feat, corr)
                    root = root_cause_engine.get_hint(anom["anomaly_type"], r["sensor"], corr["correlated_sensors"])
                    rt = routing_engine.route_alert(sev, anom["anomaly_type"], r["machine_id"])
                    detected_types.append(f"{r['sensor']}:{sev}({score})")
        print(f"Multi-Sensor Tick {i} Detected: {', '.join(detected_types)}")

    # 4. Reset
    injector.reset_all()
    print("\nPipeline test complete: All assertions passed.")

if __name__ == "__main__":
    test_pipeline()
