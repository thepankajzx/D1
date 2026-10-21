import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDocs, collection, Timestamp, writeBatch } from "firebase/firestore";

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

const email = "dummytest2025@example.com";
const password = "password123";

async function seed() {
  try {
    let uid;
    try {
      console.log(`Attempting to sign in existing user ${email}...`);
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      uid = userCred.user.uid;
      console.log("Logged in existing user with UID:", uid);
    } catch (err) {
      console.log("User does not exist or password mismatch. Creating user...");
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      uid = userCred.user.uid;
      console.log("User created with UID:", uid);
    }

    console.log("Fetching habit library...");
    const librarySnap = await getDocs(collection(db, "habitLibrary"));
    const allHabits = [];
    librarySnap.forEach(d => allHabits.push({ id: d.id, ...d.data() }));

    const userHabitsSnap = await getDocs(collection(db, "users", uid, "habits"));
    let selectedHabitsDocs = [];
    if (!userHabitsSnap.empty) {
      userHabitsSnap.forEach(d => selectedHabitsDocs.push({ id: d.id, ...d.data() }));
    } else if (allHabits.length > 0) {
      selectedHabitsDocs = allHabits.slice(0, 6);
    } else {
      selectedHabitsDocs = [
        { id: "habit_running", name: "Running / Cardio", color: "#10b981", icon: "Running", unit: "km", target: 5 },
        { id: "habit_reading", name: "Deep Reading", color: "#3b82f6", icon: "BookOpen", unit: "pages", target: 20 },
        { id: "habit_meditation", name: "Mindfulness Meditation", color: "#8b5cf6", icon: "Sparkle", unit: "mins", target: 15 },
        { id: "habit_water", name: "Hydration Intake", color: "#06b6d4", icon: "Drop", unit: "litres", target: 3 },
        { id: "habit_sleep", name: "8h Quality Sleep", color: "#6366f1", icon: "Moon", unit: "hours", target: 8 }
      ];
    }

    const selectedHabits = selectedHabitsDocs.map(h => h.id);
    console.log(`Configured ${selectedHabits.length} habits for user.`);

    // Save user doc
    await setDoc(doc(db, "users", uid), {
      email,
      name: "Dummy Test User (3-Month Ramp)",
      createdAt: Timestamp.now(),
      selectedHabits,
      onboardingComplete: true
    }, { merge: true });

    // Save habits subcollection
    const userHabitsRef = collection(db, "users", uid, "habits");
    for (const h of selectedHabitsDocs) {
      await setDoc(doc(userHabitsRef, h.id), h, { merge: true });
    }

    // ── Generate 90 Days of Data (~3 Months) with writeBatch ────────────────
    const totalDays = 90;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`Generating ${totalDays} days of 3-phase progression data using writeBatch...`);

    let currentBatch = writeBatch(db);
    let batchCount = 0;
    const commitBatchIfNeeded = async () => {
      if (batchCount >= 400) {
        await currentBatch.commit();
        currentBatch = writeBatch(db);
        batchCount = 0;
      }
    };

    for (let i = totalDays - 1; i >= 0; i--) {
      const entryDate = new Date(today);
      entryDate.setDate(today.getDate() - i);

      const yyyy = entryDate.getFullYear();
      const mm = String(entryDate.getMonth() + 1).padStart(2, '0');
      const dd = String(entryDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      // 3-Phase Progression Logic:
      // Phase 1 (First 1.5 months / daysAgo >= 45): 0 - 40%
      // Phase 2 (Next 0.5 months / 30 <= daysAgo < 45): 40 - 60%
      // Phase 3 (Remaining 1 month / daysAgo < 30): 60 - 95%
      let minScore, maxScore;
      if (i >= 45) {
        minScore = 5;
        maxScore = 38;
      } else if (i >= 30) {
        minScore = 42;
        maxScore = 58;
      } else {
        minScore = 68;
        maxScore = 95;
      }

      const habitScores = {};
      const habitData = {};

      for (let idx = 0; idx < selectedHabitsDocs.length; idx++) {
        const h = selectedHabitsDocs[idx];
        let score;
        if (idx === 0) {
          score = Math.floor(minScore + Math.random() * (maxScore - minScore + 1));
        } else {
          const variation = (Math.random() - 0.5) * 8;
          score = Math.max(0, Math.min(100, Math.round(minScore + Math.random() * (maxScore - minScore) + variation)));
        }

        habitScores[h.id] = score;
        habitData[h.id] = { action: score > 0 ? 1 : 0 };

        const entryRef = doc(db, "users", uid, "entries", `${dateStr}_${h.id}`);
        currentBatch.set(entryRef, {
          uid,
          habitId: h.id,
          entryDate: dateStr,
          computedScore: score,
          action: score > 0 ? 1 : 0,
          timestamp: Timestamp.fromDate(entryDate)
        });
        batchCount++;
        await commitBatchIfNeeded();
      }

      const scoresArray = Object.values(habitScores);
      const totalScore = scoresArray.reduce((a, b) => a + b, 0);
      const overallScore = Math.round(totalScore / scoresArray.length);

      const summaryRef = doc(db, "users", uid, "dailySummaries", dateStr);
      currentBatch.set(summaryRef, {
        uid,
        date: dateStr,
        overallScore,
        habitScores,
        habitData,
        timestamp: Timestamp.fromDate(entryDate)
      });
      batchCount++;
      await commitBatchIfNeeded();
    }

    if (batchCount > 0) {
      await currentBatch.commit();
    }

    console.log(`\n======================================================`);
    console.log(`✅ SUCCESS! Generated 90 days (3 months) of dummy data!`);
    console.log(`👤 User Email:    ${email}`);
    console.log(`🔑 User Password: ${password}`);
    console.log(`📊 3-Stage Ramp Breakdown:`);
    console.log(`   • Phase 1 (~45 days): 0 - 40% (Initial struggle)`);
    console.log(`   • Phase 2 (~15 days): 40 - 60% (Momentum building)`);
    console.log(`   • Phase 3 (~30 days): 60 - 95% (High consistency)`);
    console.log(`======================================================\n`);
    process.exit(0);

  } catch (error) {
    console.error("Error creating 3-month dummy data:", error);
    process.exit(1);
  }
}

seed();
