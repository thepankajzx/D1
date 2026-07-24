import { db } from "./firebase-config.js";
import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Save user settings (targets)
export async function saveSettings(uid, settings) {
    const docRef = doc(db, "users", uid, "settings", "profile");
    await setDoc(docRef, settings, { merge: true });
}

// Get user settings
export async function getSettings(uid) {
    const docRef = doc(db, "users", uid, "settings", "profile");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        return snap.data();
    }
    // Default settings if none exist
    return {
        wakeTarget: "08:00",
        sleepTarget: "23:00",
        studyTargetMins: 240, // 4 hours
        musicMaxMins: 120 // 2 hours
    };
}

// Save daily record
export async function saveRecord(uid, dateStr, recordData) {
    const docRef = doc(db, "users", uid, "records", dateStr);
    await setDoc(docRef, recordData);
}

// Get single daily record
export async function getRecord(uid, dateStr) {
    const docRef = doc(db, "users", uid, "records", dateStr);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        return snap.data();
    }
    return null;
}

// Fetch records between dates (YYYY-MM-DD format strings work well for string comparison)
export async function getRecordsByDateRange(uid, startDate, endDate) {
    const recordsRef = collection(db, "users", uid, "records");
    const q = query(
        recordsRef,
        where("date", ">=", startDate),
        where("date", "<=", endDate),
        orderBy("date", "asc")
    );
    const querySnapshot = await getDocs(q);
    const records = [];
    querySnapshot.forEach((doc) => {
        records.push(doc.data());
    });
    return records;
}

// Fetch all records
export async function getAllRecords(uid) {
    const recordsRef = collection(db, "users", uid, "records");
    const q = query(recordsRef, orderBy("date", "asc"));
    const querySnapshot = await getDocs(q);
    const records = [];
    querySnapshot.forEach((doc) => {
        records.push(doc.data());
    });
    return records;
}
