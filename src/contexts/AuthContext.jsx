import Icon from '../components/Icon';
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { sendNewCustomerAlert } from '../services/customerAlertService';

export { sendNewCustomerAlert };

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  // Offline-first instant session restoration from local cache
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const cached = localStorage.getItem('d1_cached_user');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('d1_cached_user');
      return !cached;
    } catch (e) {
      return true;
    }
  });

  const [authTimeout, setAuthTimeout] = useState(false);

  useEffect(() => {
    // If Firebase takes unusually long to initialize, show the error boundary
    const timer = setTimeout(() => {
      if (!localStorage.getItem('d1_cached_user')) {
        setAuthTimeout(true);
      }
    }, 15000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          localStorage.setItem('d1_cached_user', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          }));
        } catch (e) {}
      } else {
        // Only clear cached user if explicitly signed out or online
        if (navigator.onLine) {
          setCurrentUser(null);
          try {
            localStorage.removeItem('d1_cached_user');
          } catch (e) {}
        }
      }
      setLoading(false);
      clearTimeout(timer);
    });

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await FirebaseAuthentication.signInWithGoogle({
          skipNativeAuth: true
        });
        const idToken = result?.credential?.idToken || result?.idToken;
        if (idToken) {
          const credential = GoogleAuthProvider.credential(idToken);
          return await signInWithCredential(auth, credential);
        }
        if (result?.user) {
          return result;
        }
        return result;
      } catch (nativeErr) {
        console.error("Native Google Auth failed:", nativeErr);
        throw nativeErr;
      }
    }
    return signInWithPopup(auth, googleProvider);
  }

  async function logout() {
    try {
      localStorage.removeItem('d1_cached_user');
      // Cancel scheduled notifications on logout to prevent cross-user leakage
      const { cancelDailyReminder } = await import('../services/notificationService');
      await cancelDailyReminder();
    } catch (_) {}
    if (Capacitor.isNativePlatform()) {
      try {
        await FirebaseAuthentication.signOut();
      } catch (_) {}
    }
    return signOut(auth);
  }

  const value = {
    currentUser,
    loading,
    login,
    signup,
    loginWithGoogle,
    logout
  };

  if (authTimeout && loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-surface text-center">
        <Icon name="error" className=" text-4xl text-error mb-4" />
        <h2 className="font-headline-md text-error mb-2">Authentication Error</h2>
        <p className="font-body-md text-on-surface-variant max-w-md mb-6">
          The app is taking longer than expected to connect to the authentication database. This usually happens on slow networks.
        </p>
        <button 
          onClick={() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
          }}
          className="bg-primary text-on-primary px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
        >
          Clear Data & Reload
        </button>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen bg-background" />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
