import { HashRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import ProtectedRoute from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import Icon from './components/Icon';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
const Analytics = lazy(() => import('./pages/Analytics'));

const Profile = lazy(() => import('./pages/Profile'));
const Seed = lazy(() => import('./pages/Seed'));
const OnboardingWelcome = lazy(() => import('./pages/OnboardingWelcome'));
const OnboardingSelect = lazy(() => import('./pages/OnboardingSelect'));
const OnboardingTargets = lazy(() => import('./pages/OnboardingTargets'));
const Subscription = lazy(() => import('./pages/Subscription'));

function Layout({ children }) {
// ... keep layout same ...
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  }

  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    return `h-16 flex items-center pt-1 font-label-sm text-label-sm tracking-[0.02em] font-medium uppercase transition-colors ${
      isActive 
        ? 'text-primary border-b-2 border-primary pb-1' 
        : 'text-on-surface-variant hover:text-primary hover:opacity-80'
    }`;
  };

  return (
    <div className="min-h-screen flex flex-col font-body-lg text-body-lg bg-background text-on-background pb-16 md:pb-0">
      {/* Top Navbar - Full Width on PC */}
      <nav className="bg-surface text-primary font-body-md text-body-md docked full-width border-b border-outline-variant/30 flat shadow-sm transition-colors duration-200 ease-in-out fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-surface/95">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-2">
            <Icon name="rocket_launch" className="" />
            Definite
          </Link>
          <div className="hidden md:flex gap-8 items-center h-full">
            <Link to="/" className={getLinkClass('/')}>Dashboard</Link>
            <Link to="/analytics" className={getLinkClass('/analytics')}>Analytics</Link>
            <Link to="/profile" className={getLinkClass('/profile')}>Profile</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/profile" className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary hover:bg-surface-variant transition-colors border border-outline-variant">
            <Icon name="person" className=" text-[20px]" />
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-24 pb-8 px-4 md:px-8 w-full flex flex-col gap-12">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {/* Desktop Footer */}
      <footer className="hidden md:flex bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm full-width border-t border-outline-variant/50 transition-colors duration-150 w-full py-8 flex-col md:flex-row justify-between items-center px-8 gap-4 mt-auto">
        <div className="font-label-sm text-label-sm font-bold flex items-center gap-2">
          <Icon name="bolt" className=" text-[16px]" />
          Definite Habit Tracker
        </div>
        <div className="flex gap-6">
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Support</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Terms</a>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-surface border-t border-outline-variant/30 h-16 flex justify-around items-center z-50 pb-safe">
          <Link to="/" className={`flex flex-col items-center justify-center w-full h-full ${location.pathname === '/' ? 'text-primary' : 'text-on-surface-variant'}`}>
            <Icon name="home" className=" text-2xl" />
            <span className="text-[10px] font-medium mt-1">Dashboard</span>
          </Link>
          <Link to="/analytics" className={`flex flex-col items-center justify-center w-full h-full ${location.pathname === '/analytics' ? 'text-primary' : 'text-on-surface-variant'}`}>
            <Icon name="bar_chart" className=" text-2xl" />
            <span className="text-[10px] font-medium mt-1">Analytics</span>
          </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <HashRouter>
            <Suspense fallback={
              <div className="min-h-screen bg-background"></div>
            }>
              <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Layout><Dashboard /></Layout>} />
                  <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
                  <Route path="/profile" element={<Layout><Profile /></Layout>} />
                  <Route path="/subscription" element={<Layout><Subscription /></Layout>} />
                  
                  <Route path="/seed" element={<Seed />} />
                  <Route path="/onboarding/welcome" element={<OnboardingWelcome />} />
                  <Route path="/onboarding/select" element={<OnboardingSelect />} />
                  <Route path="/onboarding/targets" element={<OnboardingTargets />} />
                </Route>
              </Routes>
            </Suspense>
          </HashRouter>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
