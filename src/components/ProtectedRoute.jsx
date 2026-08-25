import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGuest } from '../contexts/GuestContext';

export default function ProtectedRoute() {
  const { currentUser } = useAuth();
  const { isGuest } = useGuest();

  // Allow guests through without Firebase auth
  if (isGuest) return <Outlet />;

  // If there is no user, redirect to the login page
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the child routes inside an Outlet
  return <Outlet />;
}
