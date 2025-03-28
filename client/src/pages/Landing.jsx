import { useNavigate } from 'react-router';
import { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

// should be from resource
const mockArray = [
  { facilityId: 'KP-KL', facilityName: 'Klinik Pergigian Kuala Lumpur' },
  { facilityId: 'KP-P18', facilityName: 'Klinik Pergigian Presint 18' },
  { facilityId: 'KP-P9', facilityName: 'Klinik Pergigian Presint 9' },
];

// should be from resource
const mockRoomArray = [
  { facilityRoom: 'Room 1', roomName: 'Room 1' },
  { facilityRoom: 'Room 2', roomName: 'Room 2' },
  { facilityRoom: 'Room 3', roomName: 'Room 3' },
];

export default function Landing() {
  const navigate = useNavigate();

  const [facilityId, setFacilityId] = useState('');
  const [facilityRoom, setFacilityRoom] = useState('');

  const goToNumberCaller = async (e) => {
    e.preventDefault();

    const facility = mockArray.find((fac) => fac.facilityId === facilityId);

    try {
      const { data } = await axios.post('/api/v1/getsingle', {
        facilityId: facility.facilityId,
        facilityName: facility.facilityName,
        facilityRoom: facilityRoom,
      });

      navigate(`/numbercaller/${data.singleUseFacilityId}`);
    } catch (error) {
      // console.error(error);
      toast.error('We have encountered an error. Please try again.');
    }
  };

  const gotoTvDisplay = () => {
    navigate('/tv');
  };

  return (
    <div className='min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center'>
      <h1 className='text-4xl font-bold mb-8'>Queue Management System</h1>
      <div className='w-full max-w-md'>
        <form
          onSubmit={goToNumberCaller}
          className='flex flex-col items-center justify-center'
        >
          <select
            value={facilityId}
            required
            onChange={(e) => {
              setFacilityId(e.target.value);
              setFacilityRoom('');
            }}
            className='w-full p-3 mb-4 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value=''>Select Facility</option>
            {mockArray.map((facility) => (
              <option key={facility.facilityId} value={facility.facilityId}>
                {facility.facilityName}
              </option>
            ))}
          </select>
          {facilityId && (
            <select
              value={facilityRoom}
              required
              onChange={(e) => setFacilityRoom(e.target.value)}
              className='w-full p-3 mb-4 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value=''>Select Room</option>
              {mockRoomArray.map((room) => (
                <option key={room.facilityRoom} value={room.facilityRoom}>
                  {room.roomName}
                </option>
              ))}
            </select>
          )}
          <button
            type='submit'
            className='w-full p-3 mb-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold'
          >
            Number Caller
          </button>
        </form>
        <hr className='w-full border-t border-gray-700 my-4' />
        <button
          type='button'
          onClick={gotoTvDisplay}
          className='w-full p-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold'
        >
          TV Display
        </button>
      </div>
    </div>
  );
}
