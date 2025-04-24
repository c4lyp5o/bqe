import { useEffect, useState, useRef, useContext } from 'react';
import { useParams } from 'react-router';
import QRCode from 'qrcode';
import { io } from 'socket.io-client';
import { GlobalVoiceContext } from '../context/VoiceContext';

import Loading from '../components/Loading';
import Invalid from '../components/Invalid';

export default function TvNumberDisplayPage() {
  const { multiId1, multiId2, multiId3 } = useParams();

  const tempId = multiId1; // from open tv display
  const singleUseFacilityId = multiId3; // from number caller

  const { selectedVoice } = GlobalVoiceContext();

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
    const wsUrl =
      import.meta.env.VITE_PUBLIC_BUILD === 'development'
        ? 'ws://localhost:5000'
        : `${window.location.host.includes('localhost') ? 'ws://' : 'wss://'}${
            window.location.host
          }`;

    socket.current = io(wsUrl, { autoConnect: true });

    socket.current.on('connect', () => {
      setAliveConn(true);
      socket.current.send({
        type: 'identifytvnumberdisplay',
        singleUseFacilityId: singleUseFacilityId,
      });
      startPing();
    });

    socket.current.on('message', (message) => {
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
          setFacilityId(message.facilityId);
          setFacilityName(message.facilityName);
          setUuid(message.uuid);
          setLoading(false);
          break;
        case 'numbercaller':
          setMessage(message.numbers);
          playSound(() => {
            announceNumber(
              message.numbers[0].number,
              message.numbers[0].facilityRoom
            );
          });
          break;
        case 'pong-tvnumberdisplay':
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
      `${window.location.origin}/ff/${singleUseFacilityId}`
    ).then((url) => {
      setQrCode(url);
    });

    return () => {
      if (socket.current) socket.current.disconnect();
    };
  }, [facilityId]);

  const startPing = () => {
    pingInterval.current = setInterval(() => {
      socket.current.send({
        type: 'ping-tvnumberdisplay',
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
    const utterances = [
      `Nombor `,
      ...digits,
      facilityRoom.split(' ')[0],
      facilityRoom.split(' ')[1],
    ];

    const handleSpeak = () => {
      utterances.forEach((utterance) => {
        const speech = new SpeechSynthesisUtterance(utterance);
        speech.voice = selectedVoice;
        speechSynthesis.speak(speech);
      });
    };

    if (!speechSynthesis.speaking) {
      handleSpeak();
    }
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
