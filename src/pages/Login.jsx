import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGuest } from '../contexts/GuestContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../lib/firebase';

// Initial 5x7 consistency matrix (35 cells) with day levels 0..4
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

  // Redirect if user already logged in
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
    triggerToast('Entering Demo Mode (50 Days Preloaded)...');
    enterGuestMode();
    navigate('/');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setError('');
      setLoading(true);
      triggerToast(isSignUp ? 'Creating your habit engine...' : 'Signing into D1...');

      let userCred;
      if (isSignUp) {
        // Preferred signup path with auto-fallback to login if email already exists
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
        // Unified login path with auto-fallback to signup for first-time visitors
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

      // Ensure Firestore user document exists and profile is updated
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
        setError('Database Error: Browser closed connection. Please tap Google again.');
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
    <div className="login-root-wrapper">
      <style>{`
        .login-root-wrapper {
          width: 100vw;
          height: 100dvh;
          max-height: 100dvh;
          overflow: hidden;
          background: #E4ECE7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          user-select: none;
          color: #071A12;
        }

        @media (min-width: 481px) {
          .login-root-wrapper {
            background:
              radial-gradient(circle at 20% 15%, rgba(16, 185, 129, 0.14), transparent 38%),
              radial-gradient(circle at 80% 85%, rgba(245, 158, 11, 0.1), transparent 40%),
              linear-gradient(135deg, #DCE7E0 0%, #EDF3EF 50%, #DFEAE3 100%);
          }
        }

        .phone-frame {
          position: relative;
          width: 100vw;
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
            width: 396px;
            height: min(844px, 96dvh);
            max-height: 844px;
            border-radius: 44px;
            box-shadow:
              0 0 0 1px rgba(7, 26, 18, 0.08),
              0 0 0 8px #F7FAF8,
              0 0 0 9.5px rgba(7, 26, 18, 0.12),
              0 35px 80px -15px rgba(7, 26, 18, 0.28),
              0 12px 28px -6px rgba(16, 185, 129, 0.12);
          }
        }

        /* ── HERO SECTION ── */
        .hero-section {
          position: relative;
          flex: 0 0 43%;
          min-height: 250px;
          max-height: 350px;
          padding: max(14px, env(safe-area-inset-top, 14px)) 16px 10px 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          isolation: isolate;
          background:
            radial-gradient(circle at 86% 18%, rgba(16, 185, 129, 0.20), transparent 42%),
            radial-gradient(circle at 76% 85%, rgba(245, 158, 11, 0.16), transparent 45%),
            radial-gradient(circle at 12% 10%, rgba(255, 255, 255, 0.95), transparent 50%),
            linear-gradient(155deg, #F6FAF7 0%, #ECF5F0 52%, #E2F0E8 100%);
          border-bottom: 1px solid rgba(16, 185, 129, 0.16);
          box-sizing: border-box;
        }

        .hero-grid {
          position: absolute;
          inset: 0;
          z-index: -2;
          background-image:
            linear-gradient(to right, rgba(7, 26, 18, 0.038) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(7, 26, 18, 0.038) 1px, transparent 1px);
          background-size: 20px 20px;
          mask-image: radial-gradient(ellipse at 60% 45%, black 35%, transparent 88%);
          -webkit-mask-image: radial-gradient(ellipse at 60% 45%, black 35%, transparent 88%);
        }

        .orbital-core {
          position: absolute;
          right: -28px;
          bottom: -36px;
          width: 210px;
          height: 210px;
          z-index: 1;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .orbital-aura {
          position: absolute;
          inset: 18px;
          border-radius: 50%;
          background: conic-gradient(
            from 45deg,
            rgba(16, 185, 129, 0.28),
            rgba(245, 158, 11, 0.22),
            rgba(6, 182, 212, 0.18),
            rgba(16, 185, 129, 0.28)
          );
          filter: blur(22px);
          animation: pulseAura 5s ease-in-out infinite alternate;
        }

        .orbital-ring-outer {
          position: absolute;
          inset: 6px;
          border-radius: 50%;
          border: 1px solid rgba(16, 185, 129, 0.22);
          background: radial-gradient(circle, transparent 58%, rgba(255, 255, 255, 0.45) 100%);
          box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.9);
        }

        .orbital-ring-dashed {
          position: absolute;
          inset: 24px;
          border-radius: 50%;
          border: 1.5px dashed rgba(5, 150, 105, 0.32);
          animation: orbitSpin 28s linear infinite;
        }

        .orbital-ring-inner {
          position: absolute;
          inset: 44px;
          border-radius: 50%;
          border: 1px solid rgba(245, 158, 11, 0.35);
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.7), rgba(16, 185, 129, 0.08));
          backdrop-filter: blur(4px);
        }

        .sunlit-beam {
          position: absolute;
          width: 180px;
          height: 2px;
          right: 10px;
          bottom: 58px;
          background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.55), rgba(245, 158, 11, 0.7), transparent);
          transform: rotate(-28deg);
          filter: blur(0.5px);
          z-index: 1;
        }

        @keyframes orbitSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulseAura {
          0% { transform: scale(0.94); opacity: 0.75; }
          100% { transform: scale(1.06); opacity: 1; }
        }

        .editorial-title {
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
          font-size: 26px;
          font-weight: 800;
          line-height: 0.98;
          letter-spacing: -0.045em;
          color: #071A12;
        }

        .emerald-metallic {
          position: relative;
          display: inline-block;
          background: linear-gradient(135deg, #047857 0%, #10B981 52%, #0D9488 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          padding-bottom: 2px;
        }

        .emerald-metallic::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -2px;
          width: 100%;
          height: 2.5px;
          border-radius: 999px;
          background: linear-gradient(90deg, #10B981 0%, #34D399 60%, transparent 100%);
          box-shadow: 0 2px 10px rgba(16, 185, 129, 0.45);
        }

        .heatmap-glass-card {
          position: absolute;
          top: max(14px, env(safe-area-inset-top, 14px));
          right: 14px;
          width: 156px;
          padding: 10px 10px 8px;
          border-radius: 16px;
          background: linear-gradient(155deg, rgba(255, 255, 255, 0.88) 0%, rgba(244, 250, 246, 0.74) 100%);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.95);
          box-shadow:
            0 16px 30px -8px rgba(7, 26, 18, 0.13),
            0 4px 12px -2px rgba(16, 185, 129, 0.10),
            inset 0 1px 0 rgba(255, 255, 255, 1),
            0 0 0 1px rgba(16, 185, 129, 0.16);
          transform: perspective(650px) rotateY(-8deg) rotateX(4deg) rotateZ(1.2deg);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease;
          z-index: 15;
        }

        .hm-cell {
          aspect-ratio: 1;
          border-radius: 3px;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          cursor: pointer;
        }
        .hm-cell:hover {
          transform: scale(1.25);
          z-index: 5;
        }
        .hm-0 {
          background: rgba(7, 26, 18, 0.06);
          box-shadow: inset 0 1px 1px rgba(7, 26, 18, 0.04);
        }
        .hm-1 {
          background: #D1FAE5;
          border: 0.5px solid rgba(16, 185, 129, 0.2);
        }
        .hm-2 {
          background: #6EE7B7;
          border: 0.5px solid rgba(16, 185, 129, 0.35);
        }
        .hm-3 {
          background: #34D399;
          border: 0.5px solid rgba(5, 150, 105, 0.4);
        }
        .hm-4 {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.45);
        }

        .gauge-disc {
          position: absolute;
          right: 18px;
          bottom: 10px;
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 249, 244, 0.88) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow:
            0 14px 28px -4px rgba(7, 26, 18, 0.16),
            0 0 20px rgba(16, 185, 129, 0.22),
            inset 0 1.5px 0 rgba(255, 255, 255, 1),
            0 0 0 1px rgba(16, 185, 129, 0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 20;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .gauge-disc:hover {
          transform: scale(1.06) translateY(-2px);
        }

        .step-node {
          width: 27px;
          height: 27px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
          position: relative;
          z-index: 2;
        }

        .step-connector {
          width: 9px;
          height: 1.5px;
          border-radius: 2px;
          margin-bottom: 11px;
        }

        /* ── FORM SECTION ── */
        .form-section {
          flex: 1 1 auto;
          min-height: 0;
          padding: 10px 18px max(10px, env(safe-area-inset-bottom, 10px));
          background: #FFFFFF;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          z-index: 10;
          box-sizing: border-box;
        }

        .pearl-input {
          width: 100%;
          height: 38px;
          padding: 0 12px;
          border-radius: 11px;
          background: #F3F7F5;
          border: 1px solid #E2EBE6;
          color: #071A12;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          outline: none;
          box-sizing: border-box;
        }

        .pearl-input::placeholder {
          color: #82968C;
          font-weight: 400;
        }

        .pearl-input:focus {
          background: #FFFFFF;
          border-color: #10B981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.14), 0 2px 6px rgba(7, 26, 18, 0.04);
        }

        .cta-primary {
          position: relative;
          width: 100%;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #071A12 0%, #0E3323 55%, #072016 100%);
          color: #FFFFFF;
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.22),
            0 10px 20px -5px rgba(16, 185, 129, 0.34),
            0 4px 10px rgba(7, 26, 18, 0.22);
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          cursor: pointer;
          border: none;
        }

        .cta-primary:hover {
          transform: translateY(-1px);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.28),
            0 14px 24px -4px rgba(16, 185, 129, 0.42),
            0 6px 14px rgba(7, 26, 18, 0.26);
        }

        .cta-primary:active {
          transform: translateY(0.5px) scale(0.99);
        }

        /* ── ULTRA-COMPACT MEDIA QUERIES FOR SHORT SCREENS (e.g. iPhone SE / Safari URL Bars) ── */
        @media (max-height: 740px) {
          .hero-section {
            flex: 0 0 40%;
            min-height: 230px;
            padding: max(10px, env(safe-area-inset-top, 10px)) 14px 8px 16px;
          }
          .editorial-title {
            font-size: 23px;
          }
          .heatmap-glass-card {
            width: 142px;
            padding: 8px 8px 6px;
            top: max(8px, env(safe-area-inset-top, 8px));
            right: 10px;
          }
          .gauge-disc {
            width: 68px;
            height: 68px;
            right: 14px;
            bottom: 8px;
          }
          .pearl-input {
            height: 35px;
            font-size: 12.5px;
          }
          .cta-primary {
            height: 38px;
            font-size: 13px;
          }
          .form-section {
            padding: 8px 16px max(8px, env(safe-area-inset-bottom, 8px));
          }
        }

        @media (max-height: 650px) {
          .hero-section {
            flex: 0 0 38%;
            min-height: 200px;
            padding: 8px 12px 6px 14px;
          }
          .editorial-title {
            font-size: 20px;
            line-height: 1;
          }
          .heatmap-glass-card {
            width: 130px;
            padding: 6px;
            transform: perspective(650px) rotateY(-4deg) rotateX(2deg);
          }
          .gauge-disc {
            width: 60px;
            height: 60px;
            right: 10px;
            bottom: 6px;
          }
          .step-node {
            width: 22px;
            height: 22px;
          }
          .step-node svg {
            width: 11px;
            height: 11px;
          }
          .pearl-input {
            height: 33px;
          }
          .cta-primary {
            height: 36px;
          }
          .form-section {
            padding: 6px 14px max(6px, env(safe-area-inset-bottom, 6px));
          }
        }
      `}</style>

      <main className="phone-frame">
        {/* Subtle In-Frame Interactive Toast Notification */}
        <div 
          className={`pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 transition-all duration-300 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#071A12]/95 text-white shadow-xl border border-emerald-400/30 backdrop-blur-md ${
            toastActive ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-[10.5px] font-semibold tracking-wide whitespace-nowrap">{toastText}</span>
        </div>

        {/* ── TOP HERO SECTION ── */}
        <section className="hero-section">
          {/* Precision Micro-Grid */}
          <div className="hero-grid"></div>

          {/* Sunlit Orbital Prism / Momentum Core */}
          <div className="sunlit-beam"></div>
          <div className="orbital-core" aria-hidden="true">
            <div className="orbital-aura"></div>
            <div className="orbital-ring-outer"></div>
            <div className="orbital-ring-dashed"></div>
            <div className="orbital-ring-inner"></div>
          </div>

          {/* LEFT COLUMN: Brand Logo + Eyebrow + Headline + Subcopy */}
          <div className="relative z-20 max-w-[58%]">
            {/* Definite Brand Logo & Live Pill */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <img 
                src="/logo-black.svg" 
                alt="Definite" 
                className="h-5 sm:h-6 w-auto object-contain shrink-0" 
              />
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 border border-emerald-600/20 shadow-xs">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-[7.5px] font-black tracking-[0.12em] uppercase text-[#0F3826]">
                  Pattern Core
                </span>
              </div>
            </div>

            {/* Editorial Headline */}
            <h1 className="editorial-title">
              A habit<br />
              isn’t just a<br />
              <span className="emerald-metallic">checkbox.</span>
            </h1>

            {/* Subcopy */}
            <p className="mt-1 text-[11px] sm:text-[12px] leading-snug text-[#465E52] font-medium">
              It’s a pattern of <strong className="text-[#071A12] font-bold">your future.</strong>
            </p>
          </div>

          {/* BOTTOM-LEFT: 4-Step Connected Icon Timeline */}
          <div className="relative z-20 flex items-center mt-auto pt-1 max-w-[65%]">
            {/* 1. THOUGHT */}
            <div 
              className="flex flex-col items-center gap-0.5 group cursor-pointer" 
              onClick={() => triggerToast('Step 1: Every habit begins as a single thought')}
            >
              <div className="step-node bg-white/85 border border-slate-300/80 shadow-xs text-slate-600 group-hover:border-emerald-500 group-hover:text-emerald-700">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                </svg>
              </div>
              <span className="text-[7px] font-bold tracking-[0.09em] uppercase text-[#5A7065]">Thought</span>
            </div>

            <div className="step-connector bg-gradient-to-r from-slate-300 to-emerald-400"></div>

            {/* 2. ACTION */}
            <div 
              className="flex flex-col items-center gap-0.5 group cursor-pointer" 
              onClick={() => triggerToast('Step 2: Spark daily micro-actions')}
            >
              <div className="step-node bg-emerald-50/95 border border-emerald-400/70 shadow-xs text-emerald-600 group-hover:scale-105">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 2L4.09 12.63a1 1 0 0 0 .77 1.64H11v7.73l8.91-10.63a1 1 0 0 0-.77-1.64H13V2z" />
                </svg>
              </div>
              <span className="text-[7px] font-bold tracking-[0.09em] uppercase text-emerald-700">Action</span>
            </div>

            <div className="step-connector bg-gradient-to-r from-emerald-400 to-emerald-600"></div>

            {/* 3. HABIT */}
            <div 
              className="flex flex-col items-center gap-0.5 group cursor-pointer" 
              onClick={() => triggerToast('Step 3: Compound into automatic habits')}
            >
              <div className="step-node bg-gradient-to-br from-emerald-500 to-emerald-600 border border-emerald-400 shadow-xs text-white group-hover:scale-105">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="6" y1="20" x2="6" y2="14" />
                  <line x1="12" y1="20" x2="12" y2="10" />
                  <line x1="18" y1="20" x2="18" y2="4" />
                </svg>
              </div>
              <span className="text-[7px] font-extrabold tracking-[0.09em] uppercase text-emerald-800">Habit</span>
            </div>

            <div className="step-connector bg-gradient-to-r from-emerald-600 to-amber-500"></div>

            {/* 4. FUTURE */}
            <div 
              className="flex flex-col items-center gap-0.5 group cursor-pointer" 
              onClick={() => triggerToast('Step 4: Design your inevitable future')}
            >
              <div className="step-node bg-gradient-to-br from-amber-50 to-amber-100/90 border border-amber-400/90 shadow-xs text-amber-600 group-hover:scale-105">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <span className="text-[7px] font-extrabold tracking-[0.09em] uppercase text-amber-700">Future</span>
            </div>
          </div>

          {/* RIGHT COLUMN: 3D Floating Frosted Heatmap Card */}
          <div className="heatmap-glass-card">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[7.5px] font-extrabold tracking-[0.14em] uppercase text-[#4B6358]">
                Consistency
              </span>
              <div className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/35">
                <span className="text-[8.5px] leading-none">🔥</span>
                <span className="text-[7.5px] font-black text-[#78350F] tracking-tight">27 days</span>
              </div>
            </div>

            {/* 7-Day Header */}
            <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[7px] font-bold text-[#6C8277]">
              <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span className="text-emerald-700">S</span><span>S</span>
            </div>

            {/* 5x7 Habit Matrix (35 Rounded Cells) */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((lvl, i) => (
                <div
                  key={i}
                  onClick={() => handleCellClick(i)}
                  className={`hm-cell hm-${lvl}`}
                  title="Click to toggle streak cell"
                />
              ))}
            </div>
          </div>

          {/* Overlapping Circular Progress Gauge Ring */}
          <div 
            className="gauge-disc" 
            onClick={cycleProgress} 
            title="Tap to preview daily momentum"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 p-1">
              <defs>
                <linearGradient id="dayEmeraldArc" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="55%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
                <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="2.2" floodColor="#10B981" floodOpacity="0.45" />
                </filter>
              </defs>
              <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(7, 26, 18, 0.06)" strokeWidth="1" strokeDasharray="2 3" />
              <circle cx="50" cy="50" r="41" fill="none" stroke="rgba(7, 26, 18, 0.08)" strokeWidth="7.5" />
              <circle
                cx="50"
                cy="50"
                r="41"
                fill="none"
                stroke="url(#dayEmeraldArc)"
                strokeWidth="7.5"
                strokeLinecap="round"
                strokeDasharray="257.6"
                strokeDashoffset={strokeOffset}
                filter="url(#emeraldGlow)"
                style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[14px] font-black text-[#071A12] tracking-tight leading-none">
                {currentPercent}%
              </span>
              <span className="text-[6px] font-extrabold tracking-[0.16em] text-emerald-700 mt-0.5 uppercase">
                Today
              </span>
            </div>
          </div>
        </section>

        {/* ── BOTTOM FORM SECTION (ZERO-SCROLL GUARANTEE) ── */}
        <section className="form-section">
          {/* Error Message Toast / Banner */}
          {error && (
            <div className="py-1 px-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] font-medium text-center flex items-center justify-center gap-1.5 mb-1 animate-in fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
              <span className="truncate">{error}</span>
            </div>
          )}

          {/* 1. Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-[38px] rounded-xl bg-white hover:bg-[#F8FBF9] active:scale-[0.99] border border-[#DCE5E0] shadow-[0_2px_6px_rgba(7,26,18,0.04),inset_0_1px_0_#FFF] flex items-center justify-center gap-2 text-[13px] font-semibold text-[#12241B] transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* 2. Compact Divider */}
          <div className="flex items-center gap-2.5 my-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E2EAE5] to-[#E2EAE5]"></div>
            <span className="text-[10px] font-semibold text-[#85988E] lowercase tracking-wider">or</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#E2EAE5] to-[#E2EAE5]"></div>
          </div>

          {/* 3. Unified Form Inputs */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
            {/* Optional First / Last Name in Sign Up mode */}
            {isSignUp && (
              <div className="grid grid-cols-2 gap-1.5 animate-in fade-in duration-150">
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="pearl-input"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="pearl-input"
                />
              </div>
            )}

            {/* Email Input */}
            <div className="relative">
              <input
                type="email"
                placeholder="Email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={100}
                className="pearl-input pr-9"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#889B91]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <rect width="20" height="16" x="2" y="4" rx="3" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
            </div>

            {/* Password Input with Show/Hide Toggle */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                required
                minLength={6}
                maxLength={100}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pearl-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
                className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-[#6E8278] hover:text-[#071A12] border-l border-[#E2EBE6] transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Primary CTA Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="cta-primary mt-0.5 group"
            >
              <span>{loading ? 'Connecting...' : (isSignUp ? 'Create account' : 'Continue with Email')}</span>
              <svg className="w-3.5 h-3.5 text-emerald-400 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </button>
          </form>

          {/* 4. Explore Demo Button (Preserved Invariant 1) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleGuestMode}
              className="w-full h-[34px] rounded-xl border border-dashed border-emerald-600/40 bg-emerald-50/70 hover:bg-emerald-100/80 active:scale-[0.99] text-[#071A12] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <span className="text-emerald-600 text-sm">👁</span>
              <span>Explore Demo — No Sign-up Needed</span>
            </button>
            <p className="text-center text-[9px] text-[#73867C] mt-0.5 font-medium">
              50 days of sample data · Full habit analytics preview
            </p>
          </div>

          {/* 5. Ultra-Compact Legal & Mode Switcher Footer */}
          <div className="text-center space-y-1 pt-0.5">
            <p className="text-[11.5px] text-[#2B3E34] font-medium">
              {isSignUp ? 'Have an account?' : 'New to D1 Habit Tracker?'}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-[#071A12] font-bold underline underline-offset-3 decoration-emerald-500/70 hover:text-emerald-700 ml-1 cursor-pointer"
              >
                {isSignUp ? 'Log in here' : 'Create account'}
              </button>
            </p>

            <p className="text-[9.5px] leading-tight text-[#85988E]">
              By continuing you agree to D1’s{' '}
              <Link to="/privacy" className="text-[#071A12] underline decoration-slate-300 hover:text-emerald-700">Privacy</Link>
              {' '}&{' '}
              <Link to="/terms" className="text-[#071A12] underline decoration-slate-300 hover:text-emerald-700">Terms</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
