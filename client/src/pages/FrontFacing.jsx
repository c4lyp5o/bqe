'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router';
import { io } from 'socket.io-client';

import Loading from '../components/Loading';
import Invalid from '../components/Invalid';

export default function FrontFacing() {
  const { singleUseFacilityId } = useParams();

  // page status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorType, setErrorType] = useState(null);

  // queue number
  const [number, setNumber] = useState([]);

  // facility data
  const [facilityId, setFacilityId] = useState(null);
  const [facilityName, setFacilityName] = useState(null);

  // client side id
  const [uuid, setUuid] = useState(null);

  const socket = useRef(null);
  const refreshInterval = useRef(null);

  useEffect(() => {
    const wsUrl =
      import.meta.env.VITE_PUBLIC_BUILD === 'development'
        ? 'ws://localhost:5000'
        : `${window.location.host.includes('localhost') ? 'ws://' : 'wss://'}${
            window.location.host
          }`;

    socket.current = io(wsUrl, { autoConnect: true });

    socket.current.on('connect', () => {
      // console.log('Connected to WebSocket server as public facing');
      socket.current.send({ type: 'identifypublic', singleUseFacilityId });
    });

    socket.current.on('message', (message) => {
      // console.log(message);

      switch (message.type) {
        case 'killswitch':
        case 'no-valid-id':
          clearInterval(refreshInterval.current);
          socket.current.disconnect();
          setLoading(false);
          setErrorType(message.type);
          setError(true);
          break;
        case 'currentq':
          // console.log(
          //   `facilityId, facilityName, uuid: ${message.facilityId}, ${message.facilityName}, ${message.uuid}`
          // );
          setFacilityId(message.setFacilityId);
          setFacilityName(message.facilityName);
          setUuid(message.uuid);
          setNumber(message.number);
          setLoading(false);
          break;
      }
    });

    socket.current.connect();

    refreshInterval.current = setInterval(() => {
      window.location.reload();
    }, 60000);

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
      clearInterval(refreshInterval.current);
    };
  }, [singleUseFacilityId]);

  if (loading) return <Loading />;

  if (error) return <Invalid errorType={errorType} />;

  return (
    <div className='min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4'>
      <h1 className='text-4xl font-bold mb-8'>Queue Management System</h1>
      <div className='w-full max-w-md text-center'>
        {/* <p className='mb-2 text-lg'>
                    Facility ID: <span className='font-semibold'>{facilityId}</span>
                </p> */}
        <p className='mb-2 text-lg'>
          <span className='font-semibold'>{facilityName}</span>
        </p>
        {/* <p className='mb-2 text-lg'>
                    UUID: <span className='font-semibold'>{uuid}</span>
                </p> */}
        <p className='mb-4 text-2xl'>
          Current Number: <span className='font-bold'>{number[0]?.number}</span>
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
