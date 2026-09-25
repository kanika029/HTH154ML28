import React, { useState } from 'react';
import { Activity, ShieldCheck, Thermometer, Gauge, Zap, Wind, Cpu, AlertTriangle, Play, Square, RotateCcw } from 'lucide-react';
import { ThreeScene } from './ThreeScene';
import { controlMachine } from '../services/api';

const MACHINE_META = {
  'CNC-M01': { subtitle: '3-Axis Vertical Milling Center', location: 'Cell Alpha — Bay 1', accentBg: 'bg-blue-600', accentRing: 'ring-blue-500/30', accentBorder: 'border-blue-500/40' },
  'CNC-M02': { subtitle: 'Horizontal Milling Center (HMC)', location: 'Cell Beta — Bay 2',  accentBg: 'bg-amber-600', accentRing: 'ring-amber-500/30', accentBorder: 'border-amber-500/40' },
  'CNC-M03': { subtitle: 'High-Precision CNC Lathe',         location: 'Cell Gamma — Bay 3', accentBg: 'bg-emerald-600', accentRing: 'ring-emerald-500/30', accentBorder: 'border-emerald-500/40' },
};

const DOT_STATUS = (st) =>
  st === 'STOPPED'  ? 'bg-slate-500' :
  st === 'CRITICAL' ? 'bg-red-400 animate-ping' :
  st === 'HIGH'     ? 'bg-orange-400' :
  st === 'MEDIUM'   ? 'bg-amber-400' : 'bg-emerald-400';

const BADGE_STATUS = (st) =>
  st === 'STOPPED'  ? 'bg-slate-800 text-slate-400 border-slate-700' :
  st === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse' :
  st === 'HIGH'     ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' :
  st === 'MEDIUM'   ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' :
                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';

