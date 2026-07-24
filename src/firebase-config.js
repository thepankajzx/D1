// Import Firebase from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDmV8kDK7YZk-lxPwwDG2drrjybylwenWE",
  authDomain: "fci-lms.firebaseapp.com",
  projectId: "fci-lms",
  storageBucket: "fci-lms.firebasestorage.app",
  messagingSenderId: "180801083177",
  appId: "1:180801083177:web:3a9c3b02728749d2420938",
  measurementId: "G-RL1BM5X372"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// Optional: Initialize analytics if needed
// export const analytics = getAnalytics(app);
