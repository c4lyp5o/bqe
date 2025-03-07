'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Scanner, useDevices } from '@yudiel/react-qr-scanner';
import { io } from 'socket.io-client';

export default function NumberCallerPage() {
  const router = useRouter();
  const { singleUseFacilityId } = useParams();

  const [aliveConn, setAliveConn] = useState(false);
  const [error, setError] = useState(false);
  const [number, setNumber] = useState('');
  const [allNumber, setAllNumber] = useState([]);
  const [pongs, setPongs] = useState(0);

  // facility data
  const [facilityId, setFacilityId] = useState(null);
  const [facilityName, setFacilityName] = useState(null);
  const [facilityRoom, setFacilityRoom] = useState(null);

  // client side id
  const [uuid, setUuid] = useState(null);

  // camera
  const [cameraOn, setCameraOn] = useState(false);
  const [deviceId, setDeviceId] = useState(undefined);
  const [pause, setPause] = useState(false);

  const socket = useRef(null);
  const pingInterval = useRef(null);

  useEffect(() => {
    socket.current = io(process.env.NEXT_PUBLIC_WS_DOMAIN, {
      autoConnect: true,
    });

    socket.current.on('connect', () => {
      console.log('Connected to WebSocket server as admin');
      setAliveConn(true);
      socket.current.send({ type: 'identifyadmin', singleUseFacilityId });
      startPing();
    });

    socket.current.on('message', (message) => {
      // console.log(message);

      if (message.type === 'killswitch') {
        console.log('Killswitch activated');
        clearInterval(pingInterval.current);
        socket.current.disconnect();
        router.replace('/');
      }

      if (
        message.type === 'no-valid-id' &&
        message.singleUseFacilityId === singleUseFacilityId
      ) {
        clearInterval(pingInterval.current);
        socket.current.disconnect();
        setError(true);
        setTimeout(() => {
          router.replace('/');
        }, 5000);
      }

      if (
        message.type === 'set-facility-id' &&
        message.singleUseFacilityId === singleUseFacilityId
      ) {
        console.log(
          `facilityId, facilityName, facilityRoom, uuid: ${message.facilityId}, ${message.facilityName}, ${message.facilityRoom}, ${message.uuid}`
        );
        setFacilityId(message.facilityId);
        setFacilityName(message.facilityName);
        setFacilityRoom(message.facilityRoom);
        setUuid(message.uuid);
      }

      if (
        message.type === 'pong-admin' &&
        message.singleUseFacilityId === singleUseFacilityId
      ) {
        setPongs((pongs) => pongs + 1);
      }

      if (message.type === 'already-connected') {
        console.log('Already connected');
        clearInterval(pingInterval.current);
        socket.current.disconnect();
        router.replace('/');
      }
    });

    socket.current.on('close', () => {
      console.log('WebSocket connection closed, attempting to reconnect...');
      setAliveConn(false);
    });

    socket.current.connect();

    return () => {
      socket.current.disconnect();
    };
  }, []);

  const sendNumber = () => {
    if (!aliveConn) {
      alert('Not connected');
      return;
    }
    if (isNaN(parseInt(number))) {
      alert('Invalid number');
      return;
    }
    const currAllNumber = [{ number: parseInt(number), facilityRoom }].concat(
      allNumber
    );
    setAllNumber(currAllNumber);
    setNumber('');
    console.log(currAllNumber);
    socket.current.send({
      type: 'admin',
      singleUseFacilityId,
      facilityId,
      number: parseInt(number),
      facilityRoom,
    });
  };

  const startPing = () => {
    console.log('ADMIN: send the pings');
    clearInterval(pingInterval.current);
    pingInterval.current = setInterval(() => {
      socket.current.send({ type: 'ping-admin', singleUseFacilityId });
    }, 30000);
  };

  const logOut = () => {
    clearInterval(pingInterval.current);
    socket.current.send({ type: 'logout-admin', singleUseFacilityId });
    socket.current.disconnect();
    router.replace('/');
  };

  const triggerCamera = () => {
    setCameraOn(!cameraOn);
  };

  const handleScan = async (result) => {
    if (result) {
      try {
        const tempId = result[0].rawValue.split('temp-')[1];
        console.log('tempId ', tempId);
        const qrCode = `/api/v1/getTrigger/${tempId}-${singleUseFacilityId}`;
        console.log('qrCode ', qrCode);
        const response = await fetch(qrCode);
        if (!response.ok) {
          setCameraOn(false);
          alert('Invalid QR Code');
          throw new Error('Network response was not ok');
        }
        console.log('QR code processed successfully');
      } catch (error) {
        setCameraOn(false);
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

  if (error) {
    return (
      <div className='min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4'>
        <h1 className='text-4xl font-bold mb-8'>Queue Management System</h1>
        <p className='text-2xl'>Invalid ID</p>
        <p className='text-2xl'>Redirecting after 5 seconds</p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4'>
      <h1 className='text-4xl font-bold mb-8'>Number Caller Page</h1>
      <div className='w-full max-w-md'>
        <p className='mb-2'>Connection is alive: {aliveConn ? 'Yes' : 'No'}</p>
        <p className='mb-2'>Pongs received: {pongs}</p>
        <p className='mb-2'>Facility ID: {facilityId}</p>
        <p className='mb-2'>Facility Name: {facilityName}</p>
        <p className='mb-2'>Facility Room: {facilityRoom}</p>
        <p className='mb-2'>Single Use Facility ID: {singleUseFacilityId}</p>
        <p className='mb-2'>UUID: {uuid}</p>
        <p className='mb-2'>
          All Numbers:{' '}
          {allNumber
            .map((item) => `${item.number} - ${item.facilityRoom}`)
            .join(', ')}
        </p>
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
