'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import QRCode from 'qrcode';

export default function UserPage() {
  const router = useRouter();
  const { facilityId } = useParams();

  const tempFacId = facilityId.split('-')[0];
  const uid = facilityId.split('-')[1];

  const [aliveConn, setAliveConn] = useState(false);
  const [message, setMessage] = useState([]);
  const [pongs, setPongs] = useState(0);
  const [qrCode, setQrCode] = useState(null);

  const ws = useRef(null);
  const pingInterval = useRef(null);
  const reconnectTimeout = useRef(null);

  const connectWebSocket = () => {
    ws.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_DOMAIN}`);

    ws.current.onopen = () => {
      console.log('Connected to WebSocket server as client');
      setAliveConn(true);
      clearTimeout(reconnectTimeout.current);
      if (ws.current && ws.current.readyState === 1) {
        ws.current.send(
          JSON.stringify({ type: 'identifyclient', facilityId: tempFacId })
        );
        startPing();
      }
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      // console.log(message);

      if (message.type === 'admin' && message.facilityId === tempFacId) {
        setMessage(message.number);
      }

      if (message.type === 'pong-client' && message.facilityId === tempFacId) {
        setPongs((pongs) => pongs + 1);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed, attempting to reconnect...');
      setAliveConn(false);
      clearTimeout(reconnectTimeout.current);
      clearInterval(pingInterval.current);
      reconnectTimeout.current = setTimeout(connectWebSocket, 5000);
    };
  };

  useEffect(() => {
    console.log('CLIENT: user mode');

    QRCode.toDataURL(`${process.env.NEXT_PUBLIC_FE_DOMAIN}/public/${uid}`).then(
      (url) => {
        console.log(url);
        setQrCode(url);
      }
    );

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      clearTimeout(reconnectTimeout.current);
      clearInterval(pingInterval.current);
    };
  }, [facilityId]);

  const startPing = () => {
    console.log('CLIENT: send the pings');
    pingInterval.current = setInterval(() => {
      if (ws.current && ws.current.readyState === 1) {
        ws.current.send(
          JSON.stringify({ type: 'ping-client', facilityId: tempFacId })
        );
      }
    }, 30000);
  };

  const logOut = () => {
    if (ws.current && ws.current.readyState === 1) {
      ws.current.close();
      clearTimeout(reconnectTimeout.current);
      clearInterval(pingInterval.current);
      router.replace('/');
    }
  };

  return (
    <div className='min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4'>
      <h1 className='text-4xl font-bold mb-8'>User Page</h1>
      <div className='w-full max-w-md text-center'>
        <p className='mb-2 text-lg'>
          Connection is alive:{' '}
          <span className='font-semibold'>{aliveConn ? 'Yes' : 'No'}</span>
        </p>
        <p className='mb-2 text-lg'>
          Pongs received: <span className='font-semibold'>{pongs}</span>
        </p>
        <p className='mb-2 text-lg'>
          Facility ID: <span className='font-semibold'>{tempFacId}</span>
        </p>
        <p className='mb-2 text-lg'>
          Unique Public ID: <span className='font-semibold'>{uid}</span>
        </p>
        <p className='mb-4 text-2xl'>
          Current Number: <span className='font-bold'>{message[0]}</span>
        </p>
        <div className='mb-4'>
          <h2 className='text-xl font-semibold mb-2'>Past Numbers:</h2>
          {message.slice(1, 6).map((i, index) => (
            <p key={index} className='text-lg'>
              {i}
            </p>
          ))}
        </div>
        <button
          onClick={logOut}
          disabled={!aliveConn}
          className='w-full p-3 mb-4 bg-red-600 hover:bg-red-700 rounded-lg font-semibold disabled:opacity-50'
        >
          Log Out
        </button>
        <div className='mt-4'>
          <h2 className='text-xl font-semibold mb-2'>QR Code For Public</h2>
          {qrCode ? (
            <img
              src={qrCode}
              alt='QR Code'
              className='w-64 h-64 mb-4 border-4 border-white rounded-lg'
            />
          ) : (
            <p>Loading QR Code...</p>
          )}
        </div>
      </div>
    </div>
  );
}
