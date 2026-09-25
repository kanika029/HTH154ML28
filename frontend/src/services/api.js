export async function fetchMachines() {
  const res = await fetch('/api/machines');
  if (!res.ok) throw new Error('Failed to fetch machines');
  return res.json();
}

export async function fetchSensorHistory(machineId, limit = 50) {
  const res = await fetch(`/api/sensors/history/${machineId}?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch sensor history');
  return res.json();
}

export async function fetchAlerts(limit = 50) {
  const res = await fetch(`/api/alerts?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function injectAnomaly(machineId, anomalyType, sensor = 'temperature', durationTicks = 20) {
  const res = await fetch('/api/demo/inject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      machine_id: machineId,
      anomaly_type: anomalyType,
      sensor: sensor,
      duration_ticks: durationTicks
    })
  });
  if (!res.ok) throw new Error('Failed to inject anomaly');
  return res.json();
}

export async function triggerFloodAlerts(machineId = 'CNC-M01', sensor = 'temperature') {
  const res = await fetch(`/api/demo/flood?machine_id=${machineId}&sensor=${sensor}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to trigger alert flood');
  return res.json();
}

export async function resetDemo() {
  const res = await fetch('/api/demo/reset', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset demo');
  return res.json();
}

export async function fetchReportSummary() {
  const res = await fetch('/api/reports/summary');
  if (!res.ok) throw new Error('Failed to fetch report summary');
  return res.json();
}

export async function controlMachine(machineId, action) {
  const res = await fetch('/api/machines/control', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ machine_id: machineId, action: action })
  });
  if (!res.ok) throw new Error('Failed to send machine control command');
  return res.json();
}
