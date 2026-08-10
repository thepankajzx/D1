import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
  const { currentUser } = useAuth();

  // If there is no user, redirect to the login page
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the child routes inside an Outlet
  return <Outlet />;
}
