import { HashRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import { GuestProvider, useGuest } from './contexts/GuestContext';

import { ErrorBoundary } from './components/ErrorBoundary';
import Icon from './components/Icon';
import Footer from './components/Footer';
import { Compass, SunHorizon, ChartLineUp, Binoculars, Moon, Sun } from '@phosphor-icons/react';

import { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
function lazyRetry(componentImport) {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      const isChunkLoadError = error?.name === 'ChunkLoadError' || 
                               (error?.message && error.message.includes('Failed to fetch dynamically imported module'));
      if (isChunkLoadError) {
        const isReloaded = sessionStorage.getItem('chunk_retry_' + window.location.pathname);
        if (!isReloaded) {
          sessionStorage.setItem('chunk_retry_' + window.location.pathname, 'true');
          window.location.reload();
          return new Promise(() => {}); // hold promise until reload
        }
      }
      throw error;
    }
  });
}

const Analytics = lazyRetry(() => import('./pages/Analytics'));
const ExperimentalAnalytics = lazyRetry(() => import('./pages/ExperimentalAnalytics'));
const DeepDive = lazyRetry(() => import('./pages/DeepDive'));

const DeepDiveIndex = lazyRetry(() => import('./pages/DeepDiveIndex'));
const RecoveryDeepDive = lazyRetry(() => import('./pages/RecoveryDeepDive'));
const HabitDiagnostics = lazyRetry(() => import('./pages/HabitDiagnostics'));
const InsightFeed = lazyRetry(() => import('./pages/InsightFeed'));
const BetterReport = lazyRetry(() => import('./pages/BetterReport'));
const InsightsRoadmap = lazyRetry(() => import('./pages/InsightsRoadmap'));
const ScoringGuide = lazyRetry(() => import('./pages/ScoringGuide'));
const StreaksPage = lazyRetry(() => import('./pages/StreaksPage'));
const StreakMilestonesPage = lazyRetry(() => import('./pages/StreakMilestonesPage'));

const Profile = lazyRetry(() => import('./pages/Profile'));
const OnboardingWelcome = lazyRetry(() => import('./pages/OnboardingWelcome'));
const OnboardingSelect = lazyRetry(() => import('./pages/AdvancedHabitSelector'));
const OnboardingTargets = lazyRetry(() => import('./pages/OnboardingTargets'));
const Subscription = lazyRetry(() => import('./pages/Subscription'));
const Privacy = lazyRetry(() => import('./pages/Privacy'));
const Terms = lazyRetry(() => import('./pages/Terms'));

