'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import QRCode from 'qrcode';

export default function UserPage() {
  const router = useRouter();
  const { facilityId } = useParams();

  const tempFacId = facilityId.split('-')[0];
  const uid = facilityId.split('-')[1];

  const [aliveConn, setAliveConn] = useState(false);
  const [message, setMessage] = useState([]);
  const [pongs, setPongs] = useState(0);
  const [qrCode, setQrCode] = useState(null);

  const ws = useRef(null);
  const pingInterval = useRef(null);
  const reconnectTimeout = useRef(null);

  const connectWebSocket = () => {
    ws.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_DOMAIN}`);

    ws.current.onopen = () => {
      console.log('Connected to WebSocket server as client');
      setAliveConn(true);
      clearTimeout(reconnectTimeout.current);
      if (ws.current && ws.current.readyState === 1) {
        ws.current.send(
          JSON.stringify({ type: 'identifyclient', facilityId: tempFacId })
        );
        startPing();
      }
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      // console.log(message);

      if (message.type === 'admin' && message.facilityId === tempFacId) {
        setMessage(message.number);
      }

      if (message.type === 'pong-client' && message.facilityId === tempFacId) {
        setPongs((pongs) => pongs + 1);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
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
    console.log('CLIENT: user mode');

    QRCode.toDataURL(`${process.env.NEXT_PUBLIC_FE_DOMAIN}/public/${uid}`).then(
      (url) => {
        console.log(url);
        setQrCode(url);
      }
    );

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      clearTimeout(reconnectTimeout.current);
      clearInterval(pingInterval.current);
    };
  }, [facilityId]);

  const startPing = () => {
    console.log('CLIENT: send the pings');
    pingInterval.current = setInterval(() => {
      if (ws.current && ws.current.readyState === 1) {
        ws.current.send(
          JSON.stringify({ type: 'ping-client', facilityId: tempFacId })
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

  return (
    <div>
      <h1>User Page</h1>
      <p>Conection is alive: {aliveConn ? 'Yes' : 'No'}</p>
      <p>Pongs received: {pongs}</p>
      <p>Facility ID: {tempFacId}</p>
      <p>Unique Public ID: {uid}</p>
      <p>Current Number: {message[0]}</p>
      <div>
        Past Number:
        {message.slice(1, 6).map((i, index) => {
          return <p key={index}>{i}</p>;
        })}
      </div>
      <div>
        <button onClick={logOut} disabled={!aliveConn}>
          Log Out
        </button>
      </div>
      <div>
        <h2>QR Code For Public</h2>
        <img src={qrCode} alt='QR Code' />
      </div>
    </div>
  );
}
