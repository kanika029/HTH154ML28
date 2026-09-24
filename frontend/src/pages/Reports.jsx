import React, { useEffect, useState } from 'react';
import { FileText, ShieldCheck, PieChart, Activity, Award, ArrowLeft, RefreshCw } from 'lucide-react';
import { fetchReportSummary } from '../services/api';

export function ReportsPage({ onBack }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await fetchReportSummary();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  if (loading || !report) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 font-mono">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
          Generating End-of-Run Analytical Report...
        </div>
      </div>
    );
  }

  const durationMin = (report.monitoring_duration_seconds / 60).toFixed(1);
  const fatigue = report.fatigue_metrics || {};
  const det = report.detection_metrics || {};
  const anomB = report.anomaly_breakdown || {};
  const sevB = report.severity_breakdown || {};
  const routB = report.routing_breakdown || {};

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 mb-2 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Live Dashboard
          </button>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-3">
            <FileText className="w-7 h-7 text-blue-400" />
            SmartSense End-of-Run Analytical Report
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Empirical runtime performance, alert fatigue reduction, and ground-truth ML detection evaluation.
          </p>
        </div>

        <button
          onClick={loadReport}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Metrics
        </button>
      </div>

      {/* Top Key Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
          <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Run Duration</span>
          <h3 className="text-2xl font-bold text-slate-100 mt-1">{durationMin} mins</h3>
          <p className="text-[11px] text-slate-500 mt-1">{report.monitoring_duration_seconds} seconds total</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
          <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Total Sensor Readings</span>
          <h3 className="text-2xl font-bold text-slate-100 mt-1">{report.total_sensor_events}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Across 3 CNC machine streams</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
          <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Raw Anomalies Detected</span>
          <h3 className="text-2xl font-bold text-amber-400 mt-1">{report.total_anomalies_detected}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Stat + Isolation Forest</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
          <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Alert Fatigue Reduction</span>
          <h3 className="text-2xl font-bold text-emerald-400 mt-1">{fatigue.alert_reduction_pct}%</h3>
          <p className="text-[11px] text-slate-500 mt-1">{fatigue.suppressed_events} repeated alerts suppressed</p>
        </div>
      </div>

      {/* Grid Section 1: ML Ground Truth Accuracy & Fatigue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* ML Evaluation against Ground Truth Injections */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-blue-400" />
            Ground-Truth ML Detection Accuracy
          </h2>
          <p className="text-xs text-slate-400 mb-5">
            Empirical evaluation against simulated ground-truth anomaly injections.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-6 font-mono text-center">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[11px]">Precision</span>
              <p className="text-xl font-bold text-blue-400 mt-1">{(det.precision * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[11px]">Recall</span>
              <p className="text-xl font-bold text-emerald-400 mt-1">{(det.recall * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[11px]">F1 Score</span>
              <p className="text-xl font-bold text-purple-400 mt-1">{(det.f1_score * 100).toFixed(1)}%</p>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 text-xs font-mono space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">True Positives (Correctly Detected):</span>
              <span className="text-emerald-400 font-bold">{det.true_positives}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">False Positives (False Alarms):</span>
              <span className="text-rose-400 font-bold">{det.false_positives}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">False Negatives (Missed Anomaly):</span>
              <span className="text-amber-400 font-bold">{det.false_negatives}</span>
            </div>
          </div>
        </div>

        {/* Alert Fatigue Reduction Breakdown */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Alert Fatigue Triage Efficiency
          </h2>
          <p className="text-xs text-slate-400 mb-5">
            Deduplication and grouping of raw continuous sensor anomaly signals.
          </p>

          <div className="space-y-4 text-xs font-mono">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Raw Anomaly Events:</span>
              <span className="text-amber-400 font-bold text-sm">{fatigue.raw_anomaly_events}</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Meaningful Actionable Alerts:</span>
              <span className="text-blue-400 font-bold text-sm">{fatigue.meaningful_alerts}</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Suppressed Duplicate Signals:</span>
              <span className="text-emerald-400 font-bold text-sm">{fatigue.suppressed_events}</span>
            </div>

            <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-emerald-300">
              <p className="font-sans font-medium text-xs">
                ✨ SmartSense successfully eliminated <strong>{fatigue.alert_reduction_pct}%</strong> of raw alert noise, dispatching personnel only for distinct grouped incidents.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Section 2: Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Anomaly Breakdown */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
          <h3 className="text-sm font-bold text-slate-200 mb-4 font-mono uppercase flex items-center justify-between">
            <span>Anomaly Type</span>
            <span className="text-[11px] text-slate-500 normal-case font-normal">Classification</span>
          </h3>
          <div className="space-y-3 text-xs font-mono">
            {['SPIKE', 'DRIFT', 'DROPOUT', 'STUCK SENSOR'].map((type) => {
              const count = anomB[type] || 0;
              const totalAnom = Object.values(anomB).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round((count / totalAnom) * 100);
              return (
                <div key={type} className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-slate-300 font-semibold">{type}</span>
                    <span className="font-bold text-blue-400">{count} <span className="text-slate-500 text-[10px]">({pct}%)</span></span>
                  </div>
                  <div className="w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
          <h3 className="text-sm font-bold text-slate-200 mb-4 font-mono uppercase flex items-center justify-between">
            <span>Severity Tier</span>
            <span className="text-[11px] text-slate-500 normal-case font-normal">Explainable Scoring</span>
          </h3>
          <div className="space-y-3 text-xs font-mono">
            {[
              { name: 'CRITICAL', color: 'text-red-400', barColor: 'bg-red-500' },
              { name: 'HIGH', color: 'text-orange-400', barColor: 'bg-orange-500' },
              { name: 'MEDIUM', color: 'text-amber-400', barColor: 'bg-amber-500' },
              { name: 'LOW', color: 'text-emerald-400', barColor: 'bg-emerald-500' }
            ].map((sev) => {
              const count = sevB[sev.name] || 0;
              const totalSev = Object.values(sevB).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round((count / totalSev) * 100);
              return (
                <div key={sev.name} className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`font-semibold ${sev.color}`}>{sev.name}</span>
                    <span className="font-bold text-slate-200">{count} <span className="text-slate-500 text-[10px]">({pct}%)</span></span>
                  </div>
                  <div className="w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
                    <div className={`${sev.barColor} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Routing Breakdown */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
          <h3 className="text-sm font-bold text-slate-200 mb-4 font-mono uppercase flex items-center justify-between">
            <span>Alert Routing</span>
            <span className="text-[11px] text-slate-500 normal-case font-normal">Actionable Dispatch</span>
          </h3>
          <div className="space-y-3 text-xs font-mono">
            {[
              { name: 'URGENT', color: 'text-rose-400', barColor: 'bg-rose-500', desc: 'PagerDuty / Ops Escalation' },
              { name: 'MONITOR', color: 'text-blue-400', barColor: 'bg-blue-500', desc: 'Maintenance Watchlist' },
              { name: 'IGNORE', color: 'text-slate-400', barColor: 'bg-slate-500', desc: 'Logged Without Notification' }
            ].map((r) => {
              const count = routB[r.name] || 0;
              const totalRout = Object.values(routB).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round((count / totalRout) * 100);
              return (
                <div key={r.name} className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className={`font-semibold ${r.color}`}>{r.name}</span>
                    <span className="font-bold text-slate-200">{count} <span className="text-slate-500 text-[10px]">({pct}%)</span></span>
                  </div>
                  <div className="text-[10px] text-slate-500 mb-1.5 font-sans">{r.desc}</div>
                  <div className="w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
                    <div className={`${r.barColor} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
