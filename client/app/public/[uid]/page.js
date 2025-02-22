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
    <div className='min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4'>
      <h1 className='text-4xl font-bold mb-8'>Queue Management System</h1>
      <div className='w-full max-w-md text-center'>
        <p className='mb-2 text-lg'>
          Unique ID: <span className='font-semibold'>{uid}</span>
        </p>
        <p className='mb-4 text-2xl'>
          Current Number: <span className='font-bold'>{number[0]}</span>
        </p>
        <button
          onClick={() => {
            window.location.reload();
          }}
          className='w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold'
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}
