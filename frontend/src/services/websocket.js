export function connectWebSocket(onMessage, onStatusChange) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/ws`;

  let ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    if (onStatusChange) onStatusChange('CONNECTED');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (onMessage) onMessage(data);
    } catch (err) {
      console.error('Error parsing WS message:', err);
    }
  };

  ws.onerror = (err) => {
    console.error('WebSocket error:', err);
    if (onStatusChange) onStatusChange('ERROR');
  };

  ws.onclose = () => {
    if (onStatusChange) onStatusChange('DISCONNECTED');
    // Attempt auto-reconnect in 3s
    setTimeout(() => {
      connectWebSocket(onMessage, onStatusChange);
    }, 3000);
  };

  return ws;
}
