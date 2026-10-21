import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

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
const auth = getAuth(app);
const db = getFirestore(app);

const email = "freshuser2025@example.com";
const password = "password123";

async function createFreshUser() {
  try {
    let uid;
    try {
      console.log(`Checking if ${email} already exists...`);
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      uid = userCred.user.uid;
      console.log("Logged in existing user with UID:", uid);
    } catch (err) {
      console.log("Creating new user account...");
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      uid = userCred.user.uid;
      console.log("New user created with UID:", uid);
    }

    // Clear any previous summaries or entries to ensure 100% fresh start
    const entriesSnap = await getDocs(collection(db, "users", uid, "entries"));
    for (const d of entriesSnap.docs) {
      await deleteDoc(d.ref);
    }

    const summariesSnap = await getDocs(collection(db, "users", uid, "dailySummaries"));
    for (const d of summariesSnap.docs) {
      await deleteDoc(d.ref);
    }

    const habitsSnap = await getDocs(collection(db, "users", uid, "habits"));
    for (const d of habitsSnap.docs) {
      await deleteDoc(d.ref);
    }

    // Reset user doc to fresh onboarding state so user can choose habits themselves
    await setDoc(doc(db, "users", uid), {
      email,
      name: "Fresh Tester (Day 1)",
      createdAt: new Date().toISOString(),
      onboardingComplete: false,
      selectedHabits: [],
      tier: "free"
    });

    // Reset treeData doc to 0 pts Seed
    await setDoc(doc(db, "users", uid, "treeData", "main"), {
      userId: uid,
      growthScore: 0,
      habitGrowthScore: 0,
      waterBonusPoints: 0,
      currentStage: "seed",
      totalHabitsDone: 0,
      totalDaysActive: 0,
      waterStreak: 0,
      lastWateredAt: null,
      unlockedFeatures: [],
      updatedAt: new Date().toISOString()
    });

    console.log(`\n======================================================`);
    console.log(`✅ SUCCESS! Fresh clean account ready for self-onboarding!`);
    console.log(`👤 Email:    ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🌱 State:    Day 0 Fresh Seed (0 habits, 0 days, 0 points)`);
    console.log(`🎯 Next:     Log in & pick your habits from scratch!`);
    console.log(`======================================================\n`);
    process.exit(0);
  } catch (error) {
    console.error("Error creating fresh user:", error);
    process.exit(1);
  }
}

createFreshUser();
