import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import axios from 'axios';

import Loading from '../components/Loading';

const ProtectedPage = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const validateToken = async () => {
      try {
        await axios.get('/api/v1/validate-token', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    validateToken();
  }, []);

  if (isAuthenticated === null) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to='/' replace />;
  }

  return <>{children}</>;
};

export default ProtectedPage;
