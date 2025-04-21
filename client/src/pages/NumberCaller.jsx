import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

import QrScanner from '../components/QrScanner';
import Loading from '../components/Loading';
import Invalid from '../components/Invalid';

export default function NumberCallerPage() {
  const navigate = useNavigate();
  const { singleUseFacilityId } = useParams();

  // page status
  const [aliveConn, setAliveConn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorType, setErrorType] = useState(null);
  const [pongs, setPongs] = useState(0);

  // queue number
  const [number, setNumber] = useState('');
  const [allNumber, setAllNumber] = useState([]);

  // facility data
  const [facilityId, setFacilityId] = useState(null);
  const [facilityName, setFacilityName] = useState(null);
  const [facilityRoom, setFacilityRoom] = useState(null);

  // client side id
  const [uuid, setUuid] = useState(null);

  // camera
  const [cameraOn, setCameraOn] = useState(false);

  const socket = useRef(null);
  const pingInterval = useRef(null);

  useEffect(() => {
    const wsUrl = `${
      window.location.host.includes('localhost') ? 'ws://' : 'wss://'
    }${window.location.host}`;

    socket.current = io(wsUrl, {
      autoConnect: true,
    });

    socket.current.on('connect', () => {
      setAliveConn(true);
      socket.current.send({
        type: 'identifynumbercaller',
        singleUseFacilityId,
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
          setFacilityRoom(message.facilityRoom);
          setUuid(message.uuid);
          setLoading(false);
          break;
        case 'pong-numbercaller':
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

    return () => {
      if (socket.current) socket.current.disconnect();
    };
  }, []);

  const sendNumber = () => {
    if (!aliveConn) {
      toast.error('You are not connected');
      return;
    }
    if (isNaN(parseInt(number))) {
      toast.error(`${number} is not a valid number`);
      return;
    }
    const currAllNumber = [{ number: parseInt(number), facilityRoom }].concat(
      allNumber
    );
    setAllNumber(currAllNumber);
    setNumber('');
    socket.current.send({
      type: 'numbercaller',
      singleUseFacilityId,
      facilityId,
      number: parseInt(number),
      facilityRoom,
    });
  };

  const startPing = () => {
    clearInterval(pingInterval.current);
    pingInterval.current = setInterval(() => {
      socket.current.send({ type: 'ping-numbercaller', singleUseFacilityId });
    }, 30000);
  };

  const logOut = () => {
    clearInterval(pingInterval.current);
    socket.current.send({ type: 'logout-numbercaller', singleUseFacilityId });
    socket.current.disconnect();
    navigate('/');
  };

  const triggerCamera = () => {
    setCameraOn(!cameraOn);
  };

  if (loading) return <Loading />;

  if (error) return <Invalid errorType={errorType} />;

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
        <div className='mt-3'>
          {cameraOn && <QrScanner singleUseFacilityId={singleUseFacilityId} />}
        </div>
      </div>
    </div>
  );
}
