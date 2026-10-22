import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGuest } from '../contexts/GuestContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../lib/firebase';

const INITIAL_CELLS = [
  0, 1, 2, 3, 2, 4, 3,
  1, 2, 3, 4, 4, 3, 4,
  2, 3, 4, 3, 4, 4, 4,
  1, 3, 2, 4, 4, 4, 3,
  2, 4, 3, 4, 4, 4, 4
];

const SAMPLE_PERCENTS = [76, 88, 94, 100];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Interactive UI state
  const [toastText, setToastText] = useState('');
  const [toastActive, setToastActive] = useState(false);
  const toastTimeoutRef = useRef(null);

  const [gaugeIdx, setGaugeIdx] = useState(0);
  const [cells, setCells] = useState(INITIAL_CELLS);

  const { currentUser, login, signup, loginWithGoogle } = useAuth();
  const { enterGuestMode, exitGuestMode } = useGuest();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  function triggerToast(message) {
    setToastText(message);
    setToastActive(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastActive(false);
    }, 2400);
  }

  function cycleProgress() {
    if (navigator?.vibrate) navigator.vibrate(15);
    const nextIdx = (gaugeIdx + 1) % SAMPLE_PERCENTS.length;
    setGaugeIdx(nextIdx);
    triggerToast(`Daily Momentum: ${SAMPLE_PERCENTS[nextIdx]}% completed`);
  }

  function handleCellClick(index) {
    if (navigator?.vibrate) navigator.vibrate(10);
    setCells(prev => {
      const copy = [...prev];
      copy[index] = copy[index] === 4 ? 1 : 4;
      return copy;
    });
    triggerToast('Habit streak cell updated 🔥');
  }

  function handleGuestMode() {
    if (navigator?.vibrate) navigator.vibrate(25);
    triggerToast('Opening Demo Mode (50 Days Preloaded)...');
    enterGuestMode();
    navigate('/');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setError('');
      setLoading(true);
      triggerToast(isSignUp ? 'Creating your account...' : 'Signing into D1...');

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
      triggerToast('Authentication error');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setError('');
      setLoading(true);
      triggerToast('Connecting to Google...');
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
      triggerToast('Google Sign-in failed');
    } finally {
      setLoading(false);
    }
  }

  const currentPercent = SAMPLE_PERCENTS[gaugeIdx];
  const circumference = 257.6;
  const strokeOffset = circumference - (currentPercent / 100) * circumference;

  return (
    <div className="login-stage-wrapper">
      <style>{`
        :root {
          --ink: #071A12;
          --ink-muted: #52665C;
          --emerald-core: #10B981;
          --emerald-deep: #059669;
          --gold-warm: #F59E0B;
        }

        .login-stage-wrapper {
          width: 100vw;
          height: 100dvh;
          min-height: 100dvh;
          max-height: 100dvh;
          overflow-y: auto;
          overflow-x: hidden;
          background: #0E1612;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          user-select: none;
          color: var(--ink);
          box-sizing: border-box;
        }

        @media (min-width: 481px) {
          .login-stage-wrapper {
            background:
              radial-gradient(circle at 50% 25%, rgba(16, 185, 129, 0.16), transparent 55%),
              radial-gradient(circle at 80% 85%, rgba(245, 158, 11, 0.08), transparent 45%),
              linear-gradient(145deg, #09120E 0%, #111D17 50%, #0A130F 100%);
            padding: 16px;
          }
        }

        /* ── Centered Phone Shell: 100dvh on mobile, Titanium bezel on desktop ── */
        .phone-frame {
          position: relative;
          width: 100%;
          max-width: 390px;
          height: 100dvh;
          max-height: 100dvh;
          background: #FFFFFF;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          box-sizing: border-box;
        }

        @media (min-width: 481px) {
          .phone-frame {
            height: min(840px, 96dvh);
            max-height: 840px;
            border-radius: 40px;
            box-shadow:
              0 0 0 1px rgba(255, 255, 255, 0.1),
              0 0 0 8px #1A2620,
              0 0 0 9.5px rgba(255, 255, 255, 0.15),
              0 30px 70px -15px rgba(0, 0, 0, 0.65),
              0 10px 28px -6px rgba(16, 185, 129, 0.2);
          }
        }

        /* ── Top Hero Canvas (~44% height) ── */
        .hero-section {
          position: relative;
          flex: 0 0 auto;
          height: clamp(280px, 42vh, 325px);
          padding: 16px 16px 10px 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          isolation: isolate;
          background:
            radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.22), transparent 44%),
            radial-gradient(circle at 75% 85%, rgba(245, 158, 11, 0.15), transparent 42%),
            radial-gradient(circle at 10% 10%, rgba(255, 255, 255, 0.95), transparent 48%),
            linear-gradient(160deg, #F3F9F5 0%, #E8F4ED 50%, #DAEDE1 100%);
          border-bottom: 1px solid rgba(16, 185, 129, 0.15);
          box-sizing: border-box;
        }

        .hero-grid {
          position: absolute;
          inset: 0;
          z-index: -2;
          background-image:
            linear-gradient(to right, rgba(7, 26, 18, 0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(7, 26, 18, 0.035) 1px, transparent 1px);
          background-size: 18px 18px;
          mask-image: radial-gradient(ellipse at 60% 45%, black 35%, transparent 88%);
          -webkit-mask-image: radial-gradient(ellipse at 60% 45%, black 35%, transparent 88%);
        }

        /* Background flowing momentum path */
        .hero-wave-curve {
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          opacity: 0.75;
        }

        /* Editorial Typography */
        .editorial-title {
          font-family: -apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Inter', sans-serif;
          font-size: 27px;
          font-weight: 800;
          line-height: 1.0;
          letter-spacing: -0.04em;
          color: #0A1E14;
        }

        /* Flat, Crisp Frosted Consistency Card (Upright, not rotated) */
        .consistency-glass-card {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 154px;
          padding: 9px 10px 8px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.95);
          box-shadow:
            0 12px 28px -6px rgba(7, 26, 18, 0.10),
            0 2px 8px rgba(16, 185, 129, 0.08),
            inset 0 1px 0 #FFFFFF;
          z-index: 15;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .consistency-glass-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 32px -6px rgba(7, 26, 18, 0.14);
        }

        /* Heatmap cell */
        .hm-cell {
          aspect-ratio: 1;
          border-radius: 3px;
          transition: transform 0.15s ease;
          cursor: pointer;
        }
        .hm-cell:hover {
          transform: scale(1.25);
          z-index: 5;
        }
        .hm-0 { background: #E6ECE8; }
        .hm-1 { background: #C8E8D9; }
        .hm-2 { background: #71D4A6; }
        .hm-3 { background: #22B577; }
        .hm-4 { background: #0B7345; }

        /* Progress ring dial */
        .gauge-disc {
          position: absolute;
          right: 18px;
          bottom: 10px;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.95);
          box-shadow:
            0 14px 28px -6px rgba(7, 26, 18, 0.12),
            0 2px 8px rgba(16, 185, 129, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 20;
          transition: transform 0.2s ease;
          cursor: pointer;
        }

        .gauge-disc:hover {
          transform: scale(1.05);
        }

        .step-node {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
          position: relative;
          z-index: 2;
        }
        .step-node:hover {
          transform: scale(1.08);
        }

        .step-connector {
          width: 10px;
          height: 1.5px;
          border-radius: 1px;
          margin-bottom: 12px;
        }

        /* ── Bottom Form Section: Middle-Centered, No Dead Space ── */
        .form-section {
          flex: 1 1 auto;
          background: #FFFFFF;
          border-top-left-radius: 34px;
          border-top-right-radius: 34px;
          margin-top: -16px;
          padding: 12px 18px 12px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 7px;
          z-index: 30;
          box-shadow: 0 -8px 24px -6px rgba(7, 26, 18, 0.06);
          box-sizing: border-box;
        }

        .pearl-input {
          width: 100%;
          height: 39px;
          padding-left: 36px;
          padding-right: 12px;
          border-radius: 14px;
          background: #F4F7F5;
          border: 1px solid #DFE7E2;
          color: #071A12;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          outline: none;
          box-sizing: border-box;
        }

        .pearl-input::placeholder {
          color: #83978E;
          font-weight: 400;
        }

        .pearl-input:focus {
          background: #FFFFFF;
          border-color: #10B981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }

        .cta-primary {
          width: 100%;
          height: 41px;
          border-radius: 14px;
          background: linear-gradient(135deg, #072217 0%, #0D3524 60%, #072217 100%);
          color: #FFFFFF;
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 8px 18px -4px rgba(7, 34, 23, 0.32);
          transition: all 0.2s ease;
          cursor: pointer;
          border: none;
        }

        .cta-primary:hover {
          transform: translateY(-0.5px);
          box-shadow: 0 10px 22px -4px rgba(7, 34, 23, 0.38);
        }

        .cta-primary:active {
          transform: translateY(0.5px) scale(0.99);
        }

        /* Extra compact for shorter screen heights (e.g. iPhone SE 667px) */
        @media (max-height: 700px) {
          .hero-section {
            height: 255px;
            padding: 10px 14px 6px 16px;
          }
          .editorial-title {
            font-size: 22px;
          }
          .consistency-glass-card {
            width: 142px;
            padding: 7px 8px 6px;
            top: 10px;
            right: 10px;
          }
          .gauge-disc {
            width: 68px;
            height: 68px;
            bottom: 6px;
            right: 12px;
          }
          .form-section {
            padding: 8px 14px 10px;
            gap: 6px;
          }
          .pearl-input {
            height: 36px;
            font-size: 12.5px;
          }
          .cta-primary {
            height: 38px;
            font-size: 13px;
          }
        }
      `}</style>

      {/* Main Centered Phone Shell */}
      <main className="phone-frame">
        {/* Subtle In-Frame Interactive Toast Notification */}
        <div 
          className={`pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 transition-all duration-300 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#071A12]/95 text-white shadow-xl border border-emerald-400/30 backdrop-blur-md ${
            toastActive ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-[11px] font-semibold tracking-wide whitespace-nowrap">{toastText}</span>
        </div>

        {/* ========================================================
             TOP HERO SECTION
             ======================================================== */}
        <section className="hero-section">
          <div className="hero-grid"></div>

          {/* Background flowing wave curve */}
          <svg className="hero-wave-curve" viewBox="0 0 390 300" fill="none" preserveAspectRatio="none">
            <path
              d="M-20 220 C 80 240, 140 180, 240 210 C 290 225, 330 200, 410 160"
              stroke="#A8DCC2"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <circle cx="365" cy="170" r="4.5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
          </svg>

          {/* TOP-LEFT: Eyebrow + Headline + Subcopy */}
          <div className="relative z-20 max-w-[55%]">
            {/* Pill Eyebrow Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/90 border border-emerald-600/25 shadow-xs mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_#10B981]"></span>
              </span>
              <span className="text-[8px] font-extrabold tracking-[0.12em] uppercase text-[#0B3522]">
                Understand the pattern
              </span>
              <span className="text-emerald-700 font-bold text-[9px] leading-none">→</span>
            </div>

            {/* Editorial Headline with Brush Underline under "checkbox." */}
            <h1 className="editorial-title">
              A habit<br />
              isn’t just a<br />
              <span className="relative inline-block text-[#065F46]">
                checkbox.
                <svg className="absolute -bottom-1 left-0 w-full h-2.5 text-[#10B981]" viewBox="0 0 130 10" fill="none">
                  <path d="M2 6C32 2 95 2 128 5C100 8 48 8 16 9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            {/* Subcopy */}
            <p className="mt-2 text-[11px] leading-tight text-[#455D51] font-medium">
              It’s a pattern of <strong className="text-[#071A12] font-extrabold">your future.</strong>
            </p>
          </div>

          {/* BOTTOM-LEFT: 4-Step Connected Sequence Timeline */}
          <div className="relative z-20 flex items-center mt-auto pt-2 max-w-[68%]">
            {/* 1. THOUGHT */}
            <div 
              className="flex flex-col items-center gap-1 group cursor-pointer" 
              onClick={() => triggerToast('Step 1: Every habit begins as a single thought')}
            >
              <div className="step-node bg-white/90 border border-slate-300 text-slate-600 shadow-2xs group-hover:border-emerald-500 group-hover:text-emerald-700">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                </svg>
              </div>
              <span className="text-[7px] font-bold tracking-[0.1em] uppercase text-[#566B60]">Thought</span>
            </div>

            <div className="step-connector bg-gradient-to-r from-slate-300 to-emerald-400"></div>

            {/* 2. ACTION */}
            <div 
              className="flex flex-col items-center gap-1 group cursor-pointer" 
              onClick={() => triggerToast('Step 2: Spark daily micro-actions')}
            >
              <div className="step-node bg-emerald-100 border border-emerald-400/80 text-emerald-600 shadow-xs">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 2L4.09 12.63a1 1 0 0 0 .77 1.64H11v7.73l8.91-10.63a1 1 0 0 0-.77-1.64H13V2z" />
                </svg>
              </div>
              <span className="text-[7px] font-bold tracking-[0.1em] uppercase text-emerald-700">Action</span>
            </div>

            <div className="step-connector bg-gradient-to-r from-emerald-400 to-emerald-600"></div>

            {/* 3. HABIT */}
            <div 
              className="flex flex-col items-center gap-1 group cursor-pointer" 
              onClick={() => triggerToast('Step 3: Compound into automatic habits')}
            >
              <div className="step-node bg-emerald-600 text-white shadow-xs">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="6" y1="20" x2="6" y2="14" />
                  <line x1="12" y1="20" x2="12" y2="10" />
                  <line x1="18" y1="20" x2="18" y2="4" />
                </svg>
              </div>
              <span className="text-[7px] font-extrabold tracking-[0.1em] uppercase text-emerald-800">Habit</span>
            </div>

            <div className="step-connector bg-gradient-to-r from-emerald-600 to-amber-400"></div>

            {/* 4. FUTURE */}
            <div 
              className="flex flex-col items-center gap-1 group cursor-pointer" 
              onClick={() => triggerToast('Step 4: Design your inevitable future')}
            >
              <div className="step-node bg-amber-100 border border-amber-400/90 text-amber-600 shadow-xs">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <span className="text-[7px] font-extrabold tracking-[0.1em] uppercase text-amber-700">Future</span>
            </div>
          </div>

          {/* TOP-RIGHT: Upright Flat Frosted Heatmap Card */}
          <div className="consistency-glass-card">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[8px] font-extrabold tracking-[0.12em] uppercase text-[#0B2519]">
                Consistency
              </span>
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
                <span className="text-[9px] leading-none">🔥</span>
                <span className="text-[8px] font-extrabold text-[#78350F] tracking-tight">27 days</span>
              </div>
            </div>

            {/* 7-Day Weekday Header */}
            <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[7.5px] font-bold text-[#677F73]">
              <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span className="text-emerald-700">S</span><span>S</span>
            </div>

            {/* 5x7 Habit Matrix (35 Rounded Cells) */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((lvl, i) => (
                <div
                  key={i}
                  onClick={() => handleCellClick(i)}
                  className={`hm-cell hm-${lvl}`}
                />
              ))}
            </div>
          </div>

          {/* BOTTOM-RIGHT: Circular Progress Gauge Ring (76% TODAY) */}
          <div className="gauge-disc" onClick={cycleProgress} title="Tap to preview daily momentum">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 p-1">
              <defs>
                <linearGradient id="dialEmeraldArc" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="50%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="41" fill="none" stroke="rgba(7, 26, 18, 0.08)" strokeWidth="7.5" />
              <circle
                cx="50"
                cy="50"
                r="41"
                fill="none"
                stroke="url(#dialEmeraldArc)"
                strokeWidth="7.5"
                strokeLinecap="round"
                strokeDasharray="257.6"
                strokeDashoffset={strokeOffset}
                style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[15px] font-black text-[#071A12] tracking-tight leading-none">{currentPercent}%</span>
              <span className="text-[6.5px] font-extrabold tracking-[0.16em] text-emerald-700 mt-0.5 uppercase">Today</span>
            </div>
          </div>

          {/* Overlapping Dark Badge: Small steps. Big results. */}
          <div 
            onClick={cycleProgress}
            className="absolute bottom-2.5 right-2 z-25 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0A1D15] text-white shadow-lg border border-emerald-500/20 cursor-pointer hover:bg-[#071A12] transition-colors"
          >
            <svg className="w-3 h-3 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="12" width="4" height="8" rx="1" />
              <rect x="10" y="8" width="4" height="12" rx="1" />
              <rect x="17" y="4" width="4" height="16" rx="1" />
            </svg>
            <div className="flex flex-col text-left">
              <span className="text-[7.5px] font-bold leading-none text-slate-100">Small steps.</span>
              <span className="text-[7.5px] font-semibold leading-none text-emerald-400 mt-0.5">Big results.</span>
            </div>
          </div>
        </section>

        {/* ========================================================
             BOTTOM FORM SECTION (MIDDLE-CENTERED, NO DEAD SPACE)
             ======================================================== */}
        <section className="form-section">
          {/* Centered D1 Brand Logo */}
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-2">
              <img 
                src="/clean_d_only.svg" 
                alt="D1" 
                className="h-7 w-auto object-contain" 
              />
              <span className="text-2xl font-black text-slate-900 tracking-tight font-sans">D1</span>
            </div>
            <span className="text-[8px] tracking-[0.28em] font-extrabold text-slate-400 uppercase mt-0.5">
              HABIT TRACKER
            </span>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="py-1 px-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center animate-in fade-in">
              {error}
            </div>
          )}

          {/* 1. Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-[40px] rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.99] border border-slate-200/90 shadow-[0_2px_6px_rgba(7,26,18,0.04)] flex items-center justify-center gap-2.5 text-[13.5px] font-semibold text-slate-800 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* 2. Crisp OR Divider */}
          <div className="flex items-center gap-2.5 my-0.5">
            <div className="h-px flex-1 bg-slate-200"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">or</span>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>

          {/* 3. Form Inputs */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
            {isSignUp && (
              <div className="grid grid-cols-2 gap-1.5 animate-in fade-in duration-150">
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="pearl-input !pl-3"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="pearl-input !pl-3"
                />
              </div>
            )}

            {/* Email Input with Envelope on LEFT */}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect width="20" height="16" x="2" y="4" rx="3" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
              <input
                type="email"
                placeholder="Email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={100}
                className="pearl-input"
              />
            </div>

            {/* Password Input with Lock on LEFT and Eye on RIGHT */}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                required
                minLength={6}
                maxLength={100}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pearl-input !pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Primary CTA Button */}
            <button type="submit" disabled={loading} className="cta-primary mt-0.5 group">
              <span>{loading ? 'Connecting...' : (isSignUp ? 'Create account' : 'Continue with Email')}</span>
              <svg className="w-4 h-4 text-emerald-400 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </button>
          </form>

          {/* Explore Demo CTA Button */}
          <button
            type="button"
            onClick={handleGuestMode}
            className="w-full h-[36px] rounded-2xl bg-[#EAF5EF] hover:bg-[#DDF0E4] active:scale-[0.99] text-[#0A3D27] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-300/40"
          >
            <span className="text-emerald-600 text-sm">🌿</span>
            <span>Explore Demo — No Sign-up Needed</span>
            <span className="text-emerald-700 text-xs">→</span>
          </button>

          {/* 4. Compact Footer with Working Policy & Terms Redirections */}
          <div className="text-center space-y-0.5 pt-0.5">
            <p className="text-[11.5px] text-[#2B3E34] font-medium">
              {isSignUp ? 'Have an account?' : 'New to D1?'}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-emerald-700 font-bold hover:underline ml-1 cursor-pointer"
              >
                {isSignUp ? 'Log in' : 'Create account'}
              </button>
            </p>

            <p className="text-[9.5px] leading-tight text-slate-500 max-w-[320px] mx-auto">
              By continuing, you agree to our{' '}
              <button
                type="button"
                onClick={() => navigate('/privacy')}
                className="text-slate-800 font-semibold underline hover:text-emerald-700 cursor-pointer"
              >
                Privacy Policy
              </button>
              {' '}and{' '}
              <button
                type="button"
                onClick={() => navigate('/terms')}
                className="text-slate-800 font-semibold underline hover:text-emerald-700 cursor-pointer"
              >
                Terms of Service
              </button>.
            </p>
          </div>

        </section>
      </main>
    </div>
  );
}
