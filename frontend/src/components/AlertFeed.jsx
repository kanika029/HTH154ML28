import React from 'react';
import { AlertCircle, Eye, ShieldAlert } from 'lucide-react';
import { SeverityBadge, RouteBadge, RESPONSE_TIERS } from './SeverityBadge';

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

      {/* Response Tier Legend */}
      <div className="flex flex-wrap gap-3 mb-4 px-3 py-2 bg-slate-950/80 rounded-lg border border-slate-800/60">
        {Object.values(RESPONSE_TIERS).map((tier) => (
          <div key={tier.severity} className="flex items-center gap-1.5 text-[10px] font-mono">
            <span>{tier.emoji}</span>
            <span className="text-slate-400 font-bold">{tier.severity}:</span>
            <span className="text-slate-500">{tier.team}</span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-3">Time</th>
              <th className="py-3 px-3">Machine</th>
              <th className="py-3 px-3">Sensor</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Severity</th>
              <th className="py-3 px-3">Routing</th>
              <th className="py-3 px-3">Responsible Team</th>
              <th className="py-3 px-3">Action Required</th>
              <th className="py-3 px-3 text-center">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {!alerts || alerts.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-8 text-center text-slate-500 font-mono">
                  No active anomalies detected. All 3 CNC machines running nominal baseline parameters.
                </td>
              </tr>
            ) : (
              alerts.map((alert) => {
                const timeStr = new Date(alert.timestamp).toLocaleTimeString('en-US', { hour12: false });
                const tier = RESPONSE_TIERS[alert.severity] || RESPONSE_TIERS.LOW;
                const displayTeam = alert.responsible_team || tier.team;
                return (
                  <tr
                    key={alert.id}
                    onClick={() => onSelectAlert(alert)}
                    className={`hover:bg-slate-800/50 cursor-pointer transition ${alert.severity === 'CRITICAL' ? 'critical-row' : ''}`}
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">{timeStr}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">
                      {machineDisplay[alert.machine_id] || alert.machine_id}
                    </td>
                    <td className="py-2.5 px-3 capitalize font-mono text-slate-300">{alert.sensor}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-medium font-mono text-[11px] border border-slate-700">
                        {alert.anomaly_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <SeverityBadge severity={alert.severity} score={alert.severity_score} />
                    </td>
                    <td className="py-2.5 px-3">
                      <RouteBadge route={alert.routing} />
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-semibold text-slate-300 max-w-[160px] truncate" title={displayTeam}>
                      {displayTeam}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-400 max-w-[180px] truncate" title={tier.action}>
                      {tier.action}
                    </td>
                    <td className="py-2.5 px-3 text-center">
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
