'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import QRCode from 'qrcode';

export default function TvNumberDisplayPage() {
  const router = useRouter();
  const { multiId } = useParams();

  const tempId = multiId[0]; // from open tv display
  const singleUseFacilityId = multiId[2]; // from number caller

  const [aliveConn, setAliveConn] = useState(false);
  const [message, setMessage] = useState([]);
  const [pongs, setPongs] = useState(0);
  const [error, setError] = useState(false);
  const [qrCode, setQrCode] = useState(null);

  // facility data
  const [facilityId, setFacilityId] = useState(null);
  const [facilityName, setFacilityName] = useState(null);

  // client side id
  const [uuid, setUuid] = useState(null);

  const ws = useRef(null);
  const pingInterval = useRef(null);
  const reconnectTimeout = useRef(null);

  const connectWebSocket = () => {
    ws.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_DOMAIN}`);

    ws.current.onopen = () => {
      console.log('Connected to WebSocket server as tv display mode');

      setAliveConn(true);
      clearTimeout(reconnectTimeout.current);
      if (ws.current && ws.current.readyState === 1) {
        ws.current.send(
          JSON.stringify({
            type: 'identifyclient',
            singleUseFacilityId,
          })
        );
        startPing();
      }
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      // console.log(message);

      if (message.type === 'killswitch') {
        console.log('Killswitch activated');
        clearTimeout(reconnectTimeout.current);
        clearInterval(pingInterval.current);
        ws.current.close();
        router.replace('/');
      }

      if (
        message.type === 'no-valid-id' &&
        message.singleUseFacilityId === singleUseFacilityId
      ) {
        clearTimeout(reconnectTimeout.current);
        clearInterval(pingInterval.current);
        setError(true);
        ws.current.close();
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
        setUuid(message.uuid);
      }

      if (message.type === 'admin' && message.facilityId === facilityId) {
        // console.log('message: ', message);
        setMessage(message.numbers);
      }

      if (
        message.type === 'pong-client' &&
        message.singleUseFacilityId === singleUseFacilityId
      ) {
        setPongs((pongs) => pongs + 1);
      }
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

    QRCode.toDataURL(`${window.location.origin}/public/${tempId}`).then(
      (url) => {
        console.log(url);
        setQrCode(url);
      }
    );

    return () => {
      ws.current.close();
      clearTimeout(reconnectTimeout.current);
      clearInterval(pingInterval.current);
    };
  }, [facilityId]);

  const startPing = () => {
    console.log('CLIENT: send the pings');
    pingInterval.current = setInterval(() => {
      if (ws.current && ws.current.readyState === 1) {
        ws.current.send(
          JSON.stringify({
            type: 'ping-client',
            singleUseFacilityId,
          })
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
      <div className='w-full max-w-7xl aspect-w-16 aspect-h-9'>
        <div className='flex flex-col items-center justify-center h-full'>
          <h1 className='text-6xl font-bold mb-8 text-center'>
            {facilityName}
          </h1>
          <div className='flex w-full h-full'>
            <div className='flex-2 flex flex-col items-center justify-center border-r border-gray-700 pr-4'>
              <p className='text-9xl font-bold mb-4 border-4 border-white p-8 rounded-lg'>
                {message[0]?.number} - {message[0]?.facilityRoom}
              </p>
            </div>
            <div className='flex-1 flex flex-col items-center justify-center pl-4'>
              <div className='mb-4'>
                <h2 className='text-4xl font-semibold mb-2'>Past Numbers:</h2>
                {message.slice(1, 6).map((item, index) => (
                  <p key={index} className='text-3xl mb-2'>
                    {item.number} - {item.facilityRoom}
                  </p>
                ))}
              </div>
              <div className='mt-4'>
                <h2 className='text-4xl font-semibold mb-2'>
                  Don't miss your turn! Scan the QR Code below to get the latest
                  number.
                </h2>
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
        </div>
      </div>
    </div>
  );
}
