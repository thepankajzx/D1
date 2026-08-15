import Icon from '../components/Icon';
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authTimeout, setAuthTimeout] = useState(false);

  useEffect(() => {
    // If Firebase takes unusually long to initialize, show the error boundary
    const timer = setTimeout(() => {
      setAuthTimeout(true);
    }, 15000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
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

  function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  }

  function logout() {
    return signOut(auth);
  }

  const value = {
    currentUser,
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
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <div className="flex flex-col items-center gap-4">
            <Icon name="sync" className=" animate-spin text-4xl text-primary" />
            <span className="font-label-md text-on-surface-variant">Loading Definite...</span>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
