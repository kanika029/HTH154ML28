import React, { useState } from 'react';
import { Play, Square, RotateCcw, Gauge, Thermometer, Activity, Zap, Power } from 'lucide-react';

const MACHINE_META = {
  'CNC-M01': {
    name: 'CNC-M01',
    subtitle: '3-Axis Vertical Milling Center',
    location: 'Cell Alpha — Bay 1',
    image: '/images/CNC-M01.jpg',
    accent: 'cyan',
  },
  'CNC-M02': {
    name: 'CNC-M02',
    subtitle: 'Horizontal Milling Center (HMC)',
    location: 'Cell Beta — Bay 2',
    image: '/images/CNC-M02.jpg',
    accent: 'amber',
  },
  'CNC-M03': {
    name: 'CNC-M03',
    subtitle: 'High-Precision CNC Lathe',
    location: 'Cell Gamma — Bay 3',
    image: '/images/CNC-M03.jpg',
    accent: 'emerald',
  },
};

const STATUS_STYLES = {
  NORMAL:   { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'RUNNING' },
  MEDIUM:   { bg: 'bg-amber-500/15',   border: 'border-amber-500/40',   text: 'text-amber-400',   dot: 'bg-amber-400',   label: 'CAUTION' },
  HIGH:     { bg: 'bg-orange-500/15',   border: 'border-orange-500/40',  text: 'text-orange-400',  dot: 'bg-orange-400',  label: 'WARNING' },
  CRITICAL: { bg: 'bg-red-500/15',      border: 'border-red-500/40',     text: 'text-red-400',     dot: 'bg-red-400',     label: 'CRITICAL' },
};

