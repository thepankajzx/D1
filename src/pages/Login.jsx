import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGuest } from '../contexts/GuestContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { auth, db } from '../lib/firebase';

/* ==========================================================================
   1. HEATMAP CONSTANTS & HELPERS
   ========================================================================== */
const SHADE_CYCLE_ORDER = ["h-0", "g-1", "g-2", "g-3", "g-4", "r-1", "r-2", "r-3"];

const SHADE_LABELS = {
  "h-0": "Rest / Unscheduled Day",
  "g-1": "Green L1 · Light Output (1 habit done)",
  "g-2": "Green L2 · Solid Output (2 habits done)",
  "g-3": "Green L3 · High Output (3 habits done)",
  "g-4": "Green L4 · Peak Day (All habits crushed!)",
  "r-1": "Red L1 · Late Check-in / Minor Slip",
  "r-2": "Red L2 · Missed Habit Day",
  "r-3": "Red L3 · Streak Break Alert!"
};

const INITIAL_DUAL_SHADE_PATTERN = [
  "g-2", "g-3", "r-1", "g-4", "g-3", "h-0", "g-2",
  "g-1", "g-4", "g-2", "r-2", "g-4", "g-3", "g-4",
  "g-3", "h-0", "g-3", "g-4", "r-3", "g-4", "g-2",
  "g-2", "g-3", "g-4", "g-2", "g-4", "g-1", "g-3",
  "r-2", "g-1", "g-3", "g-4", "h-0", "r-1", "g-3",
  "g-2", "r-1", "g-2", "g-4", "g-3", "h-0", "g-4"
];

