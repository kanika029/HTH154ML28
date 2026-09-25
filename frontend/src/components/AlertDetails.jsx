import React from 'react';
import { X, ShieldAlert, Clock, UserCheck, Activity, Info, Cpu, Thermometer } from 'lucide-react';
import { SeverityBadge, RouteBadge } from './SeverityBadge';

export function AlertDetails({ alert, onClose }) {
  if (!alert) return null;

  let reasons = [];
  try {
    reasons = typeof alert.reasons === 'string' ? JSON.parse(alert.reasons) : (alert.reasons || []);
  } catch (e) {
    reasons = [];
  }

  let correlated = [];
  try {
    correlated = typeof alert.correlated_sensors === 'string' ? JSON.parse(alert.correlated_sensors) : (alert.correlated_sensors || []);
  } catch (e) {
    correlated = [];
  }

  const machineNames = {
    'CNC-M01': 'CNC-M01 (3-Axis Vertical Milling Center)',
    'CNC-M02': 'CNC-M02 (Horizontal Milling Center)',
    'CNC-M03': 'CNC-M03 (High-Precision Lathe)'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-slate-200 overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Alert Triage Deep Diagnostic #{alert.id}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {new Date(alert.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Severity Banner */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">Severity Assessment</span>
            <div className="flex items-center gap-3 mt-1">
              <SeverityBadge severity={alert.severity} score={alert.severity_score} />
              <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    alert.severity === 'CRITICAL' ? 'bg-red-500' :
                    alert.severity === 'HIGH' ? 'bg-orange-500' :
                    alert.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${alert.severity_score}%` }}
                ></div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-300">{alert.severity_score}/100</span>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">Triage Routing</span>
            <div className="flex items-center gap-2 mt-1">
              <RouteBadge route={alert.routing} />
              <span className="text-xs font-semibold text-blue-400 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> {alert.responsible_team}
              </span>
            </div>
          </div>
        </div>

        {/* Grid Parameters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500">Machine</span>
            <p className="font-bold text-slate-200 mt-0.5 truncate">{machineNames[alert.machine_id] || alert.machine_id}</p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500">Sensor</span>
            <p className="font-bold text-slate-200 capitalize mt-0.5">{alert.sensor}</p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500">Current Value</span>
            <p className="font-bold text-amber-400 mt-0.5">
              {alert.current_value !== null && alert.current_value !== undefined ? alert.current_value : 'NULL (Dropout)'}
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500">Baseline Range</span>
            <p className="font-bold text-emerald-400 mt-0.5">{alert.normal_range || 'Nominal'}</p>
          </div>
        </div>

        {/* Diagnostic Sections */}
        <div className="space-y-3 text-xs">
          {/* Explanation */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <h4 className="font-bold text-slate-300 flex items-center gap-1.5 mb-1">
              <Info className="w-4 h-4 text-blue-400" /> Context & Correlation Explanation
            </h4>
            <p className="text-slate-400 leading-relaxed">{alert.explanation}</p>
          </div>

          {/* Root Cause Hint */}
          <div className="bg-amber-950/20 p-3.5 rounded-xl border border-amber-800/40 text-amber-200/90">
            <h4 className="font-bold flex items-center gap-1.5 mb-1 text-amber-400">
              <Activity className="w-4 h-4" /> Root-Cause Recommendation Hint
            </h4>
            <p className="font-medium">{alert.root_cause_hint}</p>
          </div>

          {/* Contributing Reasons & Correlated Sensors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <h4 className="font-bold text-slate-300 mb-2 font-mono uppercase text-[11px]">Severity Scoring Breakdown</h4>
              <ul className="space-y-1 text-slate-400">
                {reasons.length > 0 ? reasons.map((r, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> {r}
                  </li>
                )) : <li>Standard statistical deviation</li>}
              </ul>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <h4 className="font-bold text-slate-300 mb-2 font-mono uppercase text-[11px]">Correlated Sensors</h4>
              {correlated.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {correlated.map((c, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">Single sensor isolated anomaly</p>
              )}
            </div>
          </div>

          {/* Response Tier Action Card */}
          <div className={`p-4 rounded-xl border ${
            alert.severity === 'CRITICAL' ? 'bg-red-950/30 border-red-800/50' :
            alert.severity === 'HIGH' ? 'bg-orange-950/30 border-orange-800/50' :
            alert.severity === 'MEDIUM' ? 'bg-amber-950/30 border-amber-800/50' :
            'bg-emerald-950/30 border-emerald-800/50'
          }`}>
            <h4 className="font-bold text-slate-200 mb-2 font-mono uppercase text-[11px] flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" /> Response Tier Assignment
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
              <div>
                <span className="text-slate-500 font-mono">SEVERITY</span>
                <p className="font-bold mt-0.5">{
                  alert.severity === 'CRITICAL' ? '🔴 CRITICAL' :
                  alert.severity === 'HIGH' ? '🟠 HIGH' :
                  alert.severity === 'MEDIUM' ? '🟡 MEDIUM' : '🟢 LOW'
                }</p>
              </div>
              <div>
                <span className="text-slate-500 font-mono">RESPONSIBLE</span>
                <p className="font-bold mt-0.5 text-blue-300">{alert.responsible_team || 'No immediate person'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-mono">REQUIRED ACTION</span>
                <p className="font-bold mt-0.5 text-slate-200">{
                  alert.severity === 'CRITICAL' ? 'Take immediate action and check/stop the machine if required' :
                  alert.severity === 'HIGH' ? 'Inspect the machine and schedule maintenance' :
                  alert.severity === 'MEDIUM' ? 'Observe the machine and monitor the condition' :
                  'Log the event and continue monitoring'
                }</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-mono">
            Suppressed duplicate raw events: <strong className="text-slate-300">{alert.suppressed_count || 0}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