export function MachineCard({
  machineId,
  status = 'NORMAL',
  healthPct = 98,
  liveReadings = {},
  isSelected = false,
  onSelect,
  activeAlertCount = 0,
}) {
  const [machineState, setMachineState] = useState('RUNNING'); // RUNNING, STOPPED, RESTARTING
  const [feedOverride, setFeedOverride] = useState(100);

  const meta = MACHINE_META[machineId] || MACHINE_META['CNC-M01'];
  const st = STATUS_STYLES[status] || STATUS_STYLES.NORMAL;

  const handleStop = () => setMachineState('STOPPED');
  const handleStart = () => setMachineState('RUNNING');
  const handleRestart = () => {
    setMachineState('RESTARTING');
    setTimeout(() => setMachineState('RUNNING'), 1500);
  };

  return (
    <div
      onClick={() => onSelect && onSelect(machineId)}
      className={`relative bg-slate-900 rounded-xl border overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/60 group ${
        isSelected
          ? 'border-blue-500/60 shadow-lg shadow-blue-900/30 ring-1 ring-blue-500/30'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Machine Image */}
      <div className="relative h-36 overflow-hidden">
        <img
          src={meta.image}
          alt={meta.subtitle}
          className="w-full h-full object-cover object-center opacity-80 group-hover:opacity-95 transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

        {/* Status Badge */}
        <div className={`absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${st.bg} ${st.border} ${st.text} border backdrop-blur-sm`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${status === 'CRITICAL' ? 'animate-ping' : ''}`} />
          {st.label}
        </div>

        {/* Health Badge */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-950/80 border border-slate-700/60 text-[10px] font-mono font-bold text-slate-200 backdrop-blur-sm">
          {healthPct}% Health
        </div>

        {/* Alert Count */}
        {activeAlertCount > 0 && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-red-600/90 text-[10px] font-bold text-white font-mono animate-pulse">
            {activeAlertCount} Alert{activeAlertCount > 1 ? 's' : ''}
          </div>
        )}

        {/* Machine State Overlay */}
        {machineState === 'STOPPED' && (
          <div className="absolute inset-0 bg-red-950/60 flex items-center justify-center backdrop-blur-[2px]">
            <span className="px-3 py-1 rounded bg-red-900/80 border border-red-600 text-red-200 text-xs font-bold font-mono uppercase">⛔ Machine Stopped</span>
          </div>
        )}
        {machineState === 'RESTARTING' && (
          <div className="absolute inset-0 bg-blue-950/60 flex items-center justify-center backdrop-blur-[2px]">
            <span className="px-3 py-1 rounded bg-blue-900/80 border border-blue-600 text-blue-200 text-xs font-bold font-mono uppercase animate-pulse">🔄 Restarting…</span>
          </div>
        )}
      </div>

      {/* Machine Info */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-extrabold text-slate-100 font-mono">{meta.name}</h3>
          <span className={`text-[10px] font-mono font-semibold ${
            machineState === 'RUNNING' ? 'text-emerald-400' :
            machineState === 'STOPPED' ? 'text-red-400' : 'text-blue-400'
          }`}>● {machineState}</span>
        </div>
        <p className="text-[11px] text-slate-400 mb-0.5">{meta.subtitle}</p>
        <p className="text-[10px] text-slate-500 font-mono mb-2">{meta.location}</p>

        {/* Live Sensor Readings Mini */}
        <div className="grid grid-cols-3 gap-1.5 mb-2.5 text-[10px] font-mono">
          <div className="bg-slate-950 rounded px-1.5 py-1 border border-slate-800/60">
            <span className="text-slate-500 flex items-center gap-0.5"><Thermometer className="w-2.5 h-2.5" /> Temp</span>
            <span className="text-slate-200 font-bold">{liveReadings.temperature != null ? `${liveReadings.temperature.toFixed(1)}°C` : '—'}</span>
          </div>
          <div className="bg-slate-950 rounded px-1.5 py-1 border border-slate-800/60">
            <span className="text-slate-500 flex items-center gap-0.5"><Activity className="w-2.5 h-2.5" /> Vib</span>
            <span className="text-slate-200 font-bold">{liveReadings.vibration != null ? `${liveReadings.vibration.toFixed(2)}` : '—'}</span>
          </div>
          <div className="bg-slate-950 rounded px-1.5 py-1 border border-slate-800/60">
            <span className="text-slate-500 flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" /> Power</span>
            <span className="text-slate-200 font-bold">{liveReadings.power != null ? `${liveReadings.power.toFixed(1)}kW` : '—'}</span>
          </div>
        </div>

        {/* Machine Controls */}
        <div className="flex items-center gap-1.5 mb-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleStart(); }}
            disabled={machineState === 'RUNNING'}
            className="flex items-center gap-1 px-2 py-1 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-400 text-[10px] font-bold rounded border border-emerald-800/50 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Play className="w-2.5 h-2.5" /> Start
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleStop(); }}
            disabled={machineState === 'STOPPED'}
            className="flex items-center gap-1 px-2 py-1 bg-red-950/50 hover:bg-red-900/60 text-red-400 text-[10px] font-bold rounded border border-red-800/50 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Square className="w-2.5 h-2.5" /> Stop
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleRestart(); }}
            disabled={machineState === 'RESTARTING'}
            className="flex items-center gap-1 px-2 py-1 bg-blue-950/50 hover:bg-blue-900/60 text-blue-400 text-[10px] font-bold rounded border border-blue-800/50 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-2.5 h-2.5" /> Restart
          </button>
        </div>

        {/* Feed Rate Override Control */}
        <div className="flex items-center gap-2 bg-slate-950 rounded-lg px-2 py-1.5 border border-slate-800/60">
          <Gauge className="w-3 h-3 text-slate-500" />
          <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">Feed:</span>
          <input
            type="range"
            min="0"
            max="150"
            step="5"
            value={feedOverride}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => { e.stopPropagation(); setFeedOverride(Number(e.target.value)); }}
            className="flex-1 h-1 accent-blue-500 cursor-pointer"
          />
          <span className={`text-[10px] font-mono font-bold min-w-[32px] text-right ${
            feedOverride === 0 ? 'text-red-400' : feedOverride < 50 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {feedOverride}%
          </span>
        </div>
      </div>
    </div>
  );
}
