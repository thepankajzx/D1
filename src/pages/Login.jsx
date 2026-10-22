import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGuest } from '../contexts/GuestContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../lib/firebase';
import { Eye, EyeSlash, ArrowRight, Sparkle, ShieldCheck } from '@phosphor-icons/react';

// 7-day pattern sample for the sleek Momentum Bar
const WEEK_DAYS = [
  { day: 'M', active: 2 },
  { day: 'T', active: 3 },
  { day: 'W', active: 4 },
  { day: 'T', active: 4 },
  { day: 'F', active: 3 },
  { day: 'S', active: 4 },
  { day: 'S', active: 4 }
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Interactive pattern feedback
  const [patternDays, setPatternDays] = useState(WEEK_DAYS);
  const [activeStreak, setActiveStreak] = useState(27);
  const [toastMessage, setToastMessage] = useState('');

  const { currentUser, login, signup, loginWithGoogle } = useAuth();
  const { enterGuestMode, exitGuestMode } = useGuest();
  const navigate = useNavigate();

  // Redirect if user already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2200);
  }

  function handleDayToggle(idx) {
    if (navigator?.vibrate) navigator.vibrate(10);
    setPatternDays(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], active: copy[idx].active === 4 ? 1 : 4 };
      return copy;
    });
    setActiveStreak(prev => (prev === 27 ? 28 : 27));
    showToast('Streak pattern updated 🔥');
  }

  function handleGuestMode() {
    if (navigator?.vibrate) navigator.vibrate(20);
    enterGuestMode();
    navigate('/');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setError('');
      setLoading(true);

      let userCred;
      if (isSignUp) {
        try {
          userCred = await signup(email, password);
        } catch (signupError) {
          if (signupError.code === 'auth/email-already-in-use') {
            userCred = await login(email, password);
          } else {
            throw signupError;
          }
        }
      } else {
        try {
          userCred = await login(email, password);
        } catch (loginError) {
          if (loginError.code === 'auth/invalid-credential' || loginError.code === 'auth/user-not-found') {
            try {
              userCred = await signup(email, password);
            } catch (signupError) {
              if (signupError.code === 'auth/email-already-in-use') {
                throw new Error('Invalid email or password.');
              }
              throw signupError;
            }
          } else {
            throw loginError;
          }
        }
      }

      if (userCred?.user) {
        exitGuestMode();
        const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
        if (fullName) {
          try {
            await updateProfile(userCred.user, { displayName: fullName });
          } catch (_) {}
        }

        const userRef = doc(db, 'users', userCred.user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            createdAt: new Date().toISOString(),
            displayName: fullName || userCred.user.displayName || '',
            email: userCred.user.email,
            currentStreak: 0,
            longestStreak: 0
          });
        }
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setError('');
      setLoading(true);
      const result = await loginWithGoogle();
      if (result?.user) {
        exitGuestMode();
        const userRef = doc(db, 'users', result.user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            createdAt: new Date().toISOString(),
            displayName: result.user.displayName || '',
            email: result.user.email,
            currentStreak: 0,
            longestStreak: 0
          });
        }
      }
      navigate('/');
    } catch (err) {
      if (err.message && (err.message.includes('Database is closing') || err.message.includes('hidden'))) {
        setError('Connection interrupted. Please tap Google sign-in again.');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between bg-[#F7FAF8] dark:bg-[#0B0F17] text-slate-900 dark:text-white px-4 py-3 sm:py-5 box-border select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-slate-900/95 dark:bg-white text-white dark:text-slate-900 shadow-xl text-xs font-bold tracking-wide flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-emerald-600 animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Centered Container */}
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-between py-1 sm:py-2">
        {/* ── 1. BRAND & EDITORIAL SECTION ── */}
        <div className="text-center space-y-1.5 shrink-0">
          {/* Logo with Light/Dark Support */}
          <div className="flex items-center justify-center pt-1">
            <img 
              src="/logo-black.svg" 
              alt="Definite" 
              className="h-8 sm:h-9 w-auto object-contain dark:hidden" 
            />
            <img 
              src="/logo-white.svg" 
              alt="Definite" 
              className="h-8 sm:h-9 w-auto object-contain hidden dark:block" 
            />
          </div>

          {/* Headline & Subtitle */}
          <div>
            <h1 className="text-[19px] sm:text-[22px] font-black tracking-tight leading-tight text-slate-900 dark:text-white">
              A habit isn’t just a checkbox.
            </h1>
            <p className="text-xs sm:text-[13px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              It’s a pattern of your future.
            </p>
          </div>

          {/* Sleek Momentum & Streak Card (Clean & Compact) */}
          <div 
            onClick={() => handleDayToggle(3)}
            title="Tap to preview habit pattern"
            className="mt-2 p-2 sm:p-2.5 rounded-2xl bg-white/90 dark:bg-[#131926]/90 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-500/40 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2 px-1 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs leading-none">🔥</span>
                <span className="text-[11px] font-black text-amber-700 dark:text-amber-400 tracking-tight">
                  {activeStreak} Days Streak
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                <Sparkle size={11} weight="fill" />
                <span>76% Today</span>
              </div>
            </div>

            {/* 7-Day Consistency Pattern Heatmap Bar */}
            <div className="grid grid-cols-7 gap-1.5">
              {patternDays.map((d, i) => (
                <div 
                  key={i} 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDayToggle(i);
                  }}
                  className="flex flex-col items-center gap-1"
                >
                  <div 
                    className={`w-full aspect-square rounded-md transition-all ${
                      d.active === 4 
                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-2xs' 
                        : d.active === 3 
                        ? 'bg-emerald-400' 
                        : d.active === 2 
                        ? 'bg-emerald-200 dark:bg-emerald-900/60' 
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  />
                  <span className="text-[8.5px] font-bold text-slate-400 dark:text-slate-500">
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 2. AUTHENTICATION FORM SECTION ── */}
        <div className="space-y-2.5 my-auto py-2">
          {/* Error Message */}
          {error && (
            <div className="py-1 px-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 text-red-600 dark:text-red-300 text-xs font-semibold text-center animate-in fade-in">
              {error}
            </div>
          )}

          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/70 font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.99]"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-0.5">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">or with email</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2">
            {/* Name Fields (Shown when Create Account is active) */}
            {isSignUp && (
              <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-150">
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
              </div>
            )}

            {/* Email Address */}
            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 sm:h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 sm:h-11 px-3.5 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeSlash size={16} weight="bold" /> : <Eye size={16} weight="bold" />}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 sm:h-11 rounded-xl bg-[#071A12] dark:bg-white hover:bg-slate-900 dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs sm:text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              <span>{loading ? 'Connecting...' : (isSignUp ? 'Create Account' : 'Continue with Email')}</span>
              <ArrowRight size={15} weight="bold" />
            </button>
          </form>

          {/* Explore Demo Button (Preserved Invariant 1) */}
          <button
            type="button"
            onClick={handleGuestMode}
            className="w-full h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
          >
            <span>👁️</span>
            <span>Explore Demo (50 Days Preloaded)</span>
          </button>
        </div>

        {/* ── 3. FOOTER LINKS & REDIRECTIONS ── */}
        <div className="text-center space-y-1.5 pt-1 shrink-0">
          {/* Mode Switcher */}
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            {isSignUp ? 'Already have an account?' : 'New to D1 Habit Tracker?'}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-emerald-600 dark:text-emerald-400 font-bold ml-1.5 hover:underline cursor-pointer"
            >
              {isSignUp ? 'Log in' : 'Create account'}
            </button>
          </p>

          {/* Guaranteed Working Redirection Links */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            <span>By continuing, you agree to</span>
            <button
              type="button"
              onClick={() => navigate('/terms')}
              className="text-slate-700 dark:text-slate-300 font-semibold underline underline-offset-2 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
            >
              Terms of Service
            </button>
            <span>&</span>
            <button
              type="button"
              onClick={() => navigate('/privacy')}
              className="text-slate-700 dark:text-slate-300 font-semibold underline underline-offset-2 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
