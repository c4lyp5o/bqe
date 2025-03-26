'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import { io } from 'socket.io-client';

import Loading from '../../../components/loading';
import Invalid from '../../../components/invalid';

export default function TvNumberDisplayPage() {
  const { multiId } = useParams();

  const tempId = multiId[0]; // from open tv display
  const singleUseFacilityId = multiId[2]; // from number caller

  // page status
  const [aliveConn, setAliveConn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorType, setErrorType] = useState(null);
  const [pongs, setPongs] = useState(0);

  // queue number
  const [message, setMessage] = useState([]);

  // qr code
  const [qrCode, setQrCode] = useState(null);

  // facility data
  const [facilityId, setFacilityId] = useState(null);
  const [facilityName, setFacilityName] = useState(null);

  // client side id
  const [uuid, setUuid] = useState(null);

  const socket = useRef(null);
  const pingInterval = useRef(null);

  useEffect(() => {
    socket.current = io(process.env.NEXT_PUBLIC_WS_DOMAIN, {
      autoConnect: true,
    });

    socket.current.on('connect', () => {
      // console.log('Connected to WebSocket server as tv display mode');
      setAliveConn(true);
      socket.current.send({
        type: 'identifyclient',
        singleUseFacilityId,
      });
      startPing();
    });

    socket.current.on('message', (message) => {
      // console.log(message);

      switch (message.type) {
        case 'killswitch':
        case 'no-valid-id':
        case 'already-connected':
          clearInterval(pingInterval.current);
          socket.current.disconnect();
          setLoading(false);
          setErrorType(message.type);
          setError(true);
          break;
        case 'set-facility-id':
          // console.log(
          //   `facilityId, facilityName, uuid: ${message.facilityId}, ${message.facilityName}, ${message.uuid}`
          // );
          setFacilityId(message.facilityId);
          setFacilityName(message.facilityName);
          setUuid(message.uuid);
          setLoading(false);
          break;
        case 'admin':
          // console.log('message: ', message);
          setMessage(message.numbers);
          playSound(() => {
            announceNumber(
              message.numbers[0].number,
              message.numbers[0].facilityRoom
            );
          });
          break;
        case 'pong-client':
          setPongs((pongs) => pongs + 1);
          break;
        default:
          break;
      }
    });

    socket.current.on('close', () => {
      setAliveConn(false);
    });

    socket.current.connect();

    QRCode.toDataURL(
      `${window.location.origin}/public/${singleUseFacilityId}`
    ).then((url) => {
      // console.log(url);
      setQrCode(url);
    });

    const voices = speechSynthesis.getVoices();
    voices.forEach((voice) => {
      console.log(`Voice: ${voice.name}, Language: ${voice.lang}`);
    });

    return () => {
      if (socket.current) socket.current.disconnect();
    };
  }, [facilityId]);

  const startPing = () => {
    // console.log('CLIENT: send the pings');
    pingInterval.current = setInterval(() => {
      socket.current.send({
        type: 'ping-client',
        singleUseFacilityId,
      });
    }, 30000);
  };

  const playSound = (callback) => {
    const audio = new Audio('/assets/notification.mp3');
    audio.play();
    audio.onended = callback;
  };

  const announceNumber = (number, facilityRoom) => {
    const digits = number.toString().split('');
    const utterances = [`Number `, ...digits, `, ${facilityRoom}`];

    utterances.forEach((utterance) => {
      const speech = new SpeechSynthesisUtterance(utterance);
      speechSynthesis.speak(speech);
    });
  };

  if (loading) return <Loading />;

  if (error) return <Invalid errorType={errorType} />;

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
