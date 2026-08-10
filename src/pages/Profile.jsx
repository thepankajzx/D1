import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';

export default function Profile() {
  const { currentUser, logout } = useAuth();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Example preferences state
  const [theme, setTheme] = useState('Light');

  useEffect(() => {
    async function fetchHabits() {
      if (!currentUser) return;
      try {
        const q = query(collection(db, 'users', currentUser.uid, 'habits'));
        const querySnapshot = await getDocs(q);
        const loadedHabits = [];
        querySnapshot.forEach((docSnap) => {
          loadedHabits.push({ id: docSnap.id, ...docSnap.data() });
        });
        setHabits(loadedHabits);
      } catch (error) {
        console.error("Error fetching habits for profile:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchHabits();
  }, [currentUser]);

  const handleDeleteHabit = async (habitId) => {
    if (!window.confirm("Are you sure you want to remove this habit?")) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'habits', habitId));
      setHabits(habits.filter(h => h.id !== habitId));
    } catch (error) {
      console.error("Error deleting habit:", error);
      alert("Failed to delete habit.");
    }
  };

  const togglePriority = async (habitId, currentPriority) => {
    const newPriority = currentPriority === 'high' ? 'medium' : 'high';
    try {
      await updateDoc(doc(db, 'users', currentUser.uid, 'habits', habitId), {
        priority: newPriority
      });
      setHabits(habits.map(h => h.id === habitId ? { ...h, priority: newPriority } : h));
    } catch (error) {
      console.error("Error updating priority:", error);
    }
  };

  return (
    <div className="bg-background text-on-background antialiased min-h-screen flex flex-col pt-16">
      {/* TopNavBar */}
      <nav className="bg-surface border-b border-outline-variant fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 max-w-container-max-width mx-auto">
        <div className="flex items-center gap-8">
          <span className="font-headline-md text-headline-md font-bold text-primary">Definite</span>
          <div className="hidden md:flex gap-6">
            <a className="text-on-surface-variant hover:opacity-80 transition-opacity font-body-md text-body-md" href="#/dashboard">Dashboard</a>
            <a className="text-on-surface-variant hover:opacity-80 transition-opacity font-body-md text-body-md" href="#/analytics">Analytics</a>
            <a aria-current="page" className="text-primary border-b-2 border-primary pb-1 hover:opacity-80 transition-opacity font-body-md text-body-md" href="#/profile">Profile</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={logout} className="text-sm font-medium text-error hover:opacity-80">
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-8 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Personal Info & Preferences */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {/* Personal Info Card */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 flex flex-col gap-6">
            <h2 className="font-headline-md text-headline-md text-on-surface">Personal Info</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Email</label>
                <input 
                  disabled
                  className="w-full bg-transparent border-b border-outline-variant px-0 py-2 font-body-md text-body-md text-on-surface opacity-70 cursor-not-allowed" 
                  type="email" 
                  value={currentUser?.email || ''} 
                />
              </div>
            </div>
          </section>

          {/* Preferences Card */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 flex flex-col gap-6">
            <h2 className="font-headline-md text-headline-md text-on-surface">Preferences</h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-body-md text-body-md text-on-surface">Theme</span>
                <div className="flex bg-surface-container-low rounded-full p-1">
                  <button 
                    onClick={() => setTheme('Light')}
                    className={`px-4 py-1 rounded-full font-label-sm text-label-sm transition-colors ${theme === 'Light' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                  >
                    Light
                  </button>
                  <button 
                    onClick={() => setTheme('Dark')}
                    className={`px-4 py-1 rounded-full font-label-sm text-label-sm transition-colors ${theme === 'Dark' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                  >
                    Dark
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: My Habits */}
        <div className="md:col-span-8 flex flex-col gap-6">
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="font-headline-md text-headline-md text-on-surface">My Habits</h2>
              <a href="#/onboarding/select" className="bg-primary text-on-primary font-label-sm text-label-sm px-4 py-2 rounded flex items-center gap-2 hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined" style={{fontSize: '16px'}}>add</span>
                Add Habit
              </a>
            </div>

            <div className="flex flex-col">
              {loading ? (
                <div className="py-4 text-center text-on-surface-variant">Loading habits...</div>
              ) : habits.length === 0 ? (
                <div className="py-4 text-center text-on-surface-variant">You have no habits tracked.</div>
              ) : (
                habits.map(habit => (
                  <div key={habit.id} className="flex items-center justify-between py-4 border-b border-outline-variant group">
                    <div className="flex items-center gap-4 flex-grow">
                      <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">{habit.icon}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-body-md text-body-md font-semibold text-primary flex items-center gap-2">
                          {habit.name}
                          {habit.priority === 'high' && (
                            <span className="text-[10px] bg-primary text-on-primary px-1.5 py-0.5 rounded-full uppercase tracking-wider">Priority</span>
                          )}
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant capitalize">
                          {habit.category} • {habit.scoringType}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => togglePriority(habit.id, habit.priority)}
                        title={habit.priority === 'high' ? "Remove Priority" : "Mark as Priority"}
                        className={`p-2 rounded transition-colors ${habit.priority === 'high' ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                      >
                        <span className="material-symbols-outlined" style={{fontSize: '20px'}}>
                          {habit.priority === 'high' ? 'star' : 'star_border'}
                        </span>
                      </button>
                      <button 
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-2 text-outline-variant hover:text-error hover:bg-error-container rounded transition-colors"
                        title="Delete Habit"
                      >
                        <span className="material-symbols-outlined" style={{fontSize: '20px'}}>delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
