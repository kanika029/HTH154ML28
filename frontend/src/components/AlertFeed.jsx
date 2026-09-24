import React from 'react';
import { AlertCircle, Eye, ShieldAlert } from 'lucide-react';
import { SeverityBadge, RouteBadge } from './SeverityBadge';

export function AlertFeed({ alerts, onSelectAlert }) {
  const machineDisplay = {
    'CNC-M01': 'CNC-M01 (Milling)',
    'CNC-M02': 'CNC-M02 (Horizontal)',
    'CNC-M03': 'CNC-M03 (Lathe)'
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            Live Severity-Aware Anomaly & Alert Feed
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Deduplicated, triaged industrial alerts grouped to eliminate alert fatigue. Click any row for deep diagnostics.
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 bg-slate-950 text-slate-400 rounded-lg border border-slate-800">
          {alerts ? alerts.length : 0} Active / Recent Alerts
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4">Machine</th>
              <th className="py-3 px-4">Sensor</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Routing</th>
              <th className="py-3 px-4">Root Cause Hint</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {!alerts || alerts.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-slate-500 font-mono">
                  No active anomalies detected. All 3 CNC machines running nominal baseline parameters.
                </td>
              </tr>
            ) : (
              alerts.map((alert) => {
                const timeStr = new Date(alert.timestamp).toLocaleTimeString('en-US', { hour12: false });
                return (
                  <tr
                    key={alert.id}
                    onClick={() => onSelectAlert(alert)}
                    className={`hover:bg-slate-800/50 cursor-pointer transition ${alert.severity === 'CRITICAL' ? 'critical-row' : ''}`}
                  >
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">{timeStr}</td>
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {machineDisplay[alert.machine_id] || alert.machine_id}
                    </td>
                    <td className="py-3 px-4 capitalize font-mono text-slate-300">{alert.sensor}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-medium font-mono text-[11px] border border-slate-700">
                        {alert.anomaly_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <SeverityBadge severity={alert.severity} score={alert.severity_score} />
                    </td>
                    <td className="py-3 px-4">
                      <RouteBadge route={alert.routing} />
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={alert.root_cause_hint}>
                      {alert.root_cause_hint ? alert.root_cause_hint.replace('Possible cause: ', '') : 'System monitor'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAlert(alert);
                        }}
                        className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition"
                        title="View Full Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
