import React, { useState, useEffect } from 'react';
import { Activity, Radio, FileText } from 'lucide-react';
import { SummaryCards } from '../components/SummaryCards';
import { DemoPanel } from '../components/DemoPanel';
import { DigitalTwin } from '../components/DigitalTwin';
import { SensorChart } from '../components/SensorChart';
import { AlertFeed } from '../components/AlertFeed';
import { AlertDetails } from '../components/AlertDetails';
import { MachineHealth } from '../components/MachineHealth';
import { OEERingChart } from '../components/OEERingChart';
import { connectWebSocket } from '../services/websocket';
import { fetchSensorHistory, fetchAlerts, fetchMachines } from '../services/api';

export function DashboardPage({ onViewReports }) {
  const [wsStatus, setWsStatus] = useState('CONNECTING');
  const [selectedMachine, setSelectedMachine] = useState('CNC-M01');
  const [liveReadings, setLiveReadings] = useState([]);
  const [machineStatuses, setMachineStatuses] = useState({
    'CNC-M01': 'NORMAL',
    'CNC-M02': 'NORMAL',
    'CNC-M03': 'NORMAL'
  });
  const [machineHealth, setMachineHealth] = useState({
    'CNC-M01': 98,
    'CNC-M02': 99,
    'CNC-M03': 97
  });
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [fatigueStats, setFatigueStats] = useState(null);
  const [sensorHistory, setSensorHistory] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [machines, setMachines] = useState([]);

  useEffect(() => {
    fetchMachines().then(setMachines).catch(console.error);
    fetchAlerts().then(setActiveAlerts).catch(console.error);
  }, []);

  useEffect(() => {
    const loadHistory = () => {
      fetchSensorHistory(selectedMachine, 40)
        .then(setSensorHistory)
        .catch(console.error);
    };
    loadHistory();
    const interval = setInterval(loadHistory, 2000);
    return () => clearInterval(interval);
  }, [selectedMachine]);

  useEffect(() => {
    const ws = connectWebSocket(
      (data) => {
        if (data.type === 'SENSOR_TICK') {
          if (data.readings) setLiveReadings(data.readings);
          if (data.machine_statuses) setMachineStatuses(data.machine_statuses);
          if (data.machine_health) setMachineHealth(data.machine_health);
          if (data.active_alerts) setActiveAlerts(data.active_alerts);
          if (data.fatigue_stats) setFatigueStats(data.fatigue_stats);
        }
      },
      (status) => setWsStatus(status)
    );
    return () => { if (ws) ws.close(); };
  }, []);

  const currentReadings = {};
  liveReadings
    .filter((r) => r.machine_id === selectedMachine)
    .forEach((r) => { currentReadings[r.sensor] = r.value; });

  const currentStatus = machineStatuses[selectedMachine] || 'NORMAL';
  const currentHealthPct = machineHealth[selectedMachine] || 98;
  const availability = Math.min(100, Math.max(60, currentHealthPct - 2));
  const performance  = Math.min(100, Math.max(60, currentHealthPct + 1));
  const quality      = Math.min(100, Math.max(70, currentHealthPct + 3));

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-4 sm:p-6 max-w-[1600px] mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400">
            <Activity className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-100 tracking-tight">SMARTSENSE</h1>
              <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-mono rounded font-semibold uppercase">
                v1.0 Hackathon MVP
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Severity-Aware Industrial Anomaly Detection, Alert Triage and Lightweight Digital Twin
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
            <Radio className={`w-3.5 h-3.5 ${wsStatus === 'CONNECTED' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="text-slate-400">Stream:</span>
            <span className={wsStatus === 'CONNECTED' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {wsStatus}
            </span>
          </div>
          <button
            onClick={onViewReports}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-900/40 transition"
          >
            <FileText className="w-4 h-4" /> End-of-Run Report
          </button>
        </div>
      </header>

      <SummaryCards fatigueStats={fatigueStats} activeAlerts={activeAlerts} machines={machines} />

      <DemoPanel
        selectedMachine={selectedMachine}
        onTriggerComplete={() => { fetchSensorHistory(selectedMachine, 40).then(setSensorHistory); }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-8">
          <DigitalTwin
            machineStatuses={machineStatuses}
            machineHealth={machineHealth}
            liveReadings={liveReadings}
            activeAlerts={activeAlerts}
            selectedMachine={selectedMachine}
            onSelectMachine={setSelectedMachine}
          />
        </div>
        <div className="lg:col-span-4 flex flex-col gap-5">
          <MachineHealth
            healthPercent={currentHealthPct}
            status={currentStatus}
            temperature={currentReadings.temperature != null ? currentReadings.temperature : 32.4}
            vibration={currentReadings.vibration != null ? currentReadings.vibration : 1.22}
            power={currentReadings.power != null ? currentReadings.power : 4.82}
          />
          <OEERingChart availability={availability} performance={performance} quality={quality} />
        </div>
      </div>

      <div className="mb-6">
        <SensorChart
          historyData={sensorHistory}
          selectedMachine={selectedMachine}
          onSelectMachine={setSelectedMachine}
        />
      </div>

      <AlertFeed alerts={activeAlerts} onSelectAlert={setSelectedAlert} />

      {selectedAlert && (
        <AlertDetails alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}
    </div>
  );
}
