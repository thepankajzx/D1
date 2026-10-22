import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGuest } from '../contexts/GuestContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../lib/firebase';
import { Eye, EyeSlash, ArrowRight, Sparkle } from '@phosphor-icons/react';

// 7-day pattern sample
const INITIAL_DAYS = [
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

  // Interactive pattern & toast
  const [patternDays, setPatternDays] = useState(INITIAL_DAYS);
  const [activeStreak, setActiveStreak] = useState(27);
  const [toastText, setToastText] = useState('');

  const { currentUser, login, signup, loginWithGoogle } = useAuth();
  const { enterGuestMode, exitGuestMode } = useGuest();
  const navigate = useNavigate();

  // Redirect if logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  function triggerToast(msg) {
    setToastText(msg);
    setTimeout(() => setToastText(''), 2200);
  }

  function handleDayToggle(idx) {
    if (navigator?.vibrate) navigator.vibrate(10);
    setPatternDays(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], active: copy[idx].active === 4 ? 2 : 4 };
      return copy;
    });
    setActiveStreak(prev => (prev === 27 ? 28 : 27));
    triggerToast('Streak pattern updated 🔥');
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
    <div className="w-full min-h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between bg-gradient-to-b from-[#F3F8F5] via-[#FAFCFA] to-white dark:from-[#090D14] dark:via-[#0F1420] dark:to-[#090D14] text-slate-900 dark:text-white select-none">
      {/* Toast Alert */}
      {toastText && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-[#071A12]/95 dark:bg-white text-white dark:text-[#071A12] shadow-xl text-xs font-bold tracking-wide flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-emerald-600 animate-ping"></span>
          <span>{toastText}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-between px-4 py-3 sm:py-4 box-border">

        {/* ── 1. MODERN HERO SECTION WITH 4-STEP LOOP ── */}
        <section className="space-y-2 shrink-0">
          {/* Top Bar: Brand Logo & Live Pill */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-2">
              <img 
                src="/logo-black.svg" 
                alt="Definite" 
                className="h-6 sm:h-7 w-auto object-contain dark:hidden" 
              />
              <img 
                src="/logo-white.svg" 
                alt="Definite" 
                className="h-6 sm:h-7 w-auto object-contain hidden dark:block" 
              />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/85 dark:bg-slate-800/80 border border-emerald-600/20 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[8.5px] font-black tracking-wider uppercase text-emerald-800 dark:text-emerald-300">
                Pattern Core
              </span>
            </div>
          </div>

          {/* Headline & Subtitle */}
          <div>
            <h1 className="text-[19px] sm:text-[21px] font-black tracking-tight leading-tight text-slate-900 dark:text-white">
              A habit isn’t just a checkbox.
            </h1>
            <p className="text-xs sm:text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
              It’s a pattern of your future.
            </p>
          </div>

          {/* 4-Step Habit Loop Timeline (The Signature Visual) */}
          <div className="p-2 sm:p-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-2xs backdrop-blur-xs">
            <div className="flex items-center justify-between px-1">
              {/* 1. THOUGHT */}
              <div 
                className="flex flex-col items-center gap-1 group cursor-pointer" 
                onClick={() => triggerToast('Step 1: Every habit begins as a conscious thought')}
              >
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700 shadow-2xs text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:scale-105 transition-all">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18h6" />
                    <path d="M10 22h4" />
                    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                  </svg>
                </div>
                <span className="text-[8px] font-extrabold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Thought
                </span>
              </div>

              <div className="h-0.5 flex-1 mx-1.5 rounded-full bg-gradient-to-r from-slate-300 to-emerald-400 mb-4 opacity-70"></div>

              {/* 2. ACTION */}
              <div 
                className="flex flex-col items-center gap-1 group cursor-pointer" 
                onClick={() => triggerToast('Step 2: Micro-actions spark momentum')}
              >
                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-400/80 text-emerald-600 dark:text-emerald-400 shadow-2xs flex items-center justify-center group-hover:scale-105 transition-all">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 2L4.09 12.63a1 1 0 0 0 .77 1.64H11v7.73l8.91-10.63a1 1 0 0 0-.77-1.64H13V2z" />
                  </svg>
                </div>
                <span className="text-[8px] font-extrabold tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
                  Action
                </span>
              </div>

              <div className="h-0.5 flex-1 mx-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 mb-4 opacity-80"></div>

              {/* 3. HABIT */}
              <div 
                className="flex flex-col items-center gap-1 group cursor-pointer" 
                onClick={() => triggerToast('Step 3: Repetition compounds into automatic habit')}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 border border-emerald-400 text-white shadow-xs flex items-center justify-center group-hover:scale-105 transition-all">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="6" y1="20" x2="6" y2="14" />
                    <line x1="12" y1="20" x2="12" y2="10" />
                    <line x1="18" y1="20" x2="18" y2="4" />
                  </svg>
                </div>
                <span className="text-[8px] font-extrabold tracking-wider uppercase text-emerald-800 dark:text-emerald-300">
                  Habit
                </span>
              </div>

              <div className="h-0.5 flex-1 mx-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-amber-500 mb-4 opacity-80"></div>

              {/* 4. FUTURE */}
              <div 
                className="flex flex-col items-center gap-1 group cursor-pointer" 
                onClick={() => triggerToast('Step 4: Habits shape your inevitable future')}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-50 to-amber-100/90 dark:bg-amber-950/60 border border-amber-400/90 text-amber-600 dark:text-amber-400 shadow-2xs flex items-center justify-center group-hover:scale-105 transition-all">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="5" />
                    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                  </svg>
                </div>
                <span className="text-[8px] font-extrabold tracking-wider uppercase text-amber-700 dark:text-amber-300">
                  Future
                </span>
              </div>
            </div>

            {/* Micro Consistency Heatmap Bar */}
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🔥</span>
                <span className="text-[10.5px] font-black text-amber-700 dark:text-amber-400">
                  {activeStreak} Days Streak
                </span>
              </div>

              {/* 7 Interactive Day Cells */}
              <div className="flex items-center gap-1">
                {patternDays.map((d, i) => (
                  <div
                    key={i}
                    onClick={() => handleDayToggle(i)}
                    className={`w-3.5 h-3.5 rounded-xs transition-all cursor-pointer ${
                      d.active === 4 
                        ? 'bg-emerald-500 shadow-2xs' 
                        : d.active === 3 
                        ? 'bg-emerald-400' 
                        : d.active === 2 
                        ? 'bg-emerald-200 dark:bg-emerald-900/60' 
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                    title={`${d.day}: Tap to toggle cell`}
                  />
                ))}
              </div>

              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                76% Today
              </span>
            </div>
          </div>
        </section>

        {/* ── 2. AUTHENTICATION FORM SECTION ── */}
        <section className="space-y-2 my-auto py-1">
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
            className="w-full h-10 sm:h-10.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/70 font-bold text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.99]"
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
            <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">or with email</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-1.5">
            {/* Optional First / Last Name in Create Account mode */}
            {isSignUp && (
              <div className="grid grid-cols-2 gap-1.5 animate-in fade-in duration-150">
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full h-9.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full h-9.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
              </div>
            )}

            {/* Email */}
            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-9.5 sm:h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-xs sm:text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
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
                className="w-full h-9.5 sm:h-10 px-3 pr-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-xs sm:text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-full w-9 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeSlash size={15} weight="bold" /> : <Eye size={15} weight="bold" />}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-xl bg-gradient-to-r from-[#071A12] via-[#0D3021] to-[#071A12] dark:from-white dark:to-slate-100 hover:opacity-95 text-white dark:text-slate-950 font-bold text-xs sm:text-[13px] shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              <span>{loading ? 'Connecting...' : (isSignUp ? 'Create Account' : 'Continue with Email')}</span>
              <ArrowRight size={14} weight="bold" />
            </button>
          </form>

          {/* Explore Demo (Preserved Invariant 1) */}
          <button
            type="button"
            onClick={handleGuestMode}
            className="w-full h-8.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.99]"
          >
            <span>👁️</span>
            <span>Explore Demo (50 Days Preloaded)</span>
          </button>
        </section>

        {/* ── 3. FOOTER LINKS & WORKING REDIRECTION ── */}
        <footer className="text-center space-y-1 pt-1 shrink-0">
          {/* Mode Switcher */}
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            {isSignUp ? 'Already have an account?' : 'New to D1 Habit Tracker?'}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-emerald-600 dark:text-emerald-400 font-bold ml-1 hover:underline cursor-pointer"
            >
              {isSignUp ? 'Log in' : 'Create account'}
            </button>
          </p>

          {/* Working Redirections */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            <span>By continuing you agree to</span>
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
        </footer>

      </div>
    </div>
  );
}