function Layout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { isGuest, exitGuestMode } = useGuest();
  const [guestBannerVisible, setGuestBannerVisible] = useState(true);

  function handleExitGuest() {
    exitGuestMode();
    navigate('/login');
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  }

  const getLinkClass = (path) => {
    let isActive = false;
    if (path === '/') {
      isActive = location.pathname === '/';
    } else if (path === '/deep-dive') {
      isActive = location.pathname.includes('/deep-dive');
    } else if (path === '/analytics') {
      isActive = location.pathname.startsWith('/analytics') && !location.pathname.includes('/deep-dive');
    } else {
      isActive = location.pathname.startsWith(path);
    }
    return `h-13 flex items-center pt-0.5 font-label-sm text-label-sm tracking-[0.02em] font-medium uppercase transition-colors ${
      isActive 
        ? 'text-primary border-b-2 border-primary pb-0.5' 
        : 'text-on-surface-variant hover:text-primary hover:opacity-80'
    }`;
  };

  const isActivePath = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/deep-dive') return location.pathname.includes('/deep-dive');
    if (path === '/analytics') return location.pathname.startsWith('/analytics') && !location.pathname.includes('/deep-dive');
    return location.pathname.startsWith(path);
  };

  const showFooter = [
    '/profile',
    '/subscription',
    '/terms',
    '/privacy'
  ].some(p => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen flex flex-col font-body-lg text-body-lg bg-background text-on-background pb-16 md:pb-0 w-full max-w-full overflow-x-hidden">
      {/* Top Navbar */}
      <nav className="bg-surface/95 backdrop-blur-md text-primary font-body-md text-body-md border-b border-outline-variant/30 shadow-xs fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 sm:px-6 md:px-8 lg:px-10 2xl:px-12 h-[calc(3.25rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] box-border">
        {/* Left: Brand Logo Only */}
        <Link to="/" className="flex items-center flex-shrink-0">
          {/* Mobile (< sm): Standalone D mark */}
          <img src="/icon-d-black.svg?v=8" alt="Definite" className="w-auto object-contain dark:hidden sm:hidden" style={{height: '24px'}} />
          <img src="/icon-d-white.svg?v=8" alt="Definite" className="w-auto object-contain hidden dark:block sm:hidden" style={{height: '24px'}} />
          
          {/* Desktop (sm+): Full Wordmark Logo */}
          <img src="/logo-black.svg?v=8" alt="Definite" className="w-auto object-contain hidden sm:block dark:hidden" style={{height: '21px'}} />
          <img src="/logo-white.svg?v=8" alt="Definite" className="w-auto object-contain hidden sm:dark:block" style={{height: '21px'}} />
        </Link>

        {/* Right: Nav Tabs + Profile */}
        <div className="flex items-center gap-5 sm:gap-6 md:gap-7 flex-shrink-0 h-full">
          <div className="hidden md:flex gap-5 lg:gap-7 items-center h-full">
            {/* TODAY (Amber / Gold wrapper with Black Sun) */}
            <Link to="/" className={getLinkClass('/')}>
              <span className="flex items-center gap-2 group">
                <span className={`w-[28px] h-[28px] rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  isActivePath('/') 
                    ? 'bg-amber-400/25 border border-amber-400/40 shadow-xs' 
                    : 'bg-amber-400/15 border border-amber-400/20 group-hover:bg-amber-400/25'
                }`}>
                  <SunHorizon 
                    size={15} 
                    weight="bold" 
                    className="text-black dark:text-white"
                  />
                </span>
                Today
              </span>
            </Link>

            {/* ANALYTICS (Royal Blue Trend) */}
            <Link to="/analytics" className={getLinkClass('/analytics')}>
              <span className="flex items-center gap-2 group">
                <span className={`w-[28px] h-[28px] rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  isActivePath('/analytics') 
                    ? 'bg-blue-500/15 border border-blue-500/30' 
                    : 'bg-blue-500/8 group-hover:bg-blue-500/15'
                }`}>
                  <ChartLineUp 
                    size={15} 
                    weight={isActivePath('/analytics') ? 'duotone' : 'regular'} 
                    className={isActivePath('/analytics') ? 'text-blue-500' : 'text-blue-600/75 dark:text-blue-400/75'}
                  />
                </span>
                Analytics
              </span>
            </Link>

            {/* DEEP DIVE (Purple / Violet Discovery) */}
            <Link to="/deep-dive" className={getLinkClass('/deep-dive')}>
              <span className="flex items-center gap-2 group">
                <span className={`w-[28px] h-[28px] rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  isActivePath('/deep-dive') 
                    ? 'bg-purple-500/15 border border-purple-500/30' 
                    : 'bg-purple-500/8 group-hover:bg-purple-500/15'
                }`}>
                  <Binoculars 
                    size={15} 
                    weight={isActivePath('/deep-dive') ? 'duotone' : 'regular'} 
                    className={isActivePath('/deep-dive') ? 'text-purple-500' : 'text-purple-600/75 dark:text-purple-400/75'}
                  />
                </span>
                Deep Dive
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Top-right: If Guest, show both Log In CTA and Profile icon */}
            {isGuest && (
              <button
                onClick={handleExitGuest}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <Icon name="login" className="text-sm" />
                <span className="hidden sm:inline">Log In / Sign Up</span>
                <span className="sm:hidden">Log In</span>
              </button>
            )}

            {/* Profile Icon (Available to everyone, including guests to preview profile & milestones) */}
            <Link
              to="/profile"
              className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-medium p-1 rounded-lg hover:bg-surface-container"
              title="Profile"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Icon name="person" className="text-xl" />
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Spacer for Fixed Navbar */}
      <div className="h-[3.25rem] pt-[env(safe-area-inset-top)] shrink-0"></div>

      {/* Guest mode banner */}
      {isGuest && guestBannerVisible && (
        <div className="w-full bg-indigo-600 text-white text-xs font-semibold flex items-center justify-between px-4 py-2 gap-2 shrink-0">
          <span className="flex items-center gap-1.5">
            <span>👁</span>
            <span>You're viewing a demo with 50 days of sample data — <button onClick={handleExitGuest} className="underline font-bold cursor-pointer">Sign up free</button> to track your own habits</span>
          </span>
          <button onClick={() => setGuestBannerVisible(false)} className="opacity-70 hover:opacity-100 text-base leading-none cursor-pointer">×</button>
        </div>
      )}

      {/* Main App Container */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-3 sm:px-6 md:px-8 lg:px-10 2xl:px-12 pt-1.5 pb-4 sm:py-5 md:py-6 min-w-0">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {/* Modern Compact Dark Footer (Rendered only on Profile, Subscription, and Legal/Roadmap pages) */}
      {showFooter && <Footer />}

      {/* Mobile Bottom Navigation (Ultra Thin, Premium Pill) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-surface/95 backdrop-blur-md border-t border-outline-variant/30 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] flex justify-around items-center px-2 py-2.5 pb-[calc(env(safe-area-inset-bottom)+10px)] z-50">
        
        {/* Dashboard / Today */}
        <Link to="/" className={`flex items-center gap-1.5 px-4 py-2 rounded-[24px] transition-all duration-150 active:scale-95 cursor-pointer select-none ${location.pathname === '/' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-primary'}`}>
          <Icon name={location.pathname === '/' ? 'home_filled' : 'home'} className="text-[18px]" />
          <span className="text-[12px] font-bold tracking-wide">Today</span>
        </Link>

        
        {/* Analytics */}
        <Link to="/analytics" className={`flex items-center gap-1.5 px-4 py-2 rounded-[24px] transition-all duration-150 active:scale-95 cursor-pointer select-none ${(location.pathname.startsWith('/analytics') && !location.pathname.includes('/deep-dive')) ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-primary'}`}>
          <Icon name={(location.pathname.startsWith('/analytics') && !location.pathname.includes('/deep-dive')) ? 'bar_chart' : 'bar_chart'} className="text-[18px]" />
          <span className="text-[12px] font-bold tracking-wide">Stats</span>
        </Link>

        {/* Deep Dive */}
        <Link to="/deep-dive" className={`flex items-center gap-1.5 px-4 py-2 rounded-[24px] transition-all duration-150 active:scale-95 cursor-pointer select-none ${location.pathname.includes('/deep-dive') ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-primary'}`}>
          <Compass size={18} weight={location.pathname.includes('/deep-dive') ? "fill" : "bold"} />
          <span className="text-[12px] font-bold tracking-wide">Dive</span>
        </Link>

        {/* Profile (Me) */}
        <Link to="/profile" className={`flex items-center gap-1.5 px-4 py-2 rounded-[24px] transition-all duration-150 active:scale-95 cursor-pointer select-none ${location.pathname.startsWith('/profile') ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-primary'}`}>
          <Icon name={location.pathname.startsWith('/profile') ? 'person' : 'person_outline'} className="text-[18px]" />
          <span className="text-[12px] font-bold tracking-wide">Me</span>
        </Link>
        
      </div>
    </div>
  );
}

