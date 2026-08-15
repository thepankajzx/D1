import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDocs, collection, Timestamp } from "firebase/firestore";

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
const auth = getAuth(app);
const db = getFirestore(app);

const email = "dummytest45_v3@example.com";
const password = "password123";

async function seed() {
  try {
    console.log("Creating user...");
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;
    console.log("User created with UID:", uid);

    console.log("Fetching habit library...");
    const librarySnap = await getDocs(collection(db, "habitLibrary"));
    const allHabits = [];
    librarySnap.forEach(doc => allHabits.push(doc.data()));
    
    // Select 8 habits
    const selectedHabitsDocs = allHabits.slice(0, 8);
    const selectedHabits = selectedHabitsDocs.map(h => h.id);
    console.log("Selected 8 habits:", selectedHabits);

    // Create user doc
    await setDoc(doc(db, "users", uid), {
      email,
      name: "Dummy Test User",
      createdAt: Timestamp.now(),
      selectedHabits,
      onboardingComplete: true
    });
    console.log("User document created.");

    const userHabitsRef = collection(db, "users", uid, "habits");
    for (const h of selectedHabitsDocs) {
      await setDoc(doc(userHabitsRef, h.id), h);
    }
    console.log("User habits subcollection populated.");

    // Generate 45 days of data
    console.log("Generating 45 days of entries...");
    const today = new Date();
    today.setHours(0,0,0,0);

    for (let i = 0; i < 45; i++) {
      const entryDate = new Date(today);
      entryDate.setDate(today.getDate() - i);
      
      const yyyy = entryDate.getFullYear();
      const mm = String(entryDate.getMonth() + 1).padStart(2, '0');
      const dd = String(entryDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      const habitScores = {};
      const habitData = {};
      
      const batchPromises = [];

      selectedHabits.forEach(hId => {
        // Random score between 0 and 100
        const score = Math.floor(Math.random() * 101);
        habitScores[hId] = score;
        habitData[hId] = { action: 1 }; 
        
        // create entry doc
        const entryDocId = `${dateStr}_${hId}`;
        batchPromises.push(
          setDoc(doc(db, "users", uid, "entries", entryDocId), {
            uid,
            habitId: hId,
            entryDate: dateStr,
            computedScore: score,
            action: 1,
            timestamp: Timestamp.fromDate(entryDate)
          })
        );
      });

      const totalScore = Object.values(habitScores).reduce((a, b) => a + b, 0);
      const overallScore = Math.round(totalScore / selectedHabits.length);

      batchPromises.push(
        setDoc(doc(db, "users", uid, "dailySummaries", dateStr), {
          uid,
          date: dateStr,
          overallScore,
          habitScores,
          habitData,
          timestamp: Timestamp.fromDate(entryDate)
        })
      );
      
      await Promise.all(batchPromises);
    }

    console.log("Successfully generated 45 days of data!");
    console.log("Email:", email);
    console.log("Password:", password);
    process.exit(0);

  } catch (error) {
    console.error("Error seeding:", error);
    process.exit(1);
  }
}

seed();
