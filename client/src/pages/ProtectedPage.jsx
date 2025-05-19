import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';

import Loading from '../components/Loading';

const ProtectedPage = ({ children }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/', { state: { from: window.location.pathname } });
        return;
      }

      try {
        await axios.get('/api/v1/auth/validate-token', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setIsAuthenticated(true);
      } catch (error) {
        alert('Session expired. Please log in again.');
        navigate('/', { state: { from: window.location.pathname } });
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [navigate]);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Loading />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
};

export default ProtectedPage;
