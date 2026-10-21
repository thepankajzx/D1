import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

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
const db = getFirestore(app);

const uid = "yGEyzR9SXcWZJ68TBvpSgysFPuk1";

async function run() {
  console.log("=== USER HABITS ===");
  const habitsSnap = await getDocs(collection(db, "users", uid, "habits"));
  habitsSnap.forEach(d => {
    console.log(d.id, "=>", d.data());
  });

  console.log("\n=== RECENT SUMMARIES ===");
  const sumsSnap = await getDocs(collection(db, "users", uid, "dailySummaries"));
  const sorted = sumsSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.id.localeCompare(a.id)).slice(0, 5);
  console.log(JSON.stringify(sorted, null, 2));

  process.exit(0);
}

run().catch(console.error);