function RoutePreloader() {
  useEffect(() => {
    const preload = () => {
      import('./pages/ExperimentalAnalytics');
      import('./pages/DeepDive');
      import('./pages/DeepDiveIndex');
      import('./pages/Profile');
      import('./pages/RecoveryDeepDive');
      import('./pages/StreakMilestonesPage');
      import('./pages/BetterReport');
      import('./pages/HabitDiagnostics');
      import('./pages/InsightFeed');
      import('./pages/InsightsRoadmap');
      import('./pages/Subscription');
    };
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(preload);
      } else {
        setTimeout(preload, 1000);
      }
    }
  }, []);
  return null;
}

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <LanguageProvider>
          <GuestProvider>
            <AuthProvider>
              <DataProvider>
                <HashRouter>
                <RoutePreloader />
                <ScrollToTop />
                <Suspense fallback={
                  <div className="min-h-screen bg-background"></div>
                }>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  
                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Layout><Dashboard /></Layout>} />
                    <Route path="/analytics" element={<Layout><ExperimentalAnalytics /></Layout>} />
                    <Route path="/analytics/experimental" element={<Layout><ExperimentalAnalytics /></Layout>} />
                    <Route path="/experimental-stats" element={<Layout><ExperimentalAnalytics /></Layout>} />
                    <Route path="/analytics/deep-dive" element={<Layout><DeepDive /></Layout>} />

                    {/* Habit Resilience Hub */}
                    <Route path="/analytics/recovery" element={<Layout><RecoveryDeepDive /></Layout>} />
                    <Route path="/analytics/deep-dive/recovery" element={<Layout><RecoveryDeepDive /></Layout>} />
                    <Route path="/deep-dive/recovery" element={<Layout><RecoveryDeepDive /></Layout>} />
                    <Route path="/resilience" element={<Layout><RecoveryDeepDive /></Layout>} />

                    {/* Habit Diagnostics & Root Cause Breakdown */}
                    <Route path="/analytics/diagnose" element={<Layout><HabitDiagnostics /></Layout>} />
                    <Route path="/diagnostics" element={<Layout><HabitDiagnostics /></Layout>} />
                    <Route path="/diagnose" element={<Layout><HabitDiagnostics /></Layout>} />
                    <Route path="/deep-dive" element={<Layout><DeepDiveIndex /></Layout>} />
                    <Route path="/profile" element={<Layout><Profile /></Layout>} />
                    <Route path="/subscription" element={<Layout><Subscription /></Layout>} />
                    <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
                    <Route path="/terms" element={<Layout><Terms /></Layout>} />
                    <Route path="/insights" element={<Layout><InsightFeed /></Layout>} />
                    <Route path="/better-report" element={<Layout><BetterReport /></Layout>} />
                    <Route path="/roadmap" element={<Layout><InsightsRoadmap /></Layout>} />
                    <Route path="/insights-roadmap" element={<Layout><InsightsRoadmap /></Layout>} />
                    <Route path="/streak-milestones" element={<Layout><StreakMilestonesPage /></Layout>} />
                    <Route path="/milestones" element={<Layout><StreakMilestonesPage /></Layout>} />
                    <Route path="/analytics/streaks" element={<Layout><StreakMilestonesPage /></Layout>} />
                    <Route path="/streaks" element={<Layout><StreakMilestonesPage /></Layout>} />
                    <Route path="/scoring-guide" element={<Layout><ScoringGuide /></Layout>} />
                    <Route path="/scoring" element={<Layout><ScoringGuide /></Layout>} />
                    <Route path="/onboarding/select" element={<OnboardingSelect />} />
                  </Route>

                  <Route path="/onboarding/welcome" element={<OnboardingWelcome />} />
                  <Route path="/landing" element={<OnboardingWelcome />} />
                  <Route path="/welcome" element={<OnboardingWelcome />} />
                  <Route path="/onboarding/targets" element={<OnboardingTargets />} />
                  
                  <Route path="*" element={<Layout><Dashboard /></Layout>} />
                </Routes>
              </Suspense>
              </HashRouter>
            </DataProvider>
          </AuthProvider>
          </GuestProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}


export default App;
