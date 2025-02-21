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
    <div>
      <h1>Choose</h1>
      <div>
        <input
          type='text'
          value={facilityId}
          onChange={(e) => setFacilityId(e.target.value)}
          placeholder='Enter Facility ID'
        />
        <button onClick={goToAdmin}>Admin</button>
      </div>
      <div className='mt-4'>
        <button onClick={goToUser}>User</button>
      </div>
    </div>
  );
}
