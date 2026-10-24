import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGuest } from '../contexts/GuestContext';

export default function ProtectedRoute() {
  const { currentUser, loading } = useAuth();
  const { isGuest } = useGuest();

  // Allow guests through without Firebase auth
  if (isGuest) return <Outlet />;

  // While checking auth on startup, render lightweight loading state (avoids premature redirect to /login)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F141C] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // If there is no user, redirect to the login page
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the child routes inside an Outlet
  return <Outlet />;
}
