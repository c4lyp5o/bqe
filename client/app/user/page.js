'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

export default function TvQRDisplayPage() {
  const router = useRouter();

  const [qrCode, setQrCode] = useState(null);
  const [error, setError] = useState(false);

  const ws = useRef(null);

  const connectWebSocket = (data) => {
    ws.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_DOMAIN}`);

    ws.current.onopen = () => {
      console.log('Connected to WebSocket server as open user');

      if (ws.current && ws.current.readyState === 1) {
        ws.current.send(
          JSON.stringify({
            type: 'identifyopenpublic',
            tempId: data.number,
          })
        );
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
        message.type === 'open-queue-screen' &&
        message.tempId === data.number
      ) {
        console.log('Received open-queue-screen message');
        ws.current.close();
        router.push(
          `/user/${message.tempId}/${message.uuid}/${message.singleUseFacilityId}`
        );
      }
    };
  };

  useEffect(() => {
    const getNanoid = async () => {
      const response = await fetch('/api/v1/getNumber');
      return response.json();
    };

    getNanoid().then((data) => {
      console.log(data);
      connectWebSocket(data);
      QRCode.toDataURL(`temp-${data.number}`)
        .then((url) => {
          // console.log(url);
          setQrCode(url);
        })
        .catch((err) => {
          console.error(err);
          setError(true);
        });
    });
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
