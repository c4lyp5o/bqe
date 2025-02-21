'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

export default function UserPage() {
  const router = useRouter();

  const [qrCode, setQrCode] = useState(null);

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

      if (
        message.type === 'open-queue-screen' &&
        message.tempId === data.number
      ) {
        console.log('Received open-queue-screen message');
        router.push(`/user/${message.facilityId}-${message.uid}`);
      }
    };
  };

  useEffect(() => {
    console.log('CLIENT: open public mode');

    const getNanoid = async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BE_DOMAIN}/api/v1/getnanoid`
      );
      const data = await response.json();
      console.log(data);
      return data;
    };

    getNanoid().then((data) => {
      connectWebSocket(data);
      QRCode.toDataURL(
        `${process.env.NEXT_PUBLIC_BE_DOMAIN}/api/v1/trigger/temp-${data.number}`
      )
        .then((url) => {
          console.log(url);
          setQrCode(url);
        })
        .catch((err) => {
          console.error(err);
        });
    });

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return (
    <div>
      <h1>User Page</h1>
      <p>Scan the QR code to get started</p>
      <img src={qrCode} alt='QR Code' />
    </div>
  );
}
