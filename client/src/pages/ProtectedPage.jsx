import Loading from '../components/Loading';
import useAuthValidation from '../hooks/useAuthValidation';

const ProtectedPage = ({ children }) => {
  const { isAuthenticated, loading } = useAuthValidation();

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
