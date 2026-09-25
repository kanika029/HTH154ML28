import React from 'react';

export function SeverityBadge({ severity, score }) {
  const sev = (severity || 'LOW').toUpperCase();

  const styles = {
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/50 glow-critical',
    HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
    LOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
  };

  const styleClass = styles[sev] || styles.LOW;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styleClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
      {sev} {score !== undefined && score !== null ? `(${score})` : ''}
    </span>
  );
}

const ROUTE_CONFIG = {
  URGENT:   { bg: 'bg-red-900/40 text-red-300 border-red-700/60',       emoji: '🔴', label: 'URGENT' },
  INSPECT:  { bg: 'bg-orange-900/40 text-orange-300 border-orange-700/60', emoji: '🟠', label: 'INSPECT' },
  OBSERVE:  { bg: 'bg-amber-900/40 text-amber-300 border-amber-700/60',   emoji: '🟡', label: 'OBSERVE' },
  LOG_ONLY: { bg: 'bg-slate-800 text-slate-400 border-slate-700',         emoji: '🟢', label: 'LOG ONLY' },
  // Legacy fallbacks
  MONITOR:  { bg: 'bg-blue-900/40 text-blue-300 border-blue-700/60',     emoji: '🟡', label: 'MONITOR' },
  IGNORE:   { bg: 'bg-slate-800 text-slate-400 border-slate-700',         emoji: '🟢', label: 'LOG ONLY' },
};

export function RouteBadge({ route }) {
  const r = (route || 'LOG_ONLY').toUpperCase();
  const cfg = ROUTE_CONFIG[r] || ROUTE_CONFIG.LOG_ONLY;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono border ${cfg.bg}`}>
      <span className="text-[10px]">{cfg.emoji}</span> {cfg.label}
    </span>
  );
}

// Response Tier Info for Alert Details
export const RESPONSE_TIERS = {
  CRITICAL: {
    emoji: '🔴',
    severity: 'CRITICAL',
    team: 'Maintenance Engineer + Production Supervisor',
    action: 'Take immediate action and check/stop the machine if required',
    route: 'URGENT',
  },
  HIGH: {
    emoji: '🟠',
    severity: 'HIGH',
    team: 'Maintenance Technician / Engineer',
    action: 'Inspect the machine and schedule maintenance',
    route: 'INSPECT',
  },
  MEDIUM: {
    emoji: '🟡',
    severity: 'MEDIUM',
    team: 'Machine Operator',
    action: 'Observe the machine and monitor the condition',
    route: 'OBSERVE',
  },
  LOW: {
    emoji: '🟢',
    severity: 'LOW',
    team: 'No immediate person',
    action: 'Log the event and continue monitoring',
    route: 'LOG_ONLY',
  },
};
