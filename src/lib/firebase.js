import { initializeApp } from "firebase/app";
import { initializeAuth, browserLocalPersistence, browserPopupRedirectResolver, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBl9DfgHBCqykkR8WPNIuKZCZ7UQIzM4ho",
  authDomain: "d1.thedefinite.one",
  projectId: "d1-core",
  storageBucket: "d1-core.firebasestorage.app",
  messagingSenderId: "223282254697",
  appId: "1:223282254697:web:7d4b0f1bc0bf18049723f8",
  measurementId: "G-V62TNVP485"
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver
});
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
