import { HashRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Seed from './pages/Seed';
import OnboardingWelcome from './pages/OnboardingWelcome';
import OnboardingSelect from './pages/OnboardingSelect';
import OnboardingTargets from './pages/OnboardingTargets';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';

function Layout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  }

  return (
    <div className="min-h-screen flex flex-col font-body-lg text-body-lg">
      <nav className="bg-surface text-primary font-body-md text-body-md docked full-width top-0 border-b border-outline-variant flat no shadows transition-all duration-200 ease-in-out fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 max-w-container-max-width mx-auto">
        <div className="flex items-center gap-8">
          <div className="font-headline-md text-headline-md font-bold text-primary">Definite</div>
          <div className="hidden md:flex gap-6 items-center h-full">
            <Link to="/" className="text-primary border-b-2 border-primary pb-1 h-16 flex items-center pt-1 font-label-sm text-label-sm tracking-[0.02em] font-medium uppercase">Dashboard</Link>
            <Link to="/analytics" className="text-on-surface-variant hover:opacity-80 transition-opacity h-16 flex items-center pt-1 font-label-sm text-label-sm tracking-[0.02em] font-medium uppercase">Analytics</Link>
            <Link to="/profile" className="text-on-surface-variant hover:opacity-80 transition-opacity h-16 flex items-center pt-1 font-label-sm text-label-sm tracking-[0.02em] font-medium uppercase">Profile</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button aria-label="Dark Mode" className="hover:opacity-80 transition-opacity text-on-surface-variant flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-low">
            <span className="material-symbols-outlined">dark_mode</span>
          </button>
          
          <button onClick={handleLogout} className="text-on-surface-variant hover:opacity-80 transition-opacity text-sm font-medium ml-2">
            Logout
          </button>
          
          <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-high ml-2">
            {/* Dummy Avatar */}
            <div className="w-full h-full bg-primary-fixed-dim"></div>
          </div>
        </div>
      </nav>

      <main className="flex-grow pt-24 pb-16 px-margin-mobile md:px-margin-desktop max-w-container-max-width mx-auto w-full flex flex-col gap-12">
        {children}
      </main>

      <footer className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm full-width bottom border-t border-outline-variant flat no shadows transition-colors duration-150 w-full py-8 flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop gap-4 mt-auto">
        <div className="font-label-sm text-label-sm font-bold">© 2024 Definite Habit Tracker</div>
        <div className="flex gap-6">
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Support</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Terms</a>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
            <Route path="/profile" element={<Profile />} />
            
            <Route path="/seed" element={<Seed />} />
            <Route path="/onboarding/welcome" element={<OnboardingWelcome />} />
            <Route path="/onboarding/select" element={<OnboardingSelect />} />
            <Route path="/onboarding/targets" element={<OnboardingTargets />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
