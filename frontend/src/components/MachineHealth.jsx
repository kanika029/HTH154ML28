import React from 'react';
import { Activity, ShieldCheck, Thermometer, Zap, AlertTriangle } from 'lucide-react';

export function MachineHealth({ healthPercent = 98, status = 'NORMAL', temperature = 32.4, vibration = 1.22, power = 4.82 }) {
  const health = Math.max(0, Math.min(100, healthPercent || 98));

  // Determine health zone
  const getZone = (val) => {
    if (val >= 90) return { label: 'EXCELLENT', color: '#10b981', textClass: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    if (val >= 70) return { label: 'GOOD', color: '#eab308', textClass: 'text-yellow-400', bg: 'bg-yellow-500/10' };
    if (val >= 30) return { label: 'DEGRADED', color: '#f97316', textClass: 'text-orange-400', bg: 'bg-orange-500/10' };
    return { label: 'CRITICAL', color: '#ef4444', textClass: 'text-red-400', bg: 'bg-red-500/10' };
  };

  const zone = getZone(health);

  // SVG Gauge calculations (semicircle from 180° to 0°)
  // Angle: health 0 = -180 deg (left), health 100 = 0 deg (right)
  const angle = -180 + (health / 100) * 180;
  const needleRad = (angle * Math.PI) / 180;
  const cx = 100;
  const cy = 90;
  const r = 70;
  const needleLen = 58;
  const needleX = cx + needleLen * Math.cos(needleRad);
  const needleY = cy + needleLen * Math.sin(needleRad);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Operational Health Indicator
        </h3>
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-slate-700 ${zone.textClass}`}>
          {zone.label}
        </span>
      </div>

      {/* Semicircular SVG Gauge */}
      <div className="relative flex items-center justify-center my-1">
        <svg viewBox="0 0 200 115" className="w-48 h-28">
          <defs>
            <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="30%" stopColor="#f97316" />
              <stop offset="70%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Background Arc */}
          <path
            d="M 30 90 A 70 70 0 0 1 170 90"
            fill="none"
            stroke="#1e293b"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Active Gradient Arc */}
          <path
            d="M 30 90 A 70 70 0 0 1 170 90"
            fill="none"
            stroke="url(#healthGrad)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="220"
            strokeDashoffset={220 - (220 * health) / 100}
            className="transition-all duration-700 ease-out"
          />

          {/* Pivot Center */}
          <circle cx={cx} cy={cy} r="6" fill="#0f172a" stroke="#64748b" strokeWidth="2" />

          {/* Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={needleX}
            y2={needleY}
            stroke="#f8fafc"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Digital Percentage */}
        <div className="absolute bottom-1 flex flex-col items-center">
          <span className={`text-2xl font-black font-mono tracking-tight ${zone.textClass}`}>
            {health}%
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Health Index</span>
        </div>
      </div>

      {/* Diagnostics List */}
      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
        <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60 flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-rose-400" /> Core
          </span>
          <span className={temperature >= 45 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
            {temperature}°C
          </span>
        </div>

        <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60 flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1">
            <Activity className="w-3 h-3 text-amber-400" /> Vib
          </span>
          <span className={vibration >= 1.8 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
            {vibration} mm/s
          </span>
        </div>

        <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60 flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-sky-400" /> Power
          </span>
          <span className={power >= 6.5 ? 'text-sky-400 font-bold' : 'text-slate-200'}>
            {power} kW
          </span>
        </div>

        <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60 flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> State
          </span>
          <span className="text-slate-200 font-bold">
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}
