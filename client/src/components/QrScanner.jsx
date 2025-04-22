import { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Scanner, useDevices } from '@yudiel/react-qr-scanner';

export default function QrScanner({ singleUseFacilityId }) {
  const allDevices = useDevices();

  const [pause, setPause] = useState(false);
  const [deviceId, setDeviceId] = useState(undefined);

  const handleScan = async (result) => {
    if (result) {
      try {
        const tempId = result[0].rawValue.split('temp-')[1];
        const qrCode = `/api/v1/trigger/${tempId}-${singleUseFacilityId}`;
        await axios.get(qrCode, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        // console.log('QR code processed successfully');
      } catch (error) {
        toast.error('Invalid QR code');
        // console.error('Error processing QR code:', error);
      } finally {
        setCameraOn(false);
      }
    }
  };

  return (
    <>
      <button
        onClick={() => setPause((pause) => !pause)}
        className='mt-2 p-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg'
      >
        {pause ? 'Resume' : 'Pause'}
      </button>
      <div className='mt-2'>
        <select
          onChange={(e) => setDeviceId(e.target.value)}
          className='p-2 bg-gray-800 text-white rounded-lg'
        >
          <option value={undefined}>Select a device</option>
          {allDevices.map((device, index) => (
            <option key={index} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      </div>
      <Scanner
        constraints={{
          deviceId: deviceId,
        }}
        // onError={(error) => {
        //   console.log(`onError: ${error}'`);
        // }}
        scanDelay={2000}
        paused={pause}
        onScan={handleScan}
        className='mt-2'
      />
    </>
  );
}
