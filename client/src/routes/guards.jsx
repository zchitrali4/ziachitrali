import { Navigate, useLocation } from 'react-router-dom';
import { ErrorState } from '../components/content/universal/ErrorState.jsx';
import { SkeletonRenderer } from '../components/skeletons/SkeletonRenderer.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function RequireAuth({ children }) {
  const { user, status } = useAuth();
  const location = useLocation();
  if (status !== 'ready') return <div className="wrap"><SkeletonRenderer variant="detail" /></div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  return children;
}

export function RequireAdmin({ children }) {
  const { user, status } = useAuth();
  const location = useLocation();
  if (status !== 'ready') return <div className="wrap"><SkeletonRenderer variant="detail" /></div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  const permissions = user.permissions || [];
  const allowed = permissions.includes('*') || permissions.some((item) => item.includes(':'));
  if (!allowed) {
    return <div className="wrap"><ErrorState message="You do not have permission to open the admin area." backTo="/" /></div>;
  }
  return children;
}
