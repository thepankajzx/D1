import { HashRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';

import { ErrorBoundary } from './components/ErrorBoundary';
import Icon from './components/Icon';
import { Compass } from '@phosphor-icons/react';

import { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
const Analytics = lazy(() => import('./pages/Analytics'));
const ExperimentalAnalytics = lazy(() => import('./pages/ExperimentalAnalytics'));
const DeepDive = lazy(() => import('./pages/DeepDive'));

const DeepDiveIndex = lazy(() => import('./pages/DeepDiveIndex'));
const RecoveryDeepDive = lazy(() => import('./pages/RecoveryDeepDive'));
const HabitDiagnostics = lazy(() => import('./pages/HabitDiagnostics'));
const InsightFeed = lazy(() => import('./pages/InsightFeed'));
const BetterReport = lazy(() => import('./pages/BetterReport'));
const InsightsRoadmap = lazy(() => import('./pages/InsightsRoadmap'));
const ScoringGuide = lazy(() => import('./pages/ScoringGuide'));
const StreaksPage = lazy(() => import('./pages/StreaksPage'));
const StreakMilestonesPage = lazy(() => import('./pages/StreakMilestonesPage'));

const Profile = lazy(() => import('./pages/Profile'));
const OnboardingWelcome = lazy(() => import('./pages/OnboardingWelcome'));
const OnboardingSelect = lazy(() => import('./pages/AdvancedHabitSelector'));
const OnboardingTargets = lazy(() => import('./pages/OnboardingTargets'));
const Subscription = lazy(() => import('./pages/Subscription'));

function Layout({ children }) {
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

  return (
    <div className="min-h-screen flex flex-col font-body-lg text-body-lg bg-background text-on-background pb-16 md:pb-0 w-full max-w-full overflow-x-hidden">
      {/* Top Navbar */}
      <nav className="bg-surface/95 backdrop-blur-md text-primary font-body-md text-body-md border-b border-outline-variant/30 shadow-xs fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 sm:px-6 md:px-8 h-[calc(3.25rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] box-border">
        <div className="flex items-center gap-6 md:gap-8 min-w-0">
          <Link to="/" className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-2 flex-shrink-0">
            <Icon name="rocket_launch" className="" />
            Definite
          </Link>
          <div className="hidden md:flex gap-6 lg:gap-8 items-center h-full">
            <Link to="/" className={getLinkClass('/')}>Dashboard</Link>
            <Link to="/analytics" className={getLinkClass('/analytics')}>Analytics</Link>
            <Link to="/deep-dive" className={getLinkClass('/deep-dive')}>Deep Dive</Link>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to="/profile"
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-medium p-1.5 rounded-lg hover:bg-surface-container"
            title="Profile"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="person" className="text-xl" />
            </div>
          </Link>
        </div>
      </nav>

      {/* Main Content Spacer for Fixed Navbar */}
      <div className="h-[3.25rem] pt-[env(safe-area-inset-top)] shrink-0"></div>

      {/* Main App Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 md:px-8 pt-1.5 pb-4 sm:py-5 md:py-6 min-w-0">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="hidden md:flex bg-surface border-t border-outline-variant/30 py-6 px-8 justify-between items-center text-body-sm font-body-sm text-on-surface-variant mt-auto">
        <div>
          © 2026 Definite Habit Tracker. Built for champions.
        </div>
        <div className="flex gap-6">
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Support</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Terms</a>
        </div>
      </footer>

      {/* Mobile Bottom Navigation (Ultra Thin, Premium Pill) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] flex justify-around items-center px-2 py-2.5 pb-[calc(env(safe-area-inset-bottom)+10px)] z-50">
        
        {/* Dashboard / Today */}
        <Link to="/" className={`flex items-center gap-1.5 px-4 py-2 rounded-[24px] transition-all duration-300 ${location.pathname === '/' ? 'bg-[#1a1a1a] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}>
          <Icon name={location.pathname === '/' ? 'home_filled' : 'home'} className="text-[18px]" />
          <span className="text-[12px] font-bold tracking-wide">Today</span>
        </Link>

        
        {/* Analytics */}
        <Link to="/analytics" className={`flex items-center gap-1.5 px-4 py-2 rounded-[24px] transition-all duration-300 ${(location.pathname.startsWith('/analytics') && !location.pathname.includes('/deep-dive')) ? 'bg-[#1a1a1a] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}>
          <Icon name={(location.pathname.startsWith('/analytics') && !location.pathname.includes('/deep-dive')) ? 'bar_chart' : 'bar_chart'} className="text-[18px]" />
          <span className="text-[12px] font-bold tracking-wide">Stats</span>
        </Link>

        {/* Deep Dive */}
        <Link to="/deep-dive" className={`flex items-center gap-1.5 px-4 py-2 rounded-[24px] transition-all duration-300 ${location.pathname.includes('/deep-dive') ? 'bg-[#1a1a1a] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}>
          <Compass size={18} weight={location.pathname.includes('/deep-dive') ? "fill" : "bold"} />
          <span className="text-[12px] font-bold tracking-wide">Dive</span>
        </Link>

        {/* Profile */}
        <Link to="/profile" className={`flex items-center gap-1.5 px-4 py-2 rounded-[24px] transition-all duration-300 ${location.pathname.startsWith('/profile') ? 'bg-[#1a1a1a] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}>
          <Icon name={location.pathname.startsWith('/profile') ? 'person' : 'person_outline'} className="text-[18px]" />
          <span className="text-[12px] font-bold tracking-wide">Me</span>
        </Link>
        
      </div>
    </div>
  );
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
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <DataProvider>
            <HashRouter>
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
                  <Route path="/onboarding/targets" element={<OnboardingTargets />} />
                  
                  <Route path="*" element={<Layout><Dashboard /></Layout>} />
                </Routes>
              </Suspense>
            </HashRouter>
          </DataProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}


export default App;
