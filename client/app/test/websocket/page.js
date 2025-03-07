'use client';

import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

export default function NumberCallerPage() {
  const URL = 'http://localhost:5000';
  const socket = io(URL, { autoConnect: false });

  const [aliveConn, setAliveConn] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to Socket.IO server as admin');
      setAliveConn(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server as admin');
      setAliveConn(false);
    });

    socket.on('message', (message) => {
      console.log(message);
    });

    socket.onAny((event, ...args) => {
      console.log(event, args);
    });

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className='min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4'>
      Connection: {aliveConn ? 'yes' : 'no'}{' '}
    </div>
  );
}
