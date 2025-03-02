'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function HomePage() {
  const router = useRouter();

  const [facilityId, setFacilityId] = useState('');

  const goToNumberCaller = async () => {
    if (!facilityId) {
      alert('Please enter a facility ID');
      return;
    }

    try {
      const response = await fetch('/api/v1/getSingle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ facilityId }),
      });

      if (!response.ok) {
        throw new Error('Failed to save facility ID');
      }

      const data = await response.json();
      const singleUseFacilityId = data.singleUseFacilityId;

      router.push(`/admin/${singleUseFacilityId}`);
    } catch (error) {
      console.error('Error saving facility ID:', error);
      alert('Failed to save facility ID. Please try again.');
    }
  };

  const gotoTvDisplay = () => {
    router.push(`/user`);
  };

  return (
    <div className='min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center'>
      <h1 className='text-4xl font-bold mb-8'>Queue Management System</h1>
      <div className='w-full max-w-md'>
        <input
          type='text'
          value={facilityId}
          onChange={(e) => setFacilityId(e.target.value)}
          placeholder='Enter Facility ID'
          className='w-full p-3 mb-4 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
        />
        <button
          onClick={goToNumberCaller}
          className='w-full p-3 mb-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold'
        >
          Number Caller
        </button>
        <button
          onClick={gotoTvDisplay}
          className='w-full p-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold'
        >
          TV Display
        </button>
      </div>
    </div>
  );
}
