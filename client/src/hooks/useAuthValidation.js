import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';

export default function useAuthValidation() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const validateToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/', {
          state: { from: window.location.pathname },
          replace: true,
        });
        return;
      }

      try {
        await axios.get('/api/v1/auth/validate-token', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (isMounted) setIsAuthenticated(true);
      } catch (error) {
        if (isMounted) {
          alert('Session expired. Please log in again.');
          navigate('/', {
            state: { from: window.location.pathname },
            replace: true,
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    validateToken();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return { isAuthenticated, loading };
}
