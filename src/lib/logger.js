import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function logErrorToDb(error, errorInfo) {
  try {
    const user = auth.currentUser;
    await addDoc(collection(db, 'system_errors'), {
      errorMessage: error?.message || error?.toString() || 'Unknown Error',
      stackTrace: error?.stack || '',
      componentStack: errorInfo?.componentStack || '',
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: user?.uid || 'unauthenticated',
      timestamp: serverTimestamp(),
      resolved: false
    });
  } catch (e) {
    // If logging fails, fall back to console so we don't crash the error handler itself
    console.error('Failed to log error to database:', e);
  }
}
