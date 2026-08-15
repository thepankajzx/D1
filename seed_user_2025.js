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

const email = "dummytest2025@example.com";
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

    // Generate 365 days of data for 2025
    console.log("Generating 365 days of entries for 2025...");
    
    const startDate = new Date(2025, 0, 1); // Jan 1, 2025
    const endDate = new Date(2025, 11, 31); // Dec 31, 2025

    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const entryDate = new Date(currentDate);
      
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
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log("Successfully generated 365 days of data for 2025!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    process.exit(0);

  } catch (error) {
    console.error("Error seeding:", error);
    process.exit(1);
  }
}

seed();
