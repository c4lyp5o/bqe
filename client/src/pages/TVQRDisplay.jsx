import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import QRCode from 'qrcode';
import { io } from 'socket.io-client';

import Loading from '../components/Loading';
import Invalid from '../components/Invalid';
import axios from 'axios';

export default function TvQRDisplayPage() {
  const navigate = useNavigate();

  // page status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorType, setErrorType] = useState(null);

  // qr code
  const [qrCode, setQrCode] = useState(null);

  const socket = useRef(null);

  useEffect(() => {
    const initializeSocket = async () => {
      const { data } = await axios.get('/api/v1/getnanoid');
      const tempId = data.number;

      const wsUrl =
        import.meta.env.VITE_PUBLIC_BUILD === 'development'
          ? 'ws://localhost:5000'
          : `${
              window.location.host.includes('localhost') ? 'ws://' : 'wss://'
            }${window.location.host}`;

      socket.current = io(wsUrl, {
        autoConnect: true,
        transports: ['websocket'],
      });

      socket.current.on('connect', () => {
        // console.log('Connected to WebSocket server as open user');
        socket.current.send({
          type: 'identifytvqrdisplay',
          tempId: tempId,
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
            navigate(`/tv/${message.tempId}/${message.singleUseFacilityId}`);
            break;
        }
      });

      socket.current.connect();

      const url = await QRCode.toDataURL(`temp-${tempId}`);
      setQrCode(url);
    };

    initializeSocket();

    return () => {
      if (socket.current) socket.current.disconnect();
    };
  }, [navigate]);

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
