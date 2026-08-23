import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { setPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser, login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      // Try to log in first. If it fails due to user not found, try to sign up.
      let userCred;
      try {
        userCred = await login(email, password);
      } catch (loginError) {
        // Firebase auth now uses auth/invalid-credential for both wrong password and user-not-found
        if (loginError.code === 'auth/invalid-credential') {
          // Attempt signup just in case they are a new user. 
          // If it fails with email-already-in-use, it means they just typed the wrong password.
          try {
            userCred = await signup(email, password);
          } catch (signupError) {
            if (signupError.code === 'auth/email-already-in-use') {
              throw new Error("Invalid email or password.");
            }
            throw signupError;
          }
        } else if (loginError.code === 'auth/user-not-found') {
          userCred = await signup(email, password);
        } else {
          throw loginError;
        }
      }
      // Ensure Firestore user doc exists
      if (userCred?.user) {
        const userRef = doc(db, 'users', userCred.user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, { createdAt: new Date().toISOString(), currentStreak: 0, longestStreak: 0 });
        }
      }
      navigate('/');
    } catch (err) {
      setError('Failed to log in or create account: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setError('');
      setLoading(true);
      const result = await loginWithGoogle();
      // Ensure Firestore user doc exists for Google sign-in
      if (result?.user) {
        const userRef = doc(db, 'users', result.user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, { createdAt: new Date().toISOString(), currentStreak: 0, longestStreak: 0 });
        }
      }
      navigate('/');
    } catch (err) {
      if (err.message.includes('Database is closing') || err.message.includes('hidden')) {
        setError('Database Error: Browser closed the connection. Please click "Continue with Google" again.');
      } else {
        setError('Failed to sign in with Google: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop bg-surface-container-low">
      <div className="w-full max-w-md bg-surface border border-outline-variant rounded-xl p-8 shadow-sm">
        <div className="text-center mb-10">
          <h1 className="font-headline-lg text-headline-lg text-primary mb-2 tracking-tight">Definite</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Consistent habits, intelligent progress.</p>
        </div>
        
        {error && <div className="mb-4 text-error text-center font-body-md text-body-md">{error}</div>}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="sr-only" htmlFor="email">Email address</label>
              <input 
                className="input-minimal placeholder:text-outline" 
                id="email" 
                name="email" 
                placeholder="Email address" 
                required 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="sr-only" htmlFor="password">Password</label>
              <input 
                className="input-minimal placeholder:text-outline" 
                id="password" 
                name="password" 
                placeholder="Password" 
                required 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="pt-2">
            <button className="btn-primary" type="submit" disabled={loading}>
              Continue with Email
            </button>
          </div>
        </form>
        
        <div className="mt-8 flex items-center gap-4">
          <div className="h-px bg-outline-variant flex-1"></div>
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">or</span>
          <div className="h-px bg-outline-variant flex-1"></div>
        </div>
        
        <div className="mt-8">
          <button className="btn-outline" type="button" onClick={handleGoogleSignIn} disabled={loading}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* 1-Tap Fresh Account for Testing on Mobile */}
        <div className="mt-4 pt-4 border-t border-outline-variant/30 text-center">
          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              try {
                setLoading(true);
                setError('');
                const randId = Math.floor(1000 + Math.random() * 9000);
                const testEmail = `user_fresh_${randId}@test.com`;
                const testPass = '123456';
                const userCred = await signup(testEmail, testPass);
                if (userCred?.user) {
                  const userRef = doc(db, 'users', userCred.user.uid);
                  await setDoc(userRef, { createdAt: new Date().toISOString(), currentStreak: 0, longestStreak: 0 });
                }
                navigate('/onboarding/welcome');
              } catch (e) {
                setError('Failed to create test user: ' + e.message);
              } finally {
                setLoading(false);
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border border-primary/20"
          >
            <span>⚡ Create Fresh Test Account (1-Tap)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
