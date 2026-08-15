import { initializeApp } from "firebase/app";
import { initializeAuth, browserLocalPersistence, browserPopupRedirectResolver, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCbnlNA0Sw91yArHWLJdk892ZPIVn-RX7I",
  authDomain: "d2-01-0001.firebaseapp.com",
  projectId: "d2-01-0001",
  storageBucket: "d2-01-0001.firebasestorage.app",
  messagingSenderId: "404376718009",
  appId: "1:404376718009:web:8bc13011ffd9b2a6582968",
  measurementId: "G-FDED9Q441P"
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver
});
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
