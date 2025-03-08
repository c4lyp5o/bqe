'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { io } from 'socket.io-client';

import Loading from '../../components/loading';
import Invalid from '../../components/invalid';

export default function TvQRDisplayPage() {
  const router = useRouter();

  // page status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorType, setErrorType] = useState(null);

  // qr code
  const [qrCode, setQrCode] = useState(null);

  const socket = useRef(null);

  useEffect(() => {
    const qrActivation = async () => {
      const response = await fetch('/api/v1/getNumber');
      return response.json();
    };

    const initializeSocket = async () => {
      const tempId = await qrActivation();
      // console.log('tempId: ', tempId);

      socket.current = io(process.env.NEXT_PUBLIC_WS_DOMAIN, {
        autoConnect: true,
      });

      socket.current.on('connect', () => {
        // console.log('Connected to WebSocket server as open user');
        socket.current.send({
          type: 'identifyopenpublic',
          tempId: tempId.number,
        });
        setLoading(false);
      });

      socket.current.on('message', (message) => {
        // console.log('message: ', message);

        switch (message.type) {
          case 'killswitch':
            setLoading(false);
            setErrorType('killswitch');
            setError(true);
            break;
          case 'open-queue-screen':
            // console.log('Received open-queue-screen message');
            setLoading(true);
            router.push(
              `/user/${message.tempId}/${message.uuid}/${message.singleUseFacilityId}`
            );
            break;
        }
      });

      socket.current.connect();

      const url = await QRCode.toDataURL(`temp-${tempId.number}`);
      setQrCode(url);
    };

    initializeSocket();

    return () => {
      if (socket.current) socket.current.disconnect();
    };
  }, []);

  if (loading) return <Loading />;

  if (error) return <Invalid errorType={errorType} />;

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
