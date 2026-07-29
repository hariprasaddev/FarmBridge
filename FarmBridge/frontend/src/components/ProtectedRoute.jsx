import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, role }) {
  const { token, role: userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role && userRole !== role) {
    // Redirect to the user's appropriate dashboard
    if (userRole === 'FARMER') return <Navigate to="/farmer/dashboard" replace />;
    if (userRole === 'BUYER') return <Navigate to="/buyer/products" replace />;
    if (userRole === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
