import { Navigate } from 'react-router-dom';
import { useAuth, roleHome } from '../context/AuthContext';
import { Spinner } from '../components/ui';

// Only lets in logged-in users whose role is in `roles`.
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner full />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={roleHome[user.role]} replace />;
  return children;
}
