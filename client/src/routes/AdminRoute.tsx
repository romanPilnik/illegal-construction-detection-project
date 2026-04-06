import { Navigate, Outlet } from 'react-router-dom';
import { getStoredUser } from '../lib/stored-user';

export function AdminRoute() {
  const user = getStoredUser();

  if (user?.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
