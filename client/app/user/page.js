'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { io } from 'socket.io-client';

export default function TvQRDisplayPage() {
  const router = useRouter();

  const [qrCode, setQrCode] = useState(null);
  const [error, setError] = useState(false);

  const socket = useRef(null);

  useEffect(() => {
    const qrActivation = async () => {
      const response = await fetch('/api/v1/getNumber');
      return response.json();
    };

    const initializeSocket = async () => {
      try {
        const tempId = await qrActivation();
        console.log('tempId: ', tempId);

        socket.current = io(process.env.NEXT_PUBLIC_WS_DOMAIN, {
          autoConnect: true,
        });

        socket.current.on('connect', () => {
          console.log('Connected to WebSocket server as open user');
          socket.current.send({
            type: 'identifyopenpublic',
            tempId: tempId.number,
          });
        });

        socket.current.on('message', (message) => {
          console.log(message);

          if (message.type === 'killswitch') {
            console.log('Killswitch activated');
            socket.current.disconnect();
            router.replace('/');
          }

          if (
            message.type === 'open-queue-screen' &&
            message.tempId === tempId.number
          ) {
            console.log('Received open-queue-screen message');
            socket.current.disconnect();
            router.push(
              `/user/${message.tempId}/${message.uuid}/${message.singleUseFacilityId}`
            );
          }
        });

        socket.current.connect();

        const url = await QRCode.toDataURL(`temp-${tempId.number}`);
        setQrCode(url);
      } catch (err) {
        console.error(err);
        setError(true);
      }
    };

    initializeSocket();

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  if (error) {
    return (
      <div className='min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4'>
        <h1 className='text-4xl font-bold mb-8'>TV Display</h1>
        <p className='mb-4 text-lg'>
          An error occurred. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4'>
      <h1 className='text-4xl font-bold mb-8'>TV Display</h1>
      <p className='mb-4 text-lg'>Scan the QR code using Number Caller</p>
      {qrCode && (
        <img
          src={qrCode}
          alt='QR Code'
          className='w-64 h-64 mb-4 border-4 border-white rounded-lg'
        />
      )}
      {!qrCode && <p>Loading QR Code...</p>}
    </div>
  );
}
