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
    };
  }, [facilityId]);

  const sendNumber = () => {
    if (!aliveConn) {
      console.log('Not connected');
      return;
    }
    if (ws.current && ws.current.readyState === 1) {
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
        const currTempId = result[0].rawValue.split('-')[1];
        const currUid = localStorage.getItem('uid');
        console.log('currTempId ', currTempId);
        const currQrCode = `${process.env.NEXT_PUBLIC_BE_DOMAIN}/api/v1/trigger/${currTempId}-${currUid}`;
        console.log('currQrQode ', currQrCode);
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
        <button onClick={() => setPause((pause) => !pause)}>Pause</button>
        <div>
          <select onChange={(e) => setDeviceId(e.target.value)}>
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
        />
      </>
    );
  };

  return (
    <div>
      <h1>Admin Page</h1>
      <p>Connection is alive: {aliveConn ? 'Yes' : 'No'}</p>
      <p>Pongs received: {pongs}</p>
      <p>Facility ID: {facilityId}</p>
      <input
        type='text'
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        placeholder='Enter number'
      />
      <div>
        <button onClick={sendNumber} disabled={!aliveConn}>
          Send
        </button>
      </div>
      <div>
        <button onClick={logOut} disabled={!aliveConn}>
          Log Out
        </button>
      </div>
      <div>
        <button onClick={triggerCamera} disabled={!aliveConn}>
          Open Camera
        </button>
      </div>
      <div className='mt-3'>{cameraOn && <ScannerComponent />}</div>
    </div>
  );
}
