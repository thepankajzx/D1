import { doc, getDoc, getDocs, setDoc, updateDoc, collection, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';

/**
 * Creates or updates a Core X Config document.
 */
export async function saveCoreXConfig(uid, cxId, configData) {
  if (!uid || !cxId) throw new Error("Missing uid or cxId");
  const docRef = doc(db, `users/${uid}/corex`, cxId);
  
  // Set merge: true so we don't accidentally blow away fields added later
  await setDoc(docRef, {
    ...configData,
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

/**
 * Fetches all Core X configs for a user.
 */
export async function getCoreXConfigs(uid) {
  if (!uid) return [];
  const colRef = collection(db, `users/${uid}/corex`);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Saves a daily log for a specific Core X.
 */
export async function saveCoreXLog(uid, cxId, dateStr, logData) {
  if (!uid || !cxId || !dateStr) throw new Error("Missing params for saveCoreXLog");
  const docRef = doc(db, `users/${uid}/corex/${cxId}/logs`, dateStr);
  
  await setDoc(docRef, {
    ...logData,
    date: dateStr,
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

/**
 * Fetches logs for a given Core X config.
 * (In a real scenario, we might want date range filtering, but for now we fetch all since users have at most 1-2 years of data = ~365-700 docs, which is small).
 */
export async function getCoreXLogs(uid, cxId) {
  if (!uid || !cxId) return [];
  const colRef = collection(db, `users/${uid}/corex/${cxId}/logs`);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
