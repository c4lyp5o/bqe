'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';

export default function FrontFacing() {
  const { uid } = useParams();
  const [number, setNumber] = useState([]);

  const ws = useRef(null);

  const connectWebSocket = () => {
    ws.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_DOMAIN}`);

    ws.current.onopen = () => {
      console.log('Connected to WebSocket server as public');
      if (ws.current && ws.current.readyState === 1) {
        ws.current.send(JSON.stringify({ type: 'identifypublic', uid }));
      }
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      // console.log(message);

      if (message.type === 'currentq' && message.number) {
        setNumber(message.number);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  useEffect(() => {
    connectWebSocket();
    const refreshInterval = setInterval(() => {
      window.location.reload();
    }, 300000); // 300000 ms = 5 minutes

    return () => {
      ws.current.close();
      clearInterval(refreshInterval);
    };
  }, []);

  return (
    <div>
      <h1>Front Facing</h1>
      <p>Unique ID: {uid}</p>
      <p>Current Number: {number[0]}</p>
      <button
        onClick={() => {
          window.location.reload();
        }}
      >
        Refresh Page
      </button>
    </div>
  );
}
