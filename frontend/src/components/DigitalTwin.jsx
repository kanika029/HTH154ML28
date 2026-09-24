import React from 'react';
import { Activity, ShieldCheck, Thermometer, Gauge, Zap, Wind, Cpu, AlertTriangle } from 'lucide-react';
import { ThreeScene } from './ThreeScene';

export function DigitalTwin({
  selectedMachine = 'CNC-M01',
  onSelectMachine,
  machineStatuses,
  machineHealth,
  liveReadings = [],
  activeAlerts = []
}) {
  const machines = [
    { id: 'CNC-M01', name: 'CNC-M01', subtitle: '3-Axis Vertical Milling Center • Primary Spindle' },
    { id: 'CNC-M02', name: 'CNC-M02', subtitle: 'Horizontal Milling Center • Cell Beta' },
    { id: 'CNC-M03', name: 'CNC-M03', subtitle: 'High-Precision Lathe • Cell Gamma' }
  ];

  // Filter live readings for selected machine
  const getReadings = (mId) => {
    const res = {};
    liveReadings.filter(r => r.machine_id === mId).forEach(r => {
      res[r.sensor] = r.value;
    });
    return res;
  };

  const currentReadings = getReadings(selectedMachine);
  const currentStatus = machineStatuses ? (machineStatuses[selectedMachine] || 'NORMAL') : 'NORMAL';
  const currentHealth = machineHealth ? (machineHealth[selectedMachine] || 98) : 98;

  // Active alerts for this machine
  const machineAlerts = activeAlerts.filter(a => a.machine_id === selectedMachine);
  const highestAlert = machineAlerts.length > 0
    ? machineAlerts.reduce((prev, curr) => (curr.severity_score > prev.severity_score ? curr : prev))
    : null;

  const severityScore = highestAlert ? highestAlert.severity_score : (currentStatus === 'CRITICAL' ? 92 : currentStatus === 'HIGH' ? 68 : currentStatus === 'MEDIUM' ? 42 : 0);
  const route = highestAlert ? highestAlert.routing : (currentStatus === 'CRITICAL' ? 'URGENT' : currentStatus === 'HIGH' || currentStatus === 'MEDIUM' ? 'MONITOR' : 'IGNORE');
  const rootCause = highestAlert ? highestAlert.root_cause_hint : 'Nominal baseline operational parameters. No active faults.';

  // Sensor values with units
  const rpmVal = currentReadings.rpm !== undefined ? (currentReadings.rpm === null ? 'NULL' : `${currentReadings.rpm} RPM`) : '1204 RPM';
  const tempVal = currentReadings.temperature !== undefined ? (currentReadings.temperature === null ? 'NULL' : `${currentReadings.temperature}°C`) : '32.4°C';
  const vibVal = currentReadings.vibration !== undefined ? (currentReadings.vibration === null ? 'NULL' : `${currentReadings.vibration} mm/s`) : '1.22 mm/s';
  const powerVal = currentReadings.power !== undefined ? (currentReadings.power === null ? 'NULL' : `${currentReadings.power} kW`) : '4.82 kW';
  const voltVal = currentReadings.voltage !== undefined ? (currentReadings.voltage === null ? 'NULL' : `${currentReadings.voltage} V`) : '415.2 V';
  const feedVal = currentReadings.feed_rate !== undefined ? (currentReadings.feed_rate === null ? 'NULL' : `${currentReadings.feed_rate} mm/min`) : '501 mm/min';

  const getStatusBadge = (st) => {
    switch (st) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'MEDIUM':
      case 'MONITOR':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl mb-6">
      {/* Header and Machine Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            3D CNC Digital Twin & Physical Telemetry Topology
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive WebGL replica reflecting real-time physical spindle state and SmartSense operational triage.
          </p>
        </div>

        {/* Machine Switcher Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          {machines.map((m) => {
            const isSel = selectedMachine === m.id;
            const st = machineStatuses ? (machineStatuses[m.id] || 'NORMAL') : 'NORMAL';
            return (
              <button
                key={m.id}
                onClick={() => onSelectMachine(m.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold transition ${
                  isSel
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  st === 'CRITICAL' ? 'bg-red-400 animate-ping' :
                  st === 'HIGH' ? 'bg-orange-400' :
                  st === 'MEDIUM' ? 'bg-amber-400' : 'bg-emerald-400'
                }`}></span>
                {m.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: 3D Three.js Viewport on Left, Telemetry & Status HUD on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 3D WebGL Viewport (8 Cols) */}
        <div className="lg:col-span-8">
          <ThreeScene
            status={currentStatus}
            rpm={currentReadings.rpm || 1200}
            feedRate={currentReadings.feed_rate || 500}
            height="380px"
          />
        </div>

        {/* Machine Status & Telemetry HUD Card (4 Cols - Section 22 Specs) */}
        <div className="lg:col-span-4 bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between text-xs">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-100 font-mono tracking-tight">
                  {selectedMachine}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Vertical Machining Center • CAT-40
                </p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase border ${getStatusBadge(currentStatus)}`}>
                {currentStatus}
              </span>
            </div>

            {/* Severity & Routing Summary Card */}
            <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 mb-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono">Overall Health:</span>
                <span className={`font-bold font-mono text-sm ${currentHealth >= 80 ? 'text-emerald-400' : currentHealth >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                  {currentHealth}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono">Severity Score:</span>
                <span className="font-bold font-mono text-slate-200">
                  {severityScore}/100
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono">Triage Routing:</span>
                <span className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] ${
                  route === 'URGENT' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
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

            {/* Live 6-Sensor Telemetry Grid */}
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px] mb-3">
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-purple-400" /> RPM
                </span>
                <strong className="text-slate-200">{rpmVal}</strong>
              </div>

              <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-rose-400" /> Temp
                </span>
                <strong className={currentReadings.temperature >= 45 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}>
                  {tempVal}
                </strong>
              </div>

              <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-amber-400" /> Vib
                </span>
                <strong className={currentReadings.vibration >= 1.8 ? 'text-amber-400 animate-pulse' : 'text-slate-200'}>
                  {vibVal}
                </strong>
              </div>

              <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-sky-400" /> Power
                </span>
                <strong className={currentReadings.power >= 6.5 ? 'text-sky-400 animate-pulse' : 'text-slate-200'}>
                  {powerVal}
                </strong>
              </div>

              <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Volt</span>
                <strong className="text-slate-200">{voltVal}</strong>
              </div>

              <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Feed</span>
                <strong className="text-slate-200">{feedVal}</strong>
              </div>
            </div>
          </div>

          {/* Possible Root Cause Hint Box (Section 16 & 22) */}
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-2.5 text-[11px]">
            <span className="text-amber-400 font-bold block mb-0.5">
              Root-Cause Recommendation:
            </span>
            <p className="text-slate-300 leading-snug">
              {rootCause}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
