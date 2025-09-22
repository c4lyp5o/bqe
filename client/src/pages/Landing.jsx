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
  { facilityRoom: 'Bilik 1', roomName: 'Bilik 1' },
  { facilityRoom: 'Bilik 2', roomName: 'Bilik 2' },
  { facilityRoom: 'Bilik 3', roomName: 'Bilik 3' },
];

export default function Landing() {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const [facilityRoom, setFacilityRoom] = useState('');

  const goToNumberCaller = async (e) => {
    e.preventDefault();

    try {
      const { data } = await axios.post('/api/v1/login', {
        password,
      });
      localStorage.setItem('token', data.token);
    } catch (error) {
      return toast.error('Login failed. Please try again.');
    }

    const facility = mockArray.find((fac) => fac.facilityId === facilityId);

    try {
      const { data } = await axios.post(
        '/api/v1/getsingle',
        {
          facilityId: facility.facilityId,
          facilityName: facility.facilityName,
          facilityRoom: facilityRoom,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      navigate(`/numbercaller/${data.singleUseFacilityId}`);
    } catch (error) {
      return toast.error('We have encountered an error. Please try again.');
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
          {facilityId && facilityRoom && (
            <input
              type='password'
              id='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Enter Password'
              required
              className='w-full p-3 mb-4 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
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
