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

// Official D1 Emblem SVG matching the user mockup exactly
function D1Logo() {
  return (
    <div className="flex items-center justify-center gap-1.5 select-none">
      {/* The D Mark with inner red accent */}
      <svg className="h-[38px] w-auto" viewBox="344 280 480 472" fill="none">
        <path
          d="M576.58 748.5C575.72 740.59 576.37 732.45 576.33 724.5C576.22 705.83 576.36 687.17 576.32 668.5C576.3 660.48 574.77 640.04 577.5 633.66C585.64 632.22 593.91 632.36 602.04 630.51C617.59 626.97 632.6 619.5 645.03 609.52C663.34 594.82 678.69 574.92 685.67 552.26C699.91 506.05 684.47 458.29 648.42 427.07C610.99 394.66 569.45 399.95 523.5 399.93C510.5 399.93 497.5 399.93 484.5 399.92C477.09 399.92 469.36 399.3 462.06 400.5C462.06 438.78 462.06 477.05 462.06 515.33C453.93 516.84 444.79 515.8 436.5 515.83C419.5 515.89 402.5 515.92 385.5 515.92C377.08 515.91 357.51 517.51 350.5 515.1C349.71 508.67 350.17 501.99 350.16 495.5C350.15 483.17 350.15 470.83 350.15 458.5C350.18 422.83 350.17 387.17 350.17 351.5C350.17 336.5 350.15 321.5 350.18 306.5C350.19 300.43 348.68 291.93 351.31 286.5C356.61 285.66 362.14 286.06 367.5 286.08C376.5 286.12 385.5 286.15 394.5 286.17C423.5 286.24 452.5 286.23 481.5 286.29C506.5 286.34 531.5 286.35 556.5 286.31C576.43 286.28 596.72 285.8 616.42 289.24C689.81 302.04 748.56 347.81 780.86 414.62C819.52 494.55 808 595.02 752.97 664.44C734.41 687.86 711.18 707.01 685.2 721.67C660.82 735.42 633.32 744.62 605.5 747.7C596.3 748.71 585.63 750.67 576.58 748.5Z"
          fill="#071A12"
        />
        <path
          d="M575.71 517.19C575.71 555.77 575.71 594.35 575.71 632.93C537.87 632.93 500.03 632.93 462.19 632.93C462.19 671.69 462.19 710.45 462.19 749.21C424.96 749.21 387.73 749.21 350.5 749.21C348.82 740.14 350 729.77 350.02 720.5C350.07 701.83 350.06 683.17 350.07 664.5C350.08 657.17 350.08 649.83 350.1 642.5C350.11 639.41 349.27 634.98 350.66 632.15C351.94 629.53 355.4 627.01 357.43 624.93C362.84 619.35 368.21 613.69 373.82 608.32C389.06 593.71 403.44 577.81 418.06 562.56C428.01 552.19 438.41 542.22 448.13 531.64C450.61 528.94 459.95 518.15 462.7 517.18C465.73 516.11 470.28 516.86 473.5 516.79C481.5 516.63 489.5 516.75 497.5 516.75C514.83 516.76 532.17 516.62 549.5 516.73C558.1 516.78 567.23 515.9 575.71 517.19Z"
          fill="#E11D48"
        />
      </svg>
      {/* The 1 Mark with matching red top flag and black trunk */}
      <svg className="h-[38px] w-auto" viewBox="0 0 160 472" fill="none">
        <polygon points="12,130 68,26 68,130" fill="#E11D48" />
        <rect x="58" y="26" width="85" height="436" rx="5" fill="#071A12" />
      </svg>
    </div>
  );
}

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
          min-height: 100dvh;
          height: 100dvh;
          overflow: hidden;
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
              radial-gradient(circle at 50% 20%, rgba(16, 185, 129, 0.16), transparent 55%),
              radial-gradient(circle at 80% 85%, rgba(245, 158, 11, 0.08), transparent 45%),
              linear-gradient(145deg, #09120E 0%, #111D17 50%, #0A130F 100%);
            padding: 16px;
          }
        }

        .phone-frame {
          position: relative;
          width: 100%;
          max-width: 392px;
          height: 100dvh;
          max-height: 100dvh;
          background: #FFFFFF;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-sizing: border-box;
        }

        @media (min-width: 481px) {
          .phone-frame {
            height: min(844px, 96dvh);
            border-radius: 40px;
            box-shadow:
              0 0 0 1px rgba(255, 255, 255, 0.1),
              0 0 0 8px #1A2620,
              0 0 0 9.5px rgba(255, 255, 255, 0.15),
              0 30px 70px -15px rgba(0, 0, 0, 0.65),
              0 10px 28px -6px rgba(16, 185, 129, 0.2);
          }
        }

        .hero-grid {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background-image:
            linear-gradient(to right, rgba(7, 26, 18, 0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(7, 26, 18, 0.035) 1px, transparent 1px);
          background-size: 18px 18px;
          mask-image: radial-gradient(ellipse at 60% 45%, black 40%, transparent 88%);
          -webkit-mask-image: radial-gradient(ellipse at 60% 45%, black 40%, transparent 88%);
        }

        .hm-cell {
          aspect-ratio: 1;
          border-radius: 3.5px;
          transition: transform 0.15s ease;
          cursor: pointer;
        }
        .hm-cell:hover {
          transform: scale(1.22);
          z-index: 5;
        }
        .hm-0 { background: #DDF1E6; }
        .hm-1 { background: #A8DEC4; }
        .hm-2 { background: #48C78E; }
        .hm-3 { background: #10B981; }
        .hm-4 { background: #056B48; }

        .pearl-input {
          width: 100%;
          height: 42px;
          padding-left: 38px;
          padding-right: 12px;
          border-radius: 14px;
          background: #F4F6F5;
          border: 1px solid #DFE7E2;
          color: #071A12;
          font-size: 13.5px;
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
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.14);
        }

        .cta-primary {
          width: 100%;
          height: 43px;
          border-radius: 14px;
          background: #071A12;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            0 8px 18px -4px rgba(7, 26, 18, 0.35);
          transition: all 0.2s ease;
          cursor: pointer;
          border: none;
        }

        .cta-primary:hover {
          background: #05140E;
          transform: translateY(-0.5px);
          box-shadow: 0 10px 22px -4px rgba(7, 26, 18, 0.42);
        }

        .cta-primary:active {
          transform: translateY(0.5px) scale(0.99);
        }
      `}</style>

      {/* Main Centered Phone Shell */}
      <main className="phone-frame">
        {/* Toast Notification */}
        <div 
          className={`pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 transition-all duration-300 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#071A12]/95 text-white shadow-xl border border-emerald-400/30 backdrop-blur-md ${
            toastActive ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-[11px] font-semibold tracking-wide whitespace-nowrap">{toastText}</span>
        </div>

        {/* ========================================================
             1. TOP HERO SECTION (FAITHFUL TO USER MOCKUP)
             ======================================================== */}
        <section className="relative flex-none h-[47%] min-h-[300px] max-h-[370px] bg-gradient-to-b from-[#EDF6F1] via-[#E4F2EA] to-[#D5EADF] p-3.5 sm:p-4 pb-5 flex flex-col justify-between overflow-hidden">
          <div className="hero-grid"></div>

          {/* Organic Background Flowing Wave Spline with Green Dots */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-2" viewBox="0 0 392 340" fill="none" preserveAspectRatio="none">
            {/* Wave Curve */}
            <path
              d="M-10 280 C 70 290, 130 260, 210 275 C 265 285, 290 270, 335 240 C 370 215, 385 160, 405 130"
              stroke="#A3D9BE"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Soft Green Spline Behind Meter */}
            <path
              d="M 180 320 Q 280 270 330 230 T 400 135"
              stroke="rgba(16, 185, 129, 0.4)"
              strokeWidth="2.5"
            />
            {/* Spline Anchor Dots */}
            <circle cx="265" cy="272" r="4.5" fill="#10B981" />
            <circle cx="333" cy="232" r="4.5" fill="#10B981" />
            <circle cx="368" cy="178" r="4" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
          </svg>

          {/* Top Row: Pill (Left) + Consistency Card (Right) */}
          <div className="relative z-10 flex items-start justify-between gap-2">
            {/* Left Column: Pill + Editorial Headline + Subcopy */}
            <div className="flex flex-col justify-between flex-1 min-w-0 pr-1">
              <div>
                {/* Pill: UNDERSTAND THE PATTERN → */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 border border-emerald-600/20 shadow-xs mb-2.5 whitespace-nowrap">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_#10B981]"></span>
                  </span>
                  <span className="text-[8.5px] font-extrabold tracking-[0.14em] uppercase text-[#0B3522]">
                    Understand the pattern
                  </span>
                  <span className="text-emerald-700 font-bold text-[9.5px] leading-none">→</span>
                </div>

                {/* Editorial Headline: NO rough stroke under checkbox (per user instruction) */}
                <h1 className="text-[25px] sm:text-[27px] font-black tracking-tight leading-[1.0] text-[#0A1E14]">
                  A habit<br />
                  isn’t just a<br />
                  <span className="text-[#056B48]">
                    checkbox.
                  </span>
                </h1>

                {/* Subcopy */}
                <p className="mt-2 text-[12px] sm:text-[12.5px] leading-tight text-[#455D51] font-medium">
                  It’s a pattern<br />
                  of your future.
                </p>
              </div>
            </div>

            {/* Right Column: Consistency Card */}
            <div className="shrink-0">
              <div className="w-[154px] sm:w-[158px] p-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-white/90 shadow-[0_6px_20px_rgba(7,26,18,0.06)]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[8px] font-black tracking-[0.12em] uppercase text-[#0B2519]">
                    Consistency
                  </span>
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
                    <span className="text-[9px] leading-none">🔥</span>
                    <span className="text-[8px] font-black text-[#78350F] tracking-tight">27 days</span>
                  </div>
                </div>

                {/* Weekday Header */}
                <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[7.5px] font-bold text-[#677F73]">
                  <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span className="text-emerald-700">S</span><span>S</span>
                </div>

                {/* 5x7 Cells Matrix */}
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((lvl, i) => (
                    <div
                      key={i}
                      onClick={() => handleCellClick(i)}
                      className={`hm-cell hm-${lvl}`}
                      title="Tap cell to update streak"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row of Hero: 4 Chain Nodes (Left) + Circular Progress Meter (Right) */}
          <div className="relative z-10 flex items-center justify-between mt-auto pt-1">
            {/* 4 Connected Sequence Nodes */}
            <div className="relative flex items-center">
              {/* Horizontal Connecting Track */}
              <div className="absolute top-[13px] left-[13px] right-[13px] h-[1.5px] bg-gradient-to-r from-slate-300 via-emerald-400 to-amber-400 -z-0"></div>

              {/* 1. Thought */}
              <div 
                className="flex flex-col items-center gap-1 cursor-pointer group z-10"
                onClick={() => triggerToast('Step 1: Every habit begins as a single thought')}
              >
                <div className="w-[26px] h-[26px] rounded-full bg-white border border-slate-300 text-slate-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18h6"/>
                    <path d="M10 22h4"/>
                    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
                  </svg>
                </div>
                <span className="text-[6.8px] font-black uppercase tracking-wider text-[#566B60]">Thought</span>
              </div>

              <div className="w-2.5 sm:w-3"></div>

              {/* 2. Action */}
              <div 
                className="flex flex-col items-center gap-1 cursor-pointer group z-10"
                onClick={() => triggerToast('Step 2: Spark daily micro-actions')}
              >
                <div className="w-[26px] h-[26px] rounded-full bg-[#D1F2E0] border border-[#34D399] text-[#059669] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 2L4.09 12.63a1 1 0 0 0 .77 1.64H11v7.73l8.91-10.63a1 1 0 0 0-.77-1.64H13V2z"/>
                  </svg>
                </div>
                <span className="text-[6.8px] font-black uppercase tracking-wider text-emerald-700">Action</span>
              </div>

              <div className="w-2.5 sm:w-3"></div>

              {/* 3. Habit */}
              <div 
                className="flex flex-col items-center gap-1 cursor-pointer group z-10"
                onClick={() => triggerToast('Step 3: Compound into automatic habits')}
              >
                <div className="w-[26px] h-[26px] rounded-full bg-[#056B48] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="6" y1="20" x2="6" y2="14"/>
                    <line x1="12" y1="20" x2="12" y2="10"/>
                    <line x1="18" y1="20" x2="18" y2="4"/>
                  </svg>
                </div>
                <span className="text-[6.8px] font-black uppercase tracking-wider text-emerald-800">Habit</span>
              </div>

              <div className="w-2.5 sm:w-3"></div>

              {/* 4. Future */}
              <div 
                className="flex flex-col items-center gap-1 cursor-pointer group z-10"
                onClick={() => triggerToast('Step 4: Design your inevitable future')}
              >
                <div className="w-[26px] h-[26px] rounded-full bg-[#FEF3C7] border border-[#FBBF24] text-[#D97706] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="9"/>
                    <circle cx="12" cy="12" r="5"/>
                    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                  </svg>
                </div>
                <span className="text-[6.8px] font-black uppercase tracking-wider text-amber-700">Future</span>
              </div>
            </div>

            {/* Circular Progress Gauge */}
            <div 
              className="relative w-[78px] h-[78px] sm:w-[82px] sm:h-[82px] rounded-full bg-white/95 backdrop-blur-md border border-white/95 shadow-[0_8px_22px_rgba(7,26,18,0.1)] flex items-center justify-center cursor-pointer shrink-0" 
              onClick={cycleProgress} 
              title="Tap to preview daily momentum"
            >
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 p-1">
                <defs>
                  <linearGradient id="dialEmeraldArc" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34D399" />
                    <stop offset="50%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="41" fill="none" stroke="rgba(7, 26, 18, 0.08)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="41"
                  fill="none"
                  stroke="url(#dialEmeraldArc)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="257.6"
                  strokeDashoffset={strokeOffset}
                  style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[17px] font-black text-[#071A12] tracking-tight leading-none">{currentPercent}%</span>
                <span className="text-[7px] font-extrabold tracking-[0.18em] text-[#64748B] uppercase mt-0.5">Today</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
             2. BOTTOM LOGIN FORM SECTION (EXACT FIT TO SCREENSHOT)
             ======================================================== */}
        <section className="flex-1 bg-white rounded-t-[34px] -mt-3.5 relative z-20 px-4 py-3.5 sm:px-6 sm:py-4 flex flex-col justify-between shadow-[0_-8px_25px_rgba(7,26,18,0.06)]">
          {/* Centered Official D1 Logo (Clean D1 without extra text) */}
          <div className="flex items-center justify-center pt-0.5">
            <D1Logo />
          </div>

          {/* Error Alert */}
          {error && (
            <div className="py-1 px-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center animate-in fade-in">
              {error}
            </div>
          )}

          {/* 1. Sign in with Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-[43px] rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.99] border border-slate-200/90 shadow-[0_2px_6px_rgba(7,26,18,0.04)] flex items-center justify-center gap-2.5 text-[14px] font-medium text-slate-800 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Sign in with Google</span>
          </button>

          {/* 2. OR Divider */}
          <div className="flex items-center gap-3 my-0.5">
            <div className="h-px flex-1 bg-slate-200"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR</span>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>

          {/* 3. Form Inputs */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            {isSignUp && (
              <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-150">
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

            {/* Email Input */}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <rect width="20" height="16" x="2" y="4" rx="3" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={100}
                className="pearl-input"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Primary Action Button: Continue with Email */}
            <button type="submit" disabled={loading} className="cta-primary mt-1 group">
              <span>{loading ? 'Connecting...' : (isSignUp ? 'Create account' : 'Continue with Email')}</span>
              <svg className="w-4 h-4 text-emerald-400 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </button>
          </form>

          {/* Explore Demo Button */}
          <button
            type="button"
            onClick={handleGuestMode}
            className="w-full h-[41px] rounded-2xl bg-[#EBF3EE] hover:bg-[#E0ECE4] active:scale-[0.99] text-[#072618] font-bold text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#D1E4D8]/70"
          >
            {/* Emerald Leaf Icon matching screenshot */}
            <svg className="w-4 h-4 text-[#0B7345] shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A9.7 9.7 0 0 0 17 8c2-3.4 3-7 3-7s-3.6 1-7 3a9.7 9.7 0 0 0-8.7 10.3L6 18c2-5 5.5-9 11-10z"/>
            </svg>
            <span>Explore Demo — No Sign-up Needed</span>
            <span className="text-[#0B7345] text-xs font-bold">→</span>
          </button>

          {/* Account Toggle & Legal Links */}
          <div className="text-center space-y-1 pt-0.5">
            <p className="text-[12.5px] text-[#2B3E34] font-medium">
              {isSignUp ? 'Already have an account?' : 'New to D1?'}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-[#056B48] font-bold hover:underline ml-1.5 cursor-pointer"
              >
                {isSignUp ? 'Sign in' : 'Create account'}
              </button>
            </p>

            <p className="text-[10px] leading-tight text-slate-500 max-w-[320px] mx-auto">
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