export default function Login() {
  const navigate = useNavigate();
  const { currentUser, login, signup, loginWithGoogle } = useAuth();
  const { enterGuestMode, exitGuestMode } = useGuest();

  // Auth form state
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Early access & founder spots state
  const TOTAL_FOUNDER_SPOTS = 100;
  const [claimedUsers, setClaimedUsers] = useState(() => {
    try {
      const stored = localStorage.getItem('d1_claimed_early_users');
      return stored ? parseInt(stored, 10) : 63;
    } catch (_) {
      return 63;
    }
  });
  const [bumpSpots, setBumpSpots] = useState(false);

  // Pro celebration modal state
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [proModalData, setProModalData] = useState({
    name: 'Founder',
    spotNumber: 64,
    redirectUrl: '/'
  });

  // Demo sandbox modal state
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoHabits, setDemoHabits] = useState([
    { id: 1, name: 'Deep Work — 90 mins', streak: '🔥 14d', checked: true },
    { id: 2, name: 'Morning Mobility Flow', streak: '🔥 24d', checked: true },
    { id: 3, name: 'Read 20 Pages', streak: '🔥 9d', checked: false },
    { id: 4, name: 'Zero Refined Sugar', streak: '🔥 6d', checked: false }
  ]);

  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  // Interactive 7x6 Heatmap state
  const [heatShades, setHeatShades] = useState(INITIAL_DUAL_SHADE_PATTERN);

  // Confetti Canvas Ref & Physics
  const canvasRef = useRef(null);
  const confettiParticles = useRef([]);
  const confettiAnimId = useRef(null);

  // Password strength score
  const [passStrength, setPassStrength] = useState(0);

  /* --------------------------------------------------------------------------
     TOAST NOTIFICATIONS
     -------------------------------------------------------------------------- */
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, isOut: false }]);
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isOut: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 240);
    }, 3000);
  };

  /* --------------------------------------------------------------------------
     CONFETTI ENGINE
     -------------------------------------------------------------------------- */
  const spawnConfettiWave = (originX, originY, count, spreadAngle) => {
    const palette = [
      '#087653', '#10b981', '#34d399', '#6ee7b7',
      '#fbbf24', '#f59e0b', '#fb7185', '#ffffff'
    ];

    for (let i = 0; i < count; i++) {
      const angle = spreadAngle + (Math.random() - 0.5) * 1.35;
      const velocity = 9 + Math.random() * 13;
      confettiParticles.current.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 3,
        size: 6 + Math.random() * 6,
        color: palette[Math.floor(Math.random() * palette.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.24,
        gravity: 0.28 + Math.random() * 0.1,
        drag: 0.985,
        opacity: 1,
        shape: Math.random() > 0.35 ? 'rect' : 'circle'
      });
    }
  };

  const launchConfettiBurst = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const w = canvas.width;
    const h = canvas.height;

    spawnConfettiWave(w * 0.12, h * 0.65, 55, -Math.PI / 3);
    spawnConfettiWave(w * 0.88, h * 0.65, 55, (-2 * Math.PI) / 3);
    setTimeout(() => {
      spawnConfettiWave(w * 0.5, h * 0.25, 65, -Math.PI / 2);
    }, 180);

    if (!confettiAnimId.current) {
      animateConfetti();
    }
  };

  const animateConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = confettiParticles.current.length - 1; i >= 0; i--) {
      const p = confettiParticles.current[i];
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      if (p.y > canvas.height * 0.78) {
        p.opacity -= 0.025;
      }

      if (p.opacity <= 0 || p.y > canvas.height + 40) {
        confettiParticles.current.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
      }
      ctx.restore();
    }

    if (confettiParticles.current.length > 0) {
      confettiAnimId.current = requestAnimationFrame(animateConfetti);
    } else {
      confettiAnimId.current = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (confettiAnimId.current) cancelAnimationFrame(confettiAnimId.current);
    };
  }, []);

  /* --------------------------------------------------------------------------
     WINDOW D1 AUTH BRIDGE REGISTRATION & SPOT DECREMENT
     -------------------------------------------------------------------------- */
  const claimSpotAndCelebrate = ({ email, name, redirectUrl } = {}) => {
    const newClaimed = Math.min(TOTAL_FOUNDER_SPOTS, claimedUsers + 1);
    setClaimedUsers(newClaimed);
    setBumpSpots(true);
    setTimeout(() => setBumpSpots(false), 350);

    try {
      localStorage.setItem('d1_claimed_early_users', String(newClaimed));
    } catch (_) {}

    setProModalData({
      name: name || (email ? email.split('@')[0] : 'Founder'),
      spotNumber: newClaimed,
      redirectUrl: redirectUrl || '/'
    });
    setIsProModalOpen(true);
    launchConfettiBurst();
  };

  useEffect(() => {
    window.D1AuthBridge = {
      setEarlyAccessSpots(remainingSpots, total = 100) {
        const claimed = Math.max(0, total - remainingSpots);
        setClaimedUsers(claimed);
        try {
          localStorage.setItem('d1_claimed_early_users', String(claimed));
        } catch (_) {}
      },
      unlockProAndCelebrate({ email, name, spotNumber, redirectUrl } = {}) {
        claimSpotAndCelebrate({ email, name, spotNumber, redirectUrl });
      },
      onAuthSubmit: null,
      onGoogleAuth: null
    };

    return () => {
      delete window.D1AuthBridge;
    };
  }, [claimedUsers]);

  // If already authenticated, navigate to dashboard immediately
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  /* --------------------------------------------------------------------------
     HEATMAP LOGIC
     -------------------------------------------------------------------------- */
  const handleHeatCellClick = (idx) => {
    if (navigator?.vibrate) navigator.vibrate(8);
    setHeatShades((prev) => {
      const copy = [...prev];
      const cur = copy[idx];
      const nextIdx = (SHADE_CYCLE_ORDER.indexOf(cur) + 1) % SHADE_CYCLE_ORDER.length;
      copy[idx] = SHADE_CYCLE_ORDER[nextIdx];
      return copy;
    });
  };

  const randomizeHeatmap = () => {
    if (navigator?.vibrate) navigator.vibrate(15);
    const weightedPool = [
      'g-1', 'g-2', 'g-2', 'g-3', 'g-3', 'g-4', 'g-4', 'g-4',
      'r-1', 'r-2', 'r-3',
      'h-0'
    ];
    setHeatShades(INITIAL_DUAL_SHADE_PATTERN.map(() => {
      return weightedPool[Math.floor(Math.random() * weightedPool.length)];
    }));
    showToast('Updated! Green = Completed, Red = Missed.', 'success');
  };

  const greenCount = heatShades.filter((s) => s.startsWith('g-')).length;
  const redCount = heatShades.filter((s) => s.startsWith('r-')).length;
  const totalTracked = Math.max(1, greenCount + redCount);
  const consistencyScore = Math.round((greenCount / totalTracked) * 100);

  /* --------------------------------------------------------------------------
     PASSWORD STRENGTH METER
     -------------------------------------------------------------------------- */
  const calculatePasswordStrength = (val) => {
    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val) || val.length >= 12) score++;
    setPassStrength(score);
  };

  const strengthLabels = [
    'Add 8+ chars for strong security',
    'Weak password',
    'Fair — add numbers or symbols',
    'Good password',
    'Strong password ✓'
  ];
  const strengthColors = ['#dce6e1', '#ef4444', '#f59e0b', '#10b981', '#087653'];

  /* --------------------------------------------------------------------------
     AUTHENTICATION ACTIONS
     -------------------------------------------------------------------------- */
  const clearFieldError = (field) => {
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      showToast('Connecting to Google...', 'success');

      if (typeof window.D1AuthBridge?.onGoogleAuth === 'function') {
        const bridgeRes = await window.D1AuthBridge.onGoogleAuth({ mode: authMode });
        if (bridgeRes?.success) {
          claimSpotAndCelebrate(bridgeRes);
          return;
        }
      }

      const cred = await loginWithGoogle();
      const user = cred?.user;

      if (user) {
        exitGuestMode();
        // ⚡ INSTANT DASHBOARD ACCESS: Navigate immediately without blocking on Firestore
        navigate('/');

        // Background profile initialization and Founder tier check
        (async () => {
          try {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            let founderNum = claimedUsers + 1;
            if (!userSnap.exists()) {
              await setDoc(userRef, {
                createdAt: new Date().toISOString(),
                displayName: user.displayName || user.email?.split('@')[0] || '',
                email: user.email,
                isPro: true,
                isFounder: true,
                founderNumber: founderNum,
                proForever: true,
                currentStreak: 0,
                longestStreak: 0
              });
            } else {
              const udata = userSnap.data();
              if (!udata.isPro) {
                await updateDoc(userRef, { isPro: true, isFounder: true, proForever: true });
              }
            }
          } catch (syncErr) {
            console.warn('[Background User Sync Warn]:', syncErr);
          }
        })();
        return;
      }
    } catch (err) {
      console.error('[Google Sign In Error]:', err);
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('cancel') || err?.code === 'auth/popup-closed-by-user') {
        showToast('Sign-in cancelled', 'error');
      } else {
        showToast(msg || 'Google sign-in failed.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    setFieldErrors({});

    if (!cleanEmail) {
      setFieldErrors({ email: 'Please enter your email address.' });
      return;
    }
    if (!emailRegex.test(cleanEmail)) {
      setFieldErrors({ email: 'Please enter a valid email address.' });
      return;
    }

    if (authMode === 'reset') {
      try {
        setLoading(true);
        await sendPasswordResetEmail(auth, cleanEmail);
        showToast(`Password reset link sent to ${cleanEmail}`, 'success');
        setAuthMode('signin');
      } catch (err) {
        setFieldErrors({ email: err.message || 'Failed to send reset email.' });
        showToast(err.message || 'Error sending reset email', 'error');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setFieldErrors({ password: 'Please enter your password.' });
      return;
    }
    if (authMode === 'signup' && password.length < 6) {
      setFieldErrors({ password: 'Password must be at least 6 characters.' });
      return;
    }

    try {
      setLoading(true);

      if (typeof window.D1AuthBridge?.onAuthSubmit === 'function') {
        const bridgeRes = await window.D1AuthBridge.onAuthSubmit({
          mode: authMode,
          email: cleanEmail,
          password
        });
        if (bridgeRes?.success) {
          claimSpotAndCelebrate({
            email: bridgeRes.email || cleanEmail,
            name: bridgeRes.name,
            redirectUrl: bridgeRes.redirectUrl
          });
          return;
        }
      }

      let userCred;
      if (authMode === 'signup') {
        try {
          userCred = await signup(cleanEmail, password);
        } catch (signupErr) {
          if (signupErr.code === 'auth/email-already-in-use') {
            userCred = await login(cleanEmail, password);
          } else {
            throw signupErr;
          }
        }
      } else {
        try {
          userCred = await login(cleanEmail, password);
        } catch (loginErr) {
          if (loginErr.code === 'auth/user-not-found' || loginErr.code === 'auth/invalid-credential') {
            try {
              userCred = await signup(cleanEmail, password);
            } catch (err2) {
              if (err2.code === 'auth/email-already-in-use') {
                throw new Error('Invalid email or password.');
              }
              throw err2;
            }
          } else {
            throw loginErr;
          }
        }
      }

      const user = userCred?.user;
      if (user) {
        exitGuestMode();
        // ⚡ INSTANT DASHBOARD ACCESS
        navigate('/');

        // Background profile initialization and Founder tier check
        (async () => {
          try {
            const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
            if (fullName) {
              await updateProfile(user, { displayName: fullName }).catch(() => {});
            }

            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            let founderNum = claimedUsers + 1;

            if (!userSnap.exists()) {
              await setDoc(userRef, {
                createdAt: new Date().toISOString(),
                displayName: fullName || user.displayName || cleanEmail.split('@')[0],
                email: user.email,
                isPro: true,
                isFounder: true,
                founderNumber: founderNum,
                proForever: true,
                currentStreak: 0,
                longestStreak: 0
              });
            } else {
              const udata = userSnap.data();
              if (!udata.isPro) {
                await updateDoc(userRef, { isPro: true, isFounder: true, proForever: true });
              }
            }
          } catch (syncErr) {
            console.warn('[Background User Sync Warn]:', syncErr);
          }
        })();
        return;
      }
    } catch (err) {
      console.error('[Auth Error]:', err);
      showToast(err.message || 'Authentication error.', 'error');
      setFieldErrors({ password: err.message || 'Invalid credentials.' });
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------------------------------
     MODAL HELPERS
     -------------------------------------------------------------------------- */
  const continueToProDashboard = () => {
    launchConfettiBurst();
    setIsProModalOpen(false);
    showToast('D1 Pro Workspace Activated! Redirecting...', 'success');
    setTimeout(() => {
      navigate(proModalData.redirectUrl || '/');
    }, 700);
  };

  const toggleDemoHabit = (id) => {
    setDemoHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, checked: !h.checked } : h))
    );
    randomizeHeatmap();
  };

  const launchFullDemo = () => {
    setIsDemoModalOpen(false);
    showToast('Launching D1 Demo Workspace...', 'success');
    enterGuestMode();
    navigate('/');
  };

  const remainingSpots = Math.max(0, TOTAL_FOUNDER_SPOTS - claimedUsers);

  return (
    <div className="login-root">
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-tap-highlight-color: transparent;
        }

        :root {
          --bg: #f7faf8;
          --dark: #06251b;
          --dark-elevated: #0a3527;
          --green: #087653;
          --green-hover: #066043;
          --green-bright: #4bc095;
          --green-mint: #69cfa5;
          --green-soft: #e8f4ef;
          --green-soft-hover: #ddf0e8;
          --red-soft: #ffe4e6;
          --red-mid: #fb7185;
          --red-deep: #e11d48;
          --border: #dce6e1;
          --border-focus: #087653;
          --input-bg: #f1f5f3;
          --muted: #647870;
          --error: #d9383a;
          --error-soft: #fef2f2;
          --shadow-sm: 0 2px 8px rgba(6, 37, 27, 0.04);
          --shadow-md: 0 8px 24px -4px rgba(6, 37, 27, 0.07);
          --shadow-cta: 0 6px 18px -4px rgba(6, 37, 27, 0.22);
          --radius-lg: 20px;
          --radius-md: 14px;
        }

        .login-root {
          min-height: 100vh;
          width: 100vw;
          background-color: var(--bg);
          background-image:
            radial-gradient(circle at 15% 10%, rgba(8, 118, 83, 0.06) 0%, transparent 45%),
            radial-gradient(circle at 85% 90%, rgba(75, 192, 149, 0.07) 0%, transparent 50%);
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          /* Respect mobile status bar (clock, wifi, battery) */
          padding-top: max(env(safe-area-inset-top, 0px), 24px);
          padding-bottom: max(env(safe-area-inset-bottom, 0px), 16px);
          padding-left: 14px;
          padding-right: 14px;
          color: var(--dark);
          overflow-x: hidden;
        }

        #confettiCanvas {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 10000;
        }

        .page {
          width: 100%;
          max-width: 420px;
          animation: pageEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes pageEnter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* TOAST NOTIFICATION */
        .toast-container {
          position: fixed;
          top: max(env(safe-area-inset-top, 0px), 14px);
          left: 50%;
          transform: translateX(-50%);
          z-index: 10001;
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: calc(100% - 28px);
          max-width: 400px;
          pointer-events: none;
        }

        .toast {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px 14px;
          border-radius: 12px;
          background: var(--dark);
          color: #ffffff;
          font-size: 12.5px;
          font-weight: 600;
          line-height: 1.35;
          box-shadow: 0 12px 28px rgba(6, 37, 27, 0.22);
          border: 1px solid rgba(255, 255, 255, 0.12);
          animation: toastIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .toast.toast-out { animation: toastOut 0.2s ease forwards; }
        .toast.toast-error { background: #2c0b0e; border-color: rgba(248, 113, 113, 0.3); }

        .toast-badge {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: rgba(105, 207, 165, 0.18);
          color: var(--green-mint);
          font-size: 11px;
        }

        .toast.toast-error .toast-badge {
          background: rgba(248, 113, 113, 0.2);
          color: #f87171;
        }

        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes toastOut {
          to { opacity: 0; transform: translateY(-6px) scale(0.96); }
        }

        /* HERO & HEATMAP (COMPACT & UNCLUTTERED) */
        .hero {
          position: relative;
          overflow: hidden;
          background: linear-gradient(145deg, #eaf6f1 0%, #e1f1ea 100%);
          border: 1px solid #cce3d8;
          border-radius: var(--radius-lg);
          padding: 13px 14px;
          margin-bottom: 8px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7), var(--shadow-sm);
        }

        .hero::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(6, 37, 27, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 37, 27, 0.03) 1px, transparent 1px);
          background-size: 18px 18px;
          pointer-events: none;
        }

        /* Header bar with clean 2-element layout */
        .hero-top-bar {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .brand-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 9px 3px 4px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(8, 118, 83, 0.16);
          border-radius: 999px;
          box-shadow: 0 1px 4px rgba(6, 37, 27, 0.04);
        }

        .brand-logo {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--dark);
          color: var(--green-mint);
          font-family: "Plus Jakarta Sans", sans-serif;
          font-size: 9.5px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .brand-tag {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: var(--dark);
        }

        .heatmap-hint {
          font-size: 9.5px;
          font-weight: 700;
          color: #2b5547;
          background: rgba(255, 255, 255, 0.85);
          padding: 3.5px 8px;
          border-radius: 999px;
          border: 1px solid rgba(8, 118, 83, 0.16);
          cursor: pointer;
          user-select: none;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .heatmap-hint:hover {
          background: #ffffff;
          color: var(--dark);
          transform: translateY(-0.5px);
        }

        .hero-body {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .hero-copy {
          width: 52%;
          flex-shrink: 0;
        }

        .hero h1 {
          font-family: "Plus Jakarta Sans", Inter, sans-serif;
          font-size: clamp(23px, 6.2vw, 27px);
          line-height: 1.0;
          font-weight: 800;
          letter-spacing: -1.2px;
          color: var(--dark);
        }

        .hero h1 span {
          color: var(--green);
          position: relative;
          display: inline-block;
        }

        .hero h1 span::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: 1px;
          width: 100%;
          height: 4px;
          background: rgba(8, 118, 83, 0.16);
          border-radius: 3px;
          z-index: -1;
        }

        .hero p {
          margin-top: 5px;
          font-size: 11px;
          line-height: 1.35;
          font-weight: 500;
          color: #2d5448;
        }

        .shade-legend {
          margin-top: 7px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 3px 6px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(6, 37, 27, 0.08);
          border-radius: 8px;
          font-size: 8.5px;
          font-weight: 700;
          color: #36594d;
        }

        .legend-group {
          display: inline-flex;
          align-items: center;
          gap: 2.5px;
        }

        .legend-swatches {
          display: inline-flex;
          gap: 1.5px;
          margin-right: 1.5px;
        }

        .swatch {
          width: 6.5px;
          height: 6.5px;
          border-radius: 1.5px;
          display: inline-block;
        }

        .heatmap-wrap {
          width: 46%;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 5px;
        }

        .heatmap {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 3.5px;
          padding: 6px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(8, 118, 83, 0.15);
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(6, 37, 27, 0.04);
        }

        .heat {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 3.5px;
          background: rgba(6, 37, 27, 0.07);
          cursor: pointer;
          transition:
            transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1),
            background-color 0.18s ease;
          position: relative;
        }

        .heat:hover { transform: scale(1.22); z-index: 3; }
        .heat:active { transform: scale(0.9); }

        .heat.h-0 { background: rgba(6, 37, 27, 0.07); }
        .heat.g-1 { background: #a7f3d0; border: 1px solid rgba(16, 185, 129, 0.25); }
        .heat.g-2 { background: #34d399; }
        .heat.g-3 { background: #10b981; }
        .heat.g-4 { background: #067652; }
        .heat.r-1 { background: #fecdd3; border: 1px solid rgba(244, 63, 94, 0.3); }
        .heat.r-2 { background: #fb7185; }
        .heat.r-3 { background: #e11d48; }

        .streak-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3.5px 7px;
          border-radius: 999px;
          background: rgba(6, 37, 27, 0.92);
          color: #ffffff;
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: -0.1px;
          white-space: nowrap;
        }

        .streak-pill .stat-green { color: #6ee7b7; }
        .streak-pill .stat-red { color: #fda4af; }
        .streak-pill .stat-score {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.14);
          padding: 0.5px 4px;
          border-radius: 99px;
        }

        /* EARLY ACCESS BANNER (COMPACT) */
        .offer {
          width: 100%;
          background: linear-gradient(135deg, var(--dark) 0%, #093527 100%);
          border: 1px solid rgba(105, 207, 165, 0.18);
          border-radius: var(--radius-md);
          padding: 10px 13px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
          box-shadow: 0 6px 16px -4px rgba(6, 37, 27, 0.18);
        }

        .offer-content { min-width: 0; flex: 1; }
        .offer-label-row {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 2px;
        }

        .live-dot {
          width: 5.5px;
          height: 5.5px;
          border-radius: 50%;
          background: var(--green-mint);
          box-shadow: 0 0 0 0 rgba(105, 207, 165, 0.7);
          animation: pulseDot 2s infinite;
        }

        @keyframes pulseDot {
          0% { box-shadow: 0 0 0 0 rgba(105, 207, 165, 0.7); }
          70% { box-shadow: 0 0 0 5px rgba(105, 207, 165, 0); }
          100% { box-shadow: 0 0 0 0 rgba(105, 207, 165, 0); }
        }

        .offer-label {
          font-size: 8.5px;
          text-transform: uppercase;
          letter-spacing: 1.1px;
          color: #9dc0b5;
          font-weight: 800;
        }

        .offer-title {
          font-size: 12px;
          line-height: 1.25;
          font-weight: 700;
          color: #ffffff;
        }

        .offer-title span {
          color: var(--green-mint);
          font-weight: 800;
        }

        .offer-meta {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 4px;
        }

        .offer-progress-bar {
          width: 70px;
          height: 3.5px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .offer-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4bc095, #8ce2c1);
          border-radius: 999px;
          transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .offer-sub {
          font-size: 9.5px;
          color: #9bb5ad;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .spots {
          flex-shrink: 0;
          text-align: center;
          min-width: 48px;
          padding: 4px 6px 4px 10px;
          border-left: 1px solid rgba(255, 255, 255, 0.12);
        }

        .spots strong {
          display: block;
          font-family: "Plus Jakarta Sans", sans-serif;
          color: #ffffff;
          font-size: 19px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.8px;
          transition: transform 0.22s ease, color 0.22s ease;
        }

        .spots strong.bump {
          transform: scale(1.3);
          color: var(--green-mint);
        }

        .spots small {
          display: block;
          color: var(--green-mint);
          font-size: 8.5px;
          font-weight: 700;
          margin-top: 2px;
          letter-spacing: 0.1px;
        }

        /* AUTH CARD (COMPACT) */
        .auth-section {
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(220, 230, 225, 0.85);
          border-radius: 18px;
          padding: 12px;
          box-shadow: var(--shadow-md);
        }

        .mode-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #ebf2ee;
          padding: 3.5px;
          border-radius: 11px;
          margin-bottom: 10px;
          border: 1px solid #dfeae4;
        }

        .mode-tab {
          height: 31px;
          border: none;
          background: transparent;
          border-radius: 8px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          color: #546d64;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mode-tab.active {
          background: #ffffff;
          color: var(--dark);
          box-shadow: 0 1.5px 5px rgba(6, 37, 27, 0.06);
        }

        .google-btn {
          width: 100%;
          height: 44px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          color: #1e2d28;
          font-family: inherit;
          font-size: 13.5px;
          font-weight: 650;
          cursor: pointer;
          box-shadow: 0 1.5px 5px rgba(6, 37, 27, 0.03);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .google-btn:hover:not(:disabled) {
          transform: translateY(-0.5px);
          border-color: #c5d6ce;
          box-shadow: 0 4px 10px rgba(6, 37, 27, 0.05);
        }

        .google-btn:active:not(:disabled) { transform: translateY(0); }
        .google-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .google-icon {
          width: 17px;
          height: 17px;
          flex-shrink: 0;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 8px 0;
          color: #829890;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        .divider::before,
        .divider::after {
          content: "";
          height: 1px;
          background: #dde7e2;
          flex: 1;
        }

        .field-group { margin-bottom: 7px; }

        .input {
          width: 100%;
          height: 43px;
          border: 1.5px solid var(--border);
          border-radius: 12px;
          background: var(--input-bg);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 11px;
          transition: all 0.2s ease;
        }

        .input:focus-within {
          background: #ffffff;
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px rgba(8, 118, 83, 0.12);
        }

        .input.input-error {
          background: var(--error-soft);
          border-color: var(--error);
          animation: shake 0.35s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        @keyframes shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(3px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }

        .input-icon {
          width: 16px;
          height: 16px;
          stroke: #7c968d;
          flex-shrink: 0;
          transition: stroke 0.2s ease;
        }

        .input:focus-within .input-icon { stroke: var(--green); }
        .input.input-error .input-icon { stroke: var(--error); }

        .input input {
          width: 100%;
          height: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-family: inherit;
          font-size: 13.5px;
          font-weight: 500;
          color: var(--dark);
        }

        .input input::placeholder {
          color: #829990;
          font-weight: 400;
        }

        .forgot-inline-btn {
          border: none;
          background: transparent;
          color: #5b766c;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          padding: 3px 5px;
          border-radius: 5px;
          flex-shrink: 0;
          transition: color 0.15s ease, background 0.15s ease;
        }

        .forgot-inline-btn:hover {
          color: var(--green);
          background: rgba(8, 118, 83, 0.08);
        }

        .eye-btn {
          border: none;
          background: transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 6px;
          cursor: pointer;
          color: #7c968d;
          transition: color 0.15s ease;
          flex-shrink: 0;
        }

        .eye-btn:hover { color: var(--dark); }
        .eye-btn svg { width: 16px; height: 16px; stroke: currentColor; }

        .field-error-msg {
          font-size: 11px;
          font-weight: 600;
          color: var(--error);
          padding: 3px 3px 1px 5px;
        }

        .strength-meter { margin: 5px 2px 7px; }

        .strength-bars {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
          margin-bottom: 3px;
        }

        .strength-bar {
          height: 3px;
          border-radius: 999px;
          background: #dce6e1;
          transition: background-color 0.25s ease;
        }

        .strength-label {
          font-size: 9.5px;
          font-weight: 600;
          color: #698077;
          display: flex;
          justify-content: space-between;
        }

        .email-btn {
          width: 100%;
          height: 44px;
          margin-top: 2px;
          border: none;
          border-radius: 12px;
          background: var(--dark);
          color: #ffffff;
          font-family: inherit;
          font-size: 13.5px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: var(--shadow-cta);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .email-btn:hover:not(:disabled) {
          background: var(--dark-elevated);
          transform: translateY(-0.5px);
          box-shadow: 0 8px 18px -4px rgba(6, 37, 27, 0.25);
        }

        .email-btn:active:not(:disabled) { transform: translateY(0); }
        .email-btn:disabled { opacity: 0.75; cursor: not-allowed; }

        .arrow {
          color: var(--green-bright);
          font-size: 16px;
          line-height: 1;
          transition: transform 0.2s ease;
        }

        .email-btn:hover .arrow { transform: translateX(2px); }

        .demo-btn {
          width: 100%;
          height: 40px;
          margin-top: 6px;
          border: 1px solid #cbe3d8;
          border-radius: 12px;
          background: var(--green-soft);
          color: #0f3a2d;
          font-family: inherit;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          transition: all 0.2s ease;
        }

        .demo-btn span.demo-muted {
          font-weight: 500;
          color: #396456;
        }

        .demo-btn:hover {
          background: var(--green-soft-hover);
          border-color: #b4d6c7;
        }

        .demo-arrow {
          color: var(--green);
          font-size: 14px;
          transition: transform 0.2s ease;
        }

        .demo-btn:hover .demo-arrow { transform: translateX(2px); }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.65s linear infinite;
        }

        .spinner.spinner-dark {
          border-color: rgba(6, 37, 27, 0.2);
          border-top-color: var(--dark);
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* TERMS (ZERO CLUTTER FOOTER) */
        .terms {
          text-align: center;
          margin-top: 7px;
          font-size: 10.5px;
          line-height: 1.4;
          color: #6e827b;
        }

        .terms a {
          color: #2c443c;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 2px;
          cursor: pointer;
        }

        /* MODALS */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(6, 37, 27, 0.62);
          backdrop-filter: blur(6px);
          z-index: 9500;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 14px;
          animation: fadeIn 0.2s ease forwards;
          overflow-y: auto;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .demo-modal,
        .pro-modal {
          width: 100%;
          max-width: 410px;
          background: #ffffff;
          border-radius: 22px;
          border: 1px solid #d4e6de;
          padding: 18px;
          box-shadow: 0 24px 50px rgba(6, 37, 27, 0.3);
          animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          position: relative;
          overflow: hidden;
        }

        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .pro-modal {
          background: linear-gradient(180deg, #eaf7f1 0%, #ffffff 36%);
          border: 1.5px solid #9fd8be;
        }

        .pro-hero-badge {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: linear-gradient(135deg, var(--dark) 0%, #0d4b36 100%);
          color: var(--green-mint);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          margin: 0 auto 8px;
          box-shadow: 0 8px 20px rgba(6, 37, 27, 0.2), 0 0 0 5px rgba(8, 118, 83, 0.1);
          animation: popBadge 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
        }

        @keyframes popBadge {
          from { transform: scale(0.5) rotate(-12deg); opacity: 0; }
          to { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        .founder-spot-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3.5px 10px;
          border-radius: 999px;
          background: var(--dark);
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.3px;
          margin-bottom: 7px;
        }

        .founder-spot-pill span { color: var(--green-mint); }

        .pro-modal-title {
          font-family: "Plus Jakarta Sans", sans-serif;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.6px;
          color: var(--dark);
          line-height: 1.15;
        }

        .pro-modal-sub {
          font-size: 12px;
          color: #3d6356;
          margin-top: 4px;
          line-height: 1.38;
          font-weight: 500;
        }

        .pro-features-grid {
          margin: 12px 0 14px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          text-align: left;
        }

        .pro-feature-card {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 9px 11px;
          border-radius: 12px;
          background: #f5faf7;
          border: 1px solid #d9ebe2;
          transition: transform 0.16s ease;
        }

        .pro-feature-card:hover { transform: translateX(2px); }

        .pf-icon {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          background: var(--green-soft);
          color: var(--green);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
          border: 1px solid rgba(8, 118, 83, 0.15);
        }

        .pf-body { flex: 1; min-width: 0; }
        .pf-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 5px;
        }

        .pf-title {
          font-size: 11.5px;
          font-weight: 800;
          color: var(--dark);
        }

        .pf-tag {
          font-size: 8.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 1.5px 5px;
          border-radius: 99px;
          background: rgba(8, 118, 83, 0.12);
          color: var(--green);
          flex-shrink: 0;
        }

        .pf-desc {
          font-size: 10.5px;
          color: #517065;
          margin-top: 1.5px;
          line-height: 1.3;
        }

        .pro-modal-actions {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .replay-confetti-btn {
          width: 100%;
          height: 36px;
          border-radius: 10px;
          border: 1px solid #cfe4da;
          background: #ffffff;
          color: #214a3c;
          font-family: inherit;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
        }

        .demo-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .demo-modal-title {
          font-family: "Plus Jakarta Sans", sans-serif;
          font-size: 15.5px;
          font-weight: 800;
          color: var(--dark);
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .demo-modal-close {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--dark);
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .demo-habit-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-bottom: 14px;
        }

        .demo-habit-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--bg);
          cursor: pointer;
          user-select: none;
          transition: all 0.16s ease;
        }

        .demo-habit-item.checked {
          background: var(--green-soft);
          border-color: #b7decb;
        }

        .demo-habit-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .demo-checkbox {
          width: 19px;
          height: 19px;
          border-radius: 6px;
          border: 1.8px solid #9ab3a9;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          color: transparent;
          font-size: 11px;
          font-weight: 800;
        }

        .demo-habit-item.checked .demo-checkbox {
          background: var(--green);
          border-color: var(--green);
          color: #ffffff;
        }

        .demo-habit-name {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--dark);
        }

        .demo-habit-streak {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--green);
          background: rgba(8, 118, 83, 0.1);
          padding: 2.5px 7px;
          border-radius: 999px;
        }
      `}</style>

      {/* Confetti Overlay Canvas */}
      <canvas id="confettiCanvas" ref={canvasRef} />

      {/* Floating Toast System */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.type === 'error' ? 'toast-error' : ''} ${t.isOut ? 'toast-out' : ''}`}
          >
            <span className="toast-badge">{t.type === 'error' ? '!' : '✓'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <main className="page">
        {/* ========================================================
             1. HERO SECTION (DUAL-TONE HEATMAP — UNCLUTTERED TOP)
             ======================================================== */}
        <section className="hero" aria-label="D1 Habit Tracker Introduction">
          {/* Top Bar: Brand Pill (Left) + Mix Shades (Right) */}
          <div className="hero-top-bar">
            <div className="brand-pill">
              <span className="brand-logo">D1</span>
              <span className="brand-tag">Habit OS</span>
            </div>

            <button
              type="button"
              className="heatmap-hint"
              onClick={randomizeHeatmap}
              title="Shuffle green completed days & red missed days"
            >
              ✦ Mix Shades
            </button>
          </div>

          <div className="hero-body">
            <div className="hero-copy">
              <h1>
                A habit<br />
                isn’t just a<br />
                <span>checkbox.</span>
              </h1>
              <p>
                It’s a pattern<br />
                of your future.
              </p>

              {/* Dual-Tone Green & Red Shades Legend */}
              <div
                className="shade-legend"
                title="Tap any square in the heatmap to cycle Green & Red shades"
              >
                <span className="legend-group">
                  <span className="legend-swatches">
                    <i className="swatch" style={{ background: '#a7f3d0' }}></i>
                    <i className="swatch" style={{ background: '#34d399' }}></i>
                    <i className="swatch" style={{ background: '#10b981' }}></i>
                    <i className="swatch" style={{ background: '#067652' }}></i>
                  </span>
                  Done
                </span>
                <span className="legend-group">
                  <span className="legend-swatches">
                    <i className="swatch" style={{ background: '#fecdd3' }}></i>
                    <i className="swatch" style={{ background: '#fb7185' }}></i>
                    <i className="swatch" style={{ background: '#e11d48' }}></i>
                  </span>
                  Missed
                </span>
              </div>
            </div>

            {/* INTERACTIVE 7x6 DUAL-TONE HABIT HEATMAP */}
            <div className="heatmap-wrap">
              <div
                className="heatmap"
                role="group"
                aria-label="Interactive habit consistency heatmap with green and red shades"
              >
                {heatShades.map((shadeCode, idx) => (
                  <div
                    key={idx}
                    className={`heat ${shadeCode}`}
                    onClick={() => handleHeatCellClick(idx)}
                    title={`Day ${idx + 1}: ${SHADE_LABELS[shadeCode]} (Tap to change shade)`}
                  />
                ))}
              </div>
              <div className="streak-pill">
                <span className="stat-green">● {greenCount} Done</span>
                <span>·</span>
                <span className="stat-red">● {redCount} Miss</span>
                <span className="stat-score">{consistencyScore}%</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
             2. EARLY ACCESS BANNER
             ======================================================== */}
        <section className="offer" aria-label="Early Access Offer">
          <div className="offer-content">
            <div className="offer-label-row">
              <span className="live-dot" aria-hidden="true"></span>
              <span className="offer-label">Early Access</span>
            </div>

            <div className="offer-title">
              First 100 users get <span>Pro membership free</span>
            </div>

            <div className="offer-meta">
              <div className="offer-progress-bar" aria-hidden="true">
                <div
                  className="offer-progress-fill"
                  style={{ width: `${(claimedUsers / TOTAL_FOUNDER_SPOTS) * 100}%` }}
                ></div>
              </div>
              <div className="offer-sub">Full Pro access · Limited early spots</div>
            </div>
          </div>

          <div className="spots" aria-live="polite">
            <strong className={bumpSpots ? 'bump' : ''}>{remainingSpots}</strong>
            <small>spots left</small>
          </div>
        </section>

        {/* ========================================================
             3. AUTHENTICATION SECTION
             ======================================================== */}
        <section className="auth-section" aria-label="Authentication Form">
          {/* Mode Switcher Tabs */}
          <div className="mode-tabs" role="tablist" aria-label="Authentication Mode">
            <button
              type="button"
              className={`mode-tab ${authMode === 'signin' ? 'active' : ''}`}
              role="tab"
              aria-selected={authMode === 'signin'}
              onClick={() => {
                setAuthMode('signin');
                setFieldErrors({});
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`mode-tab ${authMode === 'signup' ? 'active' : ''}`}
              role="tab"
              aria-selected={authMode === 'signup'}
              onClick={() => {
                setAuthMode('signup');
                setFieldErrors({});
              }}
            >
              Create Account
            </button>
          </div>

          {/* GOOGLE LOGIN BUTTON */}
          <button
            className="google-btn"
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
          >
            {loading ? (
              <span className="spinner spinner-dark"></span>
            ) : (
              <>
                <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M21.35 12.27c0-.79-.07-1.55-.23-2.27H12v4.3h5.23a4.47 4.47 0 0 1-1.94 2.93v2.45h3.14c1.84-1.7 2.92-4.2 2.92-7.41z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 21.99c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.99z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M6.54 14.07A5.86 5.86 0 0 1 6.23 12c0-.72.12-1.42.31-2.07V7.4H3.3A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.6l3.24-2.53z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.9c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 2.95 14.63 2 12 2a9.74 9.74 0 0 0-8.7 5.4l3.24 2.53C7.31 7.62 9.46 5.9 12 5.9z"
                  />
                </svg>
                <span>
                  {authMode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
                </span>
              </>
            )}
          </button>

          {/* DIVIDER */}
          <div className="divider">OR</div>

          {/* EMAIL FORM */}
          <form onSubmit={handleEmailSubmit} noValidate>
            {/* NAME INPUTS (in signup mode) */}
            {authMode === 'signup' && (
              <div className="grid grid-cols-2 gap-2 mb-2 animate-in fade-in duration-150">
                <div className="input">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="input">
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* EMAIL INPUT */}
            <div className="field-group">
              <div className={`input ${fieldErrors.email ? 'input-error' : ''}`}>
                <svg className="input-icon" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="1.8" />
                  <path d="m4 7 8 6 8-6" strokeWidth="1.8" />
                </svg>
                <input
                  type="email"
                  placeholder="Email address"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError('email');
                  }}
                />
              </div>
              {fieldErrors.email && (
                <div className="field-error-msg">{fieldErrors.email}</div>
              )}
            </div>

            {/* PASSWORD INPUT (Hidden in reset mode) */}
            {authMode !== 'reset' && (
              <div className="field-group">
                <div className={`input ${fieldErrors.password ? 'input-error' : ''}`}>
                  <svg className="input-icon" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="5" y="10" width="14" height="10" rx="2" strokeWidth="1.8" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeWidth="1.8" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={authMode === 'signup' ? 'Create a password (8+ chars)' : 'Password'}
                    autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError('password');
                      if (authMode === 'signup') {
                        calculatePasswordStrength(e.target.value);
                      }
                    }}
                  />
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      className="forgot-inline-btn"
                      onClick={() => setAuthMode('reset')}
                      title="Reset your password"
                    >
                      Forgot?
                    </button>
                  )}
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <svg fill="none" viewBox="0 0 24 24">
                        <path
                          d="M3 3l18 18M10.58 10.58a2 2 0 0 0 2.83 2.83M9.36 5.37A9.46 9.46 0 0 1 12 5c6 0 9.5 7 9.5 7a16.8 16.8 0 0 1-3.19 4.19M6.61 6.61C4.22 8.23 2.5 12 2.5 12a16.84 16.84 0 0 0 9.5 7 9.65 9.65 0 0 0 4.05-.88"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <svg fill="none" viewBox="0 0 24 24">
                        <path
                          d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6Z"
                          strokeWidth="1.8"
                        />
                        <circle cx="12" cy="12" r="2.5" strokeWidth="1.8" />
                      </svg>
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <div className="field-error-msg">{fieldErrors.password}</div>
                )}

                {/* PASSWORD STRENGTH INDICATOR (in signup mode) */}
                {authMode === 'signup' && (
                  <div className="strength-meter">
                    <div className="strength-bars">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="strength-bar"
                          style={{
                            backgroundColor: i <= passStrength ? strengthColors[passStrength] : '#dce6e1'
                          }}
                        ></div>
                      ))}
                    </div>
                    <div className="strength-label">
                      <span>{strengthLabels[passStrength]}</span>
                      <span style={{ color: '#087653', fontWeight: 700 }}>Free Pro spot reserved</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUBMIT CTA */}
            <button className="email-btn" type="submit" disabled={loading}>
              {loading ? (
                <span className="spinner"></span>
              ) : (
                <>
                  <span>
                    {authMode === 'signin' && 'Continue with Email'}
                    {authMode === 'signup' && 'Claim Free Pro & Sign Up'}
                    {authMode === 'reset' && 'Send Password Reset Link'}
                  </span>
                  <span className="arrow">→</span>
                </>
              )}
            </button>
          </form>

          {/* EXPLORE DEMO BUTTON */}
          <button
            className="demo-btn"
            type="button"
            onClick={() => setIsDemoModalOpen(true)}
          >
            <span>Explore Demo</span>
            <span className="demo-muted">— No Sign-up Needed</span>
            <span className="demo-arrow">→</span>
          </button>
        </section>

        {/* TERMS & PRIVACY (NO REDUNDANT ACCOUNT SWITCH TEXT) */}
        <div className="terms">
          By continuing, you agree to our{' '}
          <a onClick={() => navigate('/privacy')}>Privacy Policy</a>
          {' '}and{' '}
          <a onClick={() => navigate('/terms')}>Terms of Service</a>.
        </div>
      </main>

      {/* ========================================================
           MODAL 1: PRO UNLOCKED CELEBRATION MODAL
           ======================================================== */}
      {isProModalOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsProModalOpen(false);
          }}
        >
          <div className="pro-modal" style={{ textAlign: 'center' }}>
            <button
              type="button"
              className="demo-modal-close"
              style={{ position: 'absolute', top: 14, right: 14 }}
              onClick={() => setIsProModalOpen(false)}
              aria-label="Close celebration modal"
            >
              ✕
            </button>

            <div className="pro-hero-badge" aria-hidden="true">👑</div>

            <div className="founder-spot-pill">
              FOUNDER PASS <span>#{proModalData.spotNumber} / {TOTAL_FOUNDER_SPOTS}</span> · <span>$0 FOREVER</span>
            </div>

            <h2 className="pro-modal-title">
              Congratulations!<br />D1 Pro is Unlocked 🎉
            </h2>

            <p className="pro-modal-sub">
              Welcome to D1, <strong>{proModalData.name}</strong>! You made it into the first 100 users—your account has been upgraded to <strong>Lifetime Pro</strong>.
            </p>

            {/* Showcase of Unlocked Pro Features */}
            <div className="pro-features-grid">
              <div className="pro-feature-card">
                <div className="pf-icon">🟩</div>
                <div className="pf-body">
                  <div className="pf-title-row">
                    <span className="pf-title">Dual-Shade Green &amp; Red Heatmaps</span>
                    <span className="pf-tag">PRO UNLOCKED</span>
                  </div>
                  <p className="pf-desc">
                    Track unlimited habits with 4 emerald intensity levels &amp; 3 red miss-diagnostics.
                  </p>
                </div>
              </div>

              <div className="pro-feature-card">
                <div className="pf-icon">🧠</div>
                <div className="pf-body">
                  <div className="pf-title-row">
                    <span className="pf-title">AI Red-Zone Slip Predictor</span>
                    <span className="pf-tag">PRO UNLOCKED</span>
                  </div>
                  <p className="pf-desc">
                    Detects weak days and alerts you before a red streak-break happens.
                  </p>
                </div>
              </div>

              <div className="pro-feature-card">
                <div className="pf-icon">🛡️</div>
                <div className="pf-body">
                  <div className="pf-title-row">
                    <span className="pf-title">Streak Freeze &amp; Recovery Shields</span>
                    <span className="pf-tag">3 / MONTH</span>
                  </div>
                  <p className="pf-desc">
                    Protect your hard-earned habit chain during travel, exams, or sick days.
                  </p>
                </div>
              </div>

              <div className="pro-feature-card">
                <div className="pf-icon">⚡</div>
                <div className="pf-body">
                  <div className="pf-title-row">
                    <span className="pf-title">Cloud Sync &amp; Deep Analytics Export</span>
                    <span className="pf-tag">UNLIMITED</span>
                  </div>
                  <p className="pf-desc">
                    Instant real-time sync across mobile &amp; desktop with CSV/PDF habit reports.
                  </p>
                </div>
              </div>
            </div>

            <div className="pro-modal-actions">
              <button
                className="email-btn"
                type="button"
                onClick={continueToProDashboard}
              >
                <span>Launch D1 Pro Dashboard</span>
                <span className="arrow">→</span>
              </button>
              <button
                className="replay-confetti-btn"
                type="button"
                onClick={launchConfettiBurst}
              >
                🎉 Replay Confetti Celebration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
           MODAL 2: INTERACTIVE DEMO SANDBOX MODAL
           ======================================================== */}
      {isDemoModalOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDemoModalOpen(false);
          }}
        >
          <div className="demo-modal">
            <div className="demo-modal-header">
              <div className="demo-modal-title">
                <span className="brand-logo">D1</span>
                Live Habit OS Sandbox
              </div>
              <button
                type="button"
                className="demo-modal-close"
                onClick={() => setIsDemoModalOpen(false)}
                aria-label="Close demo preview"
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: 12, color: '#4d675e', marginBottom: 10, lineHeight: 1.4 }}>
              Tap any habit below to see how D1 updates your live dual-shade consistency heatmap:
            </p>

            <div className="demo-habit-list">
              {demoHabits.map((habit) => (
                <div
                  key={habit.id}
                  className={`demo-habit-item ${habit.checked ? 'checked' : ''}`}
                  onClick={() => toggleDemoHabit(habit.id)}
                >
                  <div className="demo-habit-left">
                    <div className="demo-checkbox">{habit.checked ? '✓' : ''}</div>
                    <span className="demo-habit-name">{habit.name}</span>
                  </div>
                  <span className="demo-habit-streak">{habit.streak}</span>
                </div>
              ))}
            </div>

            <button
              className="email-btn"
              type="button"
              onClick={launchFullDemo}
            >
              <span>Enter Full Demo Workspace</span>
              <span className="arrow">→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
