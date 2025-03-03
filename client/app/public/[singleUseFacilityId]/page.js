'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';

export default function FrontFacing() {
  const { singleUseFacilityId } = useParams();

  const [number, setNumber] = useState([]);
  const [error, setError] = useState(false);

  // facility id
  const [facilityId, setFacilityId] = useState(null);

  // client side id
  const [uuid, setUuid] = useState(null);

  const ws = useRef(null);
  const refreshInterval = useRef(null);

  const connectWebSocket = () => {
    ws.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_DOMAIN}`);

    ws.current.onopen = () => {
      console.log('Connected to WebSocket server as public facing');
      if (ws.current && ws.current.readyState === 1) {
        ws.current.send(
          JSON.stringify({ type: 'identifypublic', singleUseFacilityId })
        );
      }
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      // console.log(message);

      if (message.type === 'killswitch') {
        console.log('Killswitch activated');
        clearInterval(refreshInterval);
        ws.current.close();
        router.replace('/');
      }

      if (
        message.type === 'no-valid-id' &&
        message.singleUseFacilityId === singleUseFacilityId
      ) {
        clearInterval(refreshInterval);
        setError(true);
        ws.current.close();
        setTimeout(() => {
          router.replace('/');
        }, 5000);
      }

      if (
        message.type === 'currentq' &&
        message.singleUseFacilityId === singleUseFacilityId
      ) {
        console.log(
          `facilityId && uuid: ${message.facilityId}, ${message.uuid}`
        );
        setFacilityId(message.facilityId);
        setUuid(message.uuid);
        setNumber(message.number);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  useEffect(() => {
    connectWebSocket();

    refreshInterval.current = setInterval(() => {
      window.location.reload();
    }, 60000);

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      clearInterval(refreshInterval.current);
    };
  }, [number, facilityId]);

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
      <h1 className='text-4xl font-bold mb-8'>Queue Management System</h1>
      <div className='w-full max-w-md text-center'>
        <p className='mb-2 text-lg'>
          Facility ID: <span className='font-semibold'>{facilityId}</span>
        </p>
        <p className='mb-2 text-lg'>
          UUID: <span className='font-semibold'>{uuid}</span>
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
