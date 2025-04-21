import { useEffect, useState } from 'react';

export default function Invalid({ errorType }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    setTimeout(() => {
      window.location.href = '/';
    }, 5500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className='min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4'>
      <h1 className='text-4xl font-bold mb-8'>Queue Management System</h1>
      {errorType === 'killswitch' && (
        <p className='text-2xl'>💀☠️ Killswitch Activated ☠️💀</p>
      )}
      {errorType === 'no-valid-id' && <p className='text-2xl'>Invalid ID</p>}
      {errorType === 'already-connected' && (
        <p className='text-2xl'>ID is already connected</p>
      )}
      <p className='text-2xl'>Redirecting after {countdown} seconds</p>
    </div>
  );
}
