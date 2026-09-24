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

export function RouteBadge({ route }) {
  const r = (route || 'LOG').toUpperCase();

  const styles = {
    URGENT: 'bg-red-900/40 text-red-300 border-red-700/60',
    MONITOR: 'bg-blue-900/40 text-blue-300 border-blue-700/60',
    IGNORE: 'bg-slate-800 text-slate-400 border-slate-700',
  };

  const styleClass = styles[r] || styles.IGNORE;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${styleClass}`}>
      {r}
    </span>
  );
}
