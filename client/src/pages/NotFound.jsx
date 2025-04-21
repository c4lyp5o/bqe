import React from 'react';
import { Link } from 'react-router';

const NotFound = () => {
  return (
    <div className='text-center py-12 font-sans'>
      <h1 className='text-9xl text-red-500'>404</h1>
      <p className='text-2xl text-gray-800 mb-5'>
        Oops! The page you're looking for doesn't exist.
      </p>
      <Link
        to='/'
        className='text-lg text-green-600 border border-green-600 px-5 py-2 rounded transition duration-300 hover:bg-green-600 hover:text-white'
      >
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFound;
