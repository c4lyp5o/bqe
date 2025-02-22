'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const [facilityId, setFacilityId] = useState('');

  const goToAdmin = () => {
    if (!facilityId) {
      alert('Please enter a facility ID');
      return;
    }
    router.push(`/admin/${facilityId}`);
  };

  const goToUser = () => {
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
          onClick={goToAdmin}
          className='w-full p-3 mb-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold'
        >
          Admin
        </button>
        <button
          onClick={goToUser}
          className='w-full p-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold'
        >
          User
        </button>
      </div>
    </div>
  );
}
