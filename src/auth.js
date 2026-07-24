import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

export async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
        return userCredential.user;
    } catch (error) {
        if (error.code === 'auth/unauthorized-domain') {
            throw new Error("Domain Whitelist Error: कृपया Firebase Console में Authentication > Settings > Authorized Domains में जाकर 'thepankajzx.github.io' ऐड करें।");
        } else if (error.code === 'auth/invalid-credential') {
            throw new Error("Incorrect Email or Password (पासवर्ड या ईमेल गलत है)");
        } else {
            throw error;
        }
    }
}

export function logout() {
    return signOut(auth);
}

export function onAuthChange(callback) {
    onAuthStateChanged(auth, callback);
}
