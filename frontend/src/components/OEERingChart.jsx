import React from 'react';
import { Gauge } from 'lucide-react';

export function OEERingChart({ availability = 94, performance = 91, quality = 98 }) {
  const oee = Math.round((availability * performance * quality) / 10000);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          Overall Equipment Effectiveness (OEE)
        </h3>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
          A × P × Q
        </span>
      </div>

      {/* SVG Donut Ring with 3 concentric arcs */}
      <div className="relative flex items-center justify-center my-1">
        <svg viewBox="0 0 160 160" className="w-36 h-36">
          {/* Background circles */}
          <circle cx="80" cy="80" r="62" fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle cx="80" cy="80" r="50" fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle cx="80" cy="80" r="38" fill="none" stroke="#1e293b" strokeWidth="8" />

          {/* Availability Ring (Outer - Cyan) */}
          <circle
            cx="80"
            cy="80"
            r="62"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="8"
            strokeDasharray="390"
            strokeDashoffset={390 - (390 * availability) / 100}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
            className="transition-all duration-700 ease-out"
          />

          {/* Performance Ring (Middle - Indigo) */}
          <circle
            cx="80"
            cy="80"
            r="50"
            fill="none"
            stroke="#6366f1"
            strokeWidth="8"
            strokeDasharray="314"
            strokeDashoffset={314 - (314 * performance) / 100}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
            className="transition-all duration-700 ease-out"
          />

          {/* Quality Ring (Inner - Emerald) */}
          <circle
            cx="80"
            cy="80"
            r="38"
            fill="none"
            stroke="#10b981"
            strokeWidth="8"
            strokeDasharray="238"
            strokeDashoffset={238 - (238 * quality) / 100}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center OEE percentage */}
        <div className="absolute flex flex-col items-center">
          <span className="text-xl font-black font-mono text-cyan-400">{oee}%</span>
          <span className="text-[9px] text-slate-400 font-mono">OEE Rate</span>
        </div>
      </div>

      {/* 3 Metric Pills */}
      <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-center">
        <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
          <span className="text-cyan-400 block font-bold">{availability}%</span>
          <span className="text-slate-500">Avail</span>
        </div>
        <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
          <span className="text-indigo-400 block font-bold">{performance}%</span>
          <span className="text-slate-500">Perf</span>
        </div>
        <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
          <span className="text-emerald-400 block font-bold">{quality}%</span>
          <span className="text-slate-500">Qual</span>
        </div>
      </div>
    </div>
  );
}
