'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Scanner, useDevices } from '@yudiel/react-qr-scanner';

export default function AdminPage() {
  const router = useRouter();
  const { facilityId } = useParams();

  const [aliveConn, setAliveConn] = useState(false);
  const [number, setNumber] = useState('');
  const [allNumber, setAllNumber] = useState([]);
  const [pongs, setPongs] = useState(0);

  // camera
  const [cameraOn, setCameraOn] = useState(false);
  const [deviceId, setDeviceId] = useState(undefined);
  const [pause, setPause] = useState(false);

  const ws = useRef(null);
  const pingInterval = useRef(null);
  const reconnectTimeout = useRef(null);

  const connectWebSocket = () => {
    ws.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_DOMAIN}`);

    ws.current.onopen = () => {
      console.log('Connected to WebSocket server as admin');
      setAliveConn(true);
      clearTimeout(reconnectTimeout.current);
      if (ws.current && ws.current.readyState === 1) {
        ws.current.send(JSON.stringify({ type: 'identifyadmin', facilityId }));
        startPing();
      }
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      // console.log(message);

      if (message.type === 'pong-admin' && message.facilityId === facilityId) {
        setPongs((pongs) => pongs + 1);
      }

      if (message.type === 'set-uid' && message.facilityId === facilityId) {
        console.log('Setting uid:', message.uid);
        localStorage.setItem('uid', message.uid);
      }

      if (message.type === 'already-connected') {
        console.log('Already connected');
        ws.current.close();
        router.replace('/');
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
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      clearTimeout(reconnectTimeout.current);
      clearInterval(pingInterval.current);
      localStorage.removeItem('uid');
    };
  }, [facilityId]);

  const sendNumber = () => {
    if (!aliveConn) {
      alert('Not connected');
      return;
    }
    if (ws.current && ws.current.readyState === 1) {
      if (isNaN(parseInt(number))) {
        alert('Invalid number');
        return;
      }
      const currAllNumber = [parseInt(number), ...allNumber];
      setAllNumber(currAllNumber);
      setNumber('');
      console.log(currAllNumber);
      ws.current.send(
        JSON.stringify({ type: 'admin', facilityId, number: currAllNumber })
      );
    }
  };

  const startPing = () => {
    console.log('ADMIN: send the pings');
    clearInterval(pingInterval.current);
    pingInterval.current = setInterval(() => {
      if (ws.current && ws.current.readyState === 1) {
        ws.current.send(JSON.stringify({ type: 'ping-admin', facilityId }));
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

  const triggerCamera = () => {
    setCameraOn(!cameraOn);
  };

  const handleScan = async (result) => {
    if (result) {
      try {
        console.log('result ', result);
        const currTempId = result[0].rawValue.split('temp-')[1];
        const currUid = localStorage.getItem('uid');
        console.log('currTempId ', currTempId);
        const currQrCode = `/api/v1/getTrigger/${currTempId}-${currUid}`;
        console.log('currQrCode ', currQrCode);
        const response = await fetch(currQrCode);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        console.log('QR code processed successfully');
      } catch (error) {
        console.error('Error processing QR code:', error);
      }
    }
  };

  const ScannerComponent = () => {
    const allDevices = useDevices();

    return (
      <>
        <button
          onClick={() => setPause((pause) => !pause)}
          className='mt-2 p-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg'
        >
          {pause ? 'Resume' : 'Pause'}
        </button>
        <div className='mt-2'>
          <select
            onChange={(e) => setDeviceId(e.target.value)}
            className='p-2 bg-gray-800 text-white rounded-lg'
          >
            <option value={undefined}>Select a device</option>
            {allDevices.map((device, index) => (
              <option key={index} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
        </div>
        <Scanner
          constraints={{
            deviceId: deviceId,
          }}
          onError={(error) => {
            console.log(`onError: ${error}'`);
          }}
          scanDelay={2000}
          paused={pause}
          onScan={handleScan}
          className='mt-2'
        />
      </>
    );
  };

  return (
    <div className='min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4'>
      <h1 className='text-4xl font-bold mb-8'>Admin Page</h1>
      <div className='w-full max-w-md'>
        <p className='mb-2'>Connection is alive: {aliveConn ? 'Yes' : 'No'}</p>
        <p className='mb-2'>Pongs received: {pongs}</p>
        <p className='mb-4'>Facility ID: {facilityId}</p>
        <input
          type='text'
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder='Enter number'
          className='w-full p-3 mb-4 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
        />
        <button
          onClick={sendNumber}
          disabled={!aliveConn}
          className='w-full p-3 mb-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold disabled:opacity-50'
        >
          Send
        </button>
        <button
          onClick={logOut}
          disabled={!aliveConn}
          className='w-full p-3 mb-4 bg-red-600 hover:bg-red-700 rounded-lg font-semibold disabled:opacity-50'
        >
          Log Out
        </button>
        <button
          onClick={triggerCamera}
          disabled={!aliveConn}
          className='w-full p-3 mb-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold disabled:opacity-50'
        >
          {cameraOn ? 'Close Camera' : 'Open Camera'}
        </button>
        <div className='mt-3'>{cameraOn && <ScannerComponent />}</div>
      </div>
    </div>
  );
}
