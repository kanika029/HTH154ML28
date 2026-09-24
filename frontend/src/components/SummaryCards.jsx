import React from 'react';
import { Activity, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';

export function SummaryCards({ fatigueStats, activeAlerts, machines }) {
  const totalMachines = machines ? machines.length : 3;
  const activeAlertsCount = activeAlerts ? activeAlerts.length : 0;
  const criticalCount = activeAlerts ? activeAlerts.filter(a => a.severity === 'CRITICAL').length : 0;

  const rawEvents = fatigueStats?.raw_anomaly_events || 0;
  const meaningfulAlerts = fatigueStats?.meaningful_alerts || 0;
  const suppressedCount = fatigueStats?.suppressed_events || 0;
  const reductionPct = fatigueStats?.alert_reduction_pct || 0.0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Machines */}
      <div className="shimmer-hover bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-lg shadow-slate-950/50 transition">
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
          <Cpu className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Machines</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-100">{totalMachines}</h3>
            <span className="text-xs text-emerald-400 font-medium">100% Operational</span>
          </div>
        </div>
      </div>

      {/* Active Anomalies */}
      <div className="shimmer-hover bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-lg shadow-slate-950/50 transition">
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Anomalies</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-100">{activeAlertsCount}</h3>
            <span className="text-xs text-slate-400">Tracked Streams</span>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="shimmer-hover bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-lg shadow-slate-950/50 transition">
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Critical Alerts</p>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-2xl font-bold ${criticalCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-100'}`}>
              {criticalCount}
            </h3>
            <span className="text-xs text-slate-400">Urgent Routing</span>
          </div>
        </div>
      </div>

      {/* Alerts Suppressed / Fatigue Filter */}
      <div className="shimmer-hover bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-lg shadow-slate-950/50 transition">
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Noise Reduction</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-emerald-400">{reductionPct}%</h3>
            <span className="text-xs text-slate-400">{suppressedCount} Suppressed</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {rawEvents} raw → {meaningfulAlerts} meaningful
          </p>
        </div>
      </div>
    </div>
  );
}
