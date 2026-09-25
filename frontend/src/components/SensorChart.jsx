import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { LineChart as LineChartIcon } from 'lucide-react';

export function SensorChart({ historyData = [], selectedMachine = 'CNC-M01', onSelectMachine, machineStatus = 'NORMAL' }) {
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, TEMP, VIB, RPM, POWER

  const isStopped = machineStatus === 'STOPPED';

  const formattedData = (historyData || []).map((item) => {
    const dt = new Date(item.timestamp);
    const timeStr = dt.toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' });
    return {
      time: timeStr,
      value: item.value,
      sensor: item.sensor,
      is_anomaly: item.is_injected_anomaly,
      injected_type: item.injected_type
    };
  });

  // Group by timestamp for synchronized multi-line chart
  const timeGroupedMap = {};
  formattedData.forEach((d) => {
    if (!timeGroupedMap[d.time]) {
      timeGroupedMap[d.time] = { time: d.time };
    }
    timeGroupedMap[d.time][d.sensor] = d.value;
  });

  const chartData = isStopped
    ? Object.values(timeGroupedMap).map(row => ({
        ...row,
        rpm: 0,
        vibration: 0,
        power: 0,
        temperature: 25.0,
        voltage: 0,
        feed_rate: 0
      }))
    : Object.values(timeGroupedMap);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-blue-400" />
            Live CNC Sensor Trends ({selectedMachine})
            {isStopped ? (
              <span className="ml-2 px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-mono rounded font-bold">
                ● STOPPED (OFFLINE)
              </span>
            ) : (
              <span className="ml-2 px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[11px] font-mono rounded font-bold">
                ● LIVE STREAMING
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isStopped
              ? 'Machine is STOPPED — live sensor telemetry stream is halted and zeroed.'
              : 'Synchronized multi-channel streaming telemetry showing physical baseline vs active deviations.'}
          </p>
        </div>

        {/* Machine Selector Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            {['CNC-M01', 'CNC-M02', 'CNC-M03'].map((m) => (
              <button
                key={m}
                onClick={() => onSelectMachine(m)}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  selectedMachine === m
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recharts Chart Canvas */}
      <div className="h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            
            <Line
              type="monotone"
              dataKey="temperature"
              name="Temperature (°C)"
              stroke="#f43f5e"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="vibration"
              name="Vibration (mm/s)"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="power"
              name="Power Draw (kW)"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="rpm"
              name="Spindle RPM"
              stroke="#a855f7"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