export function DigitalTwin({
  selectedMachine = 'CNC-M01',
  onSelectMachine,
  machineStatuses,
  machineHealth,
  liveReadings = [],
  activeAlerts = []
}) {
  const machines = [
    { id: 'CNC-M01' },
    { id: 'CNC-M02' },
    { id: 'CNC-M03' },
  ];

  // Per-machine control state
  const [machineStates, setMachineStates] = useState({ 'CNC-M01': 'RUNNING', 'CNC-M02': 'RUNNING', 'CNC-M03': 'RUNNING' });
  const [feedOverrides, setFeedOverrides] = useState({ 'CNC-M01': 100, 'CNC-M02': 100, 'CNC-M03': 100 });

  const machineState = machineStates[selectedMachine] || 'RUNNING';

  const handleStop = async () => {
    setMachineStates(prev => ({ ...prev, [selectedMachine]: 'STOPPED' }));
    try { await controlMachine(selectedMachine, 'STOP'); } catch (e) { console.error(e); }
  };

  const handleStart = async () => {
    setMachineStates(prev => ({ ...prev, [selectedMachine]: 'RUNNING' }));
    try { await controlMachine(selectedMachine, 'START'); } catch (e) { console.error(e); }
  };

  const handleRestart = async () => {
    setMachineStates(prev => ({ ...prev, [selectedMachine]: 'RESTARTING' }));
    try { await controlMachine(selectedMachine, 'RESTART'); } catch (e) { console.error(e); }
    setTimeout(() => setMachineStates(prev => ({ ...prev, [selectedMachine]: 'RUNNING' })), 1800);
  };

  const feedVal = feedOverrides[selectedMachine] ?? 100;

  // Filter live readings for selected machine
  const getReadings = (mId) => {
    const res = {};
    liveReadings.filter(r => r.machine_id === mId).forEach(r => { res[r.sensor] = r.value; });
    return res;
  };

  const isStopped = machineState === 'STOPPED';
  const currentReadings = getReadings(selectedMachine);
  const currentStatus = isStopped ? 'STOPPED' : (machineStatuses?.[selectedMachine] || 'NORMAL');
  const currentHealth = isStopped ? 100 : (machineHealth?.[selectedMachine] || 98);
  const machineAlerts = isStopped ? [] : activeAlerts.filter(a => a.machine_id === selectedMachine);
  const highestAlert = machineAlerts.length > 0
    ? machineAlerts.reduce((prev, curr) => (curr.severity_score > prev.severity_score ? curr : prev))
    : null;

  const severityScore = isStopped ? 0 : (highestAlert ? highestAlert.severity_score : (currentStatus === 'CRITICAL' ? 92 : currentStatus === 'HIGH' ? 68 : currentStatus === 'MEDIUM' ? 42 : 0));
  const route = isStopped ? 'LOG_ONLY' : (highestAlert ? highestAlert.routing : (currentStatus === 'CRITICAL' ? 'URGENT' : currentStatus === 'HIGH' || currentStatus === 'MEDIUM' ? 'INSPECT' : 'LOG_ONLY'));
  const rootCause = isStopped ? 'Machine is currently STOPPED / SHUT DOWN. Live severity scoring suspended while machine is offline.' : (highestAlert ? highestAlert.root_cause_hint : 'Nominal baseline operational parameters. No active faults.');

  const rpmVal   = isStopped ? '0 RPM' : (currentReadings.rpm         !== undefined ? (currentReadings.rpm         === null ? 'NULL' : `${currentReadings.rpm} RPM`)      : '1204 RPM');
  const tempVal  = isStopped ? '25.0°C' : (currentReadings.temperature  !== undefined ? (currentReadings.temperature  === null ? 'NULL' : `${currentReadings.temperature}°C`) : '32.4°C');
  const vibVal   = isStopped ? '0.00 mm/s' : (currentReadings.vibration    !== undefined ? (currentReadings.vibration    === null ? 'NULL' : `${currentReadings.vibration} mm/s`) : '1.22 mm/s');
  const powerVal = isStopped ? '0.00 kW' : (currentReadings.power        !== undefined ? (currentReadings.power        === null ? 'NULL' : `${currentReadings.power} kW`)      : '4.82 kW');
  const voltVal  = isStopped ? '0.0 V' : (currentReadings.voltage      !== undefined ? (currentReadings.voltage      === null ? 'NULL' : `${currentReadings.voltage} V`)      : '415.2 V');
  const feedRateVal = isStopped ? '0 mm/min' : (currentReadings.feed_rate !== undefined ? (currentReadings.feed_rate    === null ? 'NULL' : `${currentReadings.feed_rate} mm/min`) : '501 mm/min');

  const meta = MACHINE_META[selectedMachine] || MACHINE_META['CNC-M01'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl mb-6">
      {/* Header + Machine Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            3D CNC Digital Twin &amp; Physical Telemetry Topology
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive WebGL replica — each machine has a distinct visual shape. Select below to switch.
          </p>
        </div>

        {/* Machine Selector Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          {machines.map((m) => {
            const isSel = selectedMachine === m.id;
            const st = machineStatuses?.[m.id] || 'NORMAL';
            const mm = MACHINE_META[m.id];
            const alertCount = activeAlerts.filter(a => a.machine_id === m.id).length;
            return (
              <button
                key={m.id}
                onClick={() => onSelectMachine(m.id)}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold transition ${
                  isSel ? `${mm.accentBg} text-white shadow ring-2 ${mm.accentRing}` : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${DOT_STATUS(st)}`} />
                {m.id}
                {alertCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Machine subtitle strip */}
      <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg border mb-4 ${meta.accentBorder} bg-slate-950/50`}>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-300 font-bold">{selectedMachine}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">{meta.subtitle}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-500">{meta.location}</span>
        </div>
        <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${BADGE_STATUS(currentStatus)}`}>
          {currentStatus}
        </span>
      </div>

      {/* Main Grid: 3D Viewport + HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 3D Viewport (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <ThreeScene
            machineId={selectedMachine}
            status={machineState === 'STOPPED' ? 'OFFLINE' : machineState === 'RESTARTING' ? 'NORMAL' : currentStatus}
            rpm={machineState === 'STOPPED' ? 0 : (currentReadings.rpm || 1200)}
            feedRate={Math.round((currentReadings.feed_rate || 500) * feedVal / 100)}
            height="360px"
          />

          {/* Machine Controls — below the 3D view */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex flex-wrap items-center gap-4">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Machine Controls</span>

            {/* Start / Stop / Restart */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleStart}
                disabled={machineState === 'RUNNING' || machineState === 'RESTARTING'}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-800/60 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Play className="w-3 h-3" /> Start
              </button>
              <button
                onClick={handleStop}
                disabled={machineState === 'STOPPED' || machineState === 'RESTARTING'}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/60 hover:bg-red-900/70 text-red-400 text-xs font-bold rounded-lg border border-red-800/60 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Square className="w-3 h-3" /> Stop
              </button>
              <button
                onClick={handleRestart}
                disabled={machineState === 'RESTARTING'}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-950/60 hover:bg-blue-900/70 text-blue-400 text-xs font-bold rounded-lg border border-blue-800/60 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3 h-3" /> Restart
              </button>
              <span className={`ml-2 text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                machineState === 'RUNNING' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50' :
                machineState === 'STOPPED' ? 'bg-red-950/60 text-red-400 border border-red-800/50' :
                'bg-blue-950/60 text-blue-400 border border-blue-800/50 animate-pulse'
              }`}>
                ● {machineState}
              </span>
            </div>

            {/* Feed Rate Override */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Gauge className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">Feed Override:</span>
              <input
                type="range"
                min="0"
                max="150"
                step="5"
                value={feedVal}
                onChange={(e) => setFeedOverrides(prev => ({ ...prev, [selectedMachine]: Number(e.target.value) }))}
                className="flex-1 h-1 accent-blue-500 cursor-pointer"
              />
              <span className={`text-xs font-mono font-bold min-w-[36px] text-right ${
                feedVal === 0 ? 'text-red-400' : feedVal < 50 ? 'text-amber-400' : feedVal > 120 ? 'text-orange-400' : 'text-emerald-400'
              }`}>
                {feedVal}%
              </span>
            </div>
          </div>
        </div>

        {/* HUD Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between text-xs">
          <div>
            {/* Severity & Routing Summary */}
            <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 mb-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono">Overall Health:</span>
                <span className={`font-bold font-mono text-sm ${currentHealth >= 80 ? 'text-emerald-400' : currentHealth >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                  {currentHealth}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono">Severity Score:</span>
                <span className="font-bold font-mono text-slate-200">{severityScore}/100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono">Triage Routing:</span>
                <span className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] ${
                  route === 'URGENT'  ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                  route === 'INSPECT' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                  route === 'OBSERVE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                  route === 'MONITOR' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {route}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono">Active Anomalies:</span>
                <span className={`font-bold font-mono ${machineAlerts.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {machineAlerts.length} Active
                </span>
              </div>
            </div>

            {/* Live 6-Sensor Grid */}
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px] mb-3">
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1"><Gauge className="w-3 h-3 text-purple-400" /> RPM</span>
                <strong className="text-slate-200">{rpmVal}</strong>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1"><Thermometer className="w-3 h-3 text-rose-400" /> Temp</span>
                <strong className={currentReadings.temperature >= 45 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}>{tempVal}</strong>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1"><Activity className="w-3 h-3 text-amber-400" /> Vib</span>
                <strong className={currentReadings.vibration >= 1.8 ? 'text-amber-400 animate-pulse' : 'text-slate-200'}>{vibVal}</strong>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1"><Zap className="w-3 h-3 text-sky-400" /> Power</span>
                <strong className={currentReadings.power >= 6.5 ? 'text-sky-400 animate-pulse' : 'text-slate-200'}>{powerVal}</strong>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Volt</span>
                <strong className="text-slate-200">{voltVal}</strong>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Feed</span>
                <strong className="text-slate-200">{feedRateVal}</strong>
              </div>
            </div>
          </div>

          {/* Root Cause Hint */}
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-2.5 text-[11px]">
            <span className="text-amber-400 font-bold block mb-0.5">Root-Cause Recommendation:</span>
            <p className="text-slate-300 leading-snug">{rootCause}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
