import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { db } from '../lib/firebase';
import { doc, deleteDoc, updateDoc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Profile() {
  const { currentUser, logout } = useAuth();
  const { habits, setHabits, loadingData } = useData();

  // Theme state and toggle logic
  const [theme, setTheme] = useState(
    document.documentElement.classList.contains('dark') ? 'Dark' : 'Light'
  );
  const [showPaywall, setShowPaywall] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (theme === 'Dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);


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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
      alert("Failed to log out");
    }
  };



  const handleAddHabitClick = (e) => {
    e.preventDefault();
    if (habits.length >= 8) {
      setShowPaywall(true);
    } else {
      navigate('/onboarding/select');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
      {/* Left Column: Personal Info & Preferences */}
      <div className="md:col-span-4 flex flex-col gap-6">
        {/* Personal Info Card */}
        <section className="bg-surface border border-outline-variant rounded-2xl p-6 flex flex-col gap-6 shadow-sm">
          <h2 className="font-headline-md text-headline-md text-on-surface">Personal Info</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Email</label>
              <input 
                disabled
                className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2 font-body-md text-body-md text-on-surface opacity-70 cursor-not-allowed" 
                type="email" 
                value={currentUser?.email || ''} 
              />
            </div>
          </div>
        </section>

        {/* Preferences Card */}
        <section className="bg-surface border border-outline-variant rounded-2xl p-6 flex flex-col gap-6 shadow-sm">
          <h2 className="font-headline-md text-headline-md text-on-surface">Preferences</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-body-md text-body-md text-on-surface">Theme</span>
              <div className="flex bg-surface-container-low rounded-full p-1 border border-outline-variant">
                <button 
                  onClick={() => setTheme('Light')}
                  className={`px-4 py-1.5 rounded-full font-label-sm text-label-sm transition-colors ${theme === 'Light' ? 'bg-surface shadow-sm text-primary border border-outline-variant/50' : 'text-on-surface-variant hover:text-primary'}`}
                >
                  Light
                </button>
                <button 
                  onClick={() => setTheme('Dark')}
                  className={`px-4 py-1.5 rounded-full font-label-sm text-label-sm transition-colors ${theme === 'Dark' ? 'bg-surface shadow-sm text-primary border border-outline-variant/50' : 'text-on-surface-variant hover:text-primary'}`}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>
        </section>



        {/* Membership Info Card */}
        <section className="bg-surface border border-outline-variant rounded-2xl p-6 flex flex-col gap-6 shadow-sm">
          <h2 className="font-headline-md text-headline-md text-on-surface">Membership</h2>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-xl border border-outline-variant">
              <div>
                <div className="font-bold text-on-surface">Free Plan</div>
                <div className="text-sm text-on-surface-variant">8 habits max</div>
              </div>
              <div className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Active
              </div>
            </div>
            <button onClick={() => navigate('/subscription')} className="w-full py-2 bg-primary text-on-primary font-semibold rounded-lg hover:opacity-90 text-center">
              Manage Subscription
            </button>
          </div>
        </section>

        {/* Account Actions */}
        <section className="bg-surface border border-error/30 rounded-2xl p-6 flex flex-col gap-6 shadow-sm mt-4 md:mt-0">
          <button 
            onClick={handleLogout}
            className="w-full py-3 bg-error/10 text-error font-semibold rounded-lg hover:bg-error/20 flex items-center justify-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            Log Out
          </button>
        </section>
      </div>

      {/* Right Column: My Habits */}
      <div className="md:col-span-8 flex flex-col gap-6">
        <section className="bg-surface border border-outline-variant rounded-2xl p-6 flex flex-col gap-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-outline-variant pb-4">
            <h2 className="font-headline-md text-headline-md text-on-surface">My Habits</h2>
            <button onClick={handleAddHabitClick} className="bg-primary text-on-primary font-label-sm text-label-sm px-4 py-2 rounded-full flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm">
              <span className="material-symbols-outlined" style={{fontSize: '18px'}}>add</span>
              Add Habit
            </button>
          </div>

          <div className="flex flex-col">
            {loadingData ? (
              <div className="py-12 text-center text-on-surface-variant flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                Loading habits...
              </div>
            ) : habits.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant flex flex-col items-center gap-4">
                <span className="material-symbols-outlined text-4xl opacity-50">inbox</span>
                You have no habits tracked.
              </div>
            ) : (
              habits.map(habit => (
                <div key={habit.id} className="flex items-center justify-between py-4 border-b border-outline-variant/50 last:border-0 group">
                  <div className="flex items-center gap-4 flex-grow">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-2xl">{habit.icon}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-body-md text-body-md font-bold text-on-surface flex items-center gap-2">
                        {habit.name}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant capitalize mt-0.5">
                        {habit.category} • {habit.scoringType}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-colors"
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
      
      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>workspace_premium</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">Habit Limit Reached</h3>
            <p className="text-on-surface-variant text-sm mb-6">
              You can only track up to 8 habits on the free plan. Upgrade to Pro to unlock unlimited habits and advanced analytics.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/subscription')}
                className="w-full py-3 bg-primary text-on-primary font-semibold rounded-lg hover:opacity-90"
              >
                Explore Pro
              </button>
              <button
                onClick={() => setShowPaywall(false)}
                className="w-full py-3 border border-outline-variant text-on-surface font-semibold rounded-lg hover:bg-surface-variant"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
