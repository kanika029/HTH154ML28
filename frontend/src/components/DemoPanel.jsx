import React, { useState } from 'react';
import { Play, RotateCcw, Zap, TrendingUp, AlertOctagon, HelpCircle, PauseCircle, Layers } from 'lucide-react';
import { injectAnomaly, resetDemo, triggerFloodAlerts } from '../services/api';

export function DemoPanel({ selectedMachine = 'CNC-M01', onTriggerComplete }) {
  const [targetMachine, setTargetMachine] = useState(selectedMachine || 'CNC-M01');
  const [targetSensor, setTargetSensor] = useState('temperature');
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  const handleInject = async (type) => {
    setLoading(true);
    try {
      if (type === 'NORMAL') {
        await injectAnomaly(targetMachine, 'NORMAL', targetSensor);
        setLastAction(`Restored ${targetMachine} to NORMAL baseline operation.`);
      } else if (type === 'ALERT_FLOOD') {
        await triggerFloodAlerts(targetMachine, targetSensor);
        setLastAction(`Generated ALERT FLOOD (25 rapid raw events) on ${targetMachine} (${targetSensor}). Observe fatigue grouping & >90% noise reduction.`);
      } else {
        await injectAnomaly(targetMachine, type, targetSensor, 20);
        setLastAction(`Injected ${type} anomaly into ${targetMachine} [${targetSensor.toUpperCase()}]. Pipeline triage engaged.`);
      }
      if (onTriggerComplete) onTriggerComplete();
    } catch (err) {
      console.error(err);
      setLastAction(`Failed to execute ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAll = async () => {
    setLoading(true);
    try {
      await resetDemo();
      setLastAction('All CNC machines, active anomalies, and alert states reset to nominal baseline.');
      if (onTriggerComplete) onTriggerComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-blue-500/40 rounded-xl p-4 mb-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600/20 text-blue-400 text-[10px] font-mono uppercase tracking-wider rounded-bl border-b border-l border-blue-500/30 font-bold">
        DEMO MODE • Real-Time Pipeline Control
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            Industrial Anomaly Injection & Scenario Simulator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Inject live physical deviations into the backend stream to evaluate classification, severity scoring, and alert fatigue reduction.
          </p>
        </div>

        {/* Machine & Sensor Selectors */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-500 font-mono">Machine:</span>
            <select
              value={targetMachine}
              onChange={(e) => setTargetMachine(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer font-mono"
            >
              <option value="CNC-M01" className="bg-slate-900">CNC-M01 (Milling Center)</option>
              <option value="CNC-M02" className="bg-slate-900">CNC-M02 (Horizontal)</option>
              <option value="CNC-M03" className="bg-slate-900">CNC-M03 (Lathe)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-500 font-mono">Sensor:</span>
            <select
              value={targetSensor}
              onChange={(e) => setTargetSensor(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer font-mono"
            >
              <option value="temperature" className="bg-slate-900">Temperature (°C)</option>
              <option value="vibration" className="bg-slate-900">Vibration (mm/s)</option>
              <option value="rpm" className="bg-slate-900">Spindle Speed (RPM)</option>
              <option value="power" className="bg-slate-900">Power Draw (kW)</option>
              <option value="voltage" className="bg-slate-900">Line Voltage (V)</option>
              <option value="feed_rate" className="bg-slate-900">Feed Rate (mm/min)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Button Grid with All 8 Required Hackathon Actions (Section 9 & 19) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mt-4 font-mono text-xs">
        {/* [ NORMAL ] */}
        <button
          disabled={loading}
          onClick={() => handleInject('NORMAL')}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 text-emerald-400" />
          NORMAL
        </button>

        {/* [ INJECT SPIKE ] */}
        <button
          disabled={loading}
          onClick={() => handleInject('SPIKE')}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 font-semibold rounded-lg border border-amber-800/60 transition disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          INJECT SPIKE
        </button>

        {/* [ INJECT DRIFT ] */}
        <button
          disabled={loading}
          onClick={() => handleInject('DRIFT')}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 font-semibold rounded-lg border border-blue-800/60 transition disabled:opacity-50"
        >
          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
          INJECT DRIFT
        </button>

        {/* [ INJECT DROPOUT ] */}
        <button
          disabled={loading}
          onClick={() => handleInject('DROPOUT')}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 font-semibold rounded-lg border border-purple-800/60 transition disabled:opacity-50"
        >
          <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
          INJECT DROPOUT
        </button>

        {/* [ INJECT STUCK SENSOR ] */}
        <button
          disabled={loading}
          onClick={() => handleInject('STUCK')}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 font-semibold rounded-lg border border-indigo-800/60 transition disabled:opacity-50"
        >
          <PauseCircle className="w-3.5 h-3.5 text-indigo-400" />
          INJECT STUCK
        </button>

        {/* [ INJECT CRITICAL EVENT ] */}
        <button
          disabled={loading}
          onClick={() => handleInject('MULTI_SENSOR')}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-950/70 hover:bg-red-900/90 text-red-200 font-bold rounded-lg border border-red-700 transition shadow-lg shadow-red-950/60 disabled:opacity-50 animate-pulse"
        >
          <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
          INJECT CRITICAL
        </button>

        {/* [ GENERATE ALERT FLOOD ] */}
        <button
          disabled={loading}
          onClick={() => handleInject('ALERT_FLOOD')}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-cyan-950/50 hover:bg-cyan-900/70 text-cyan-200 font-bold rounded-lg border border-cyan-700/80 transition shadow-lg shadow-cyan-950/50 disabled:opacity-50"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          ALERT FLOOD
        </button>

        {/* [ RESET ] */}
        <button
          disabled={loading}
          onClick={handleResetAll}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 font-semibold rounded-lg border border-slate-800 transition disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          RESET
        </button>
      </div>

      {lastAction && (
        <div className="mt-3 text-[11px] font-mono text-blue-300 bg-blue-950/40 px-3 py-1.5 rounded border border-blue-900/60 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
          {lastAction}
        </div>
      )}
    </div>
  );
}
