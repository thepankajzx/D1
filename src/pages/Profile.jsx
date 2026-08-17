import Icon from '../components/Icon';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { db } from '../lib/firebase';
import ProModal from '../components/ProModal';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showHabitsList, setShowHabitsList] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (theme === 'Dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);


  const handleDeleteHabit = async (habitId) => {
    const habitToDelete = habits.find(h => h.id === habitId);
    if (habitToDelete && habitToDelete.createdAt) {
        const createdDate = new Date(habitToDelete.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - createdDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
            alert(`Habits are locked for 30 days to build consistency. You cannot remove it yet. (${30 - diffDays} days remaining)`);
            return;
        }
    }

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
        <section className="bg-surface border border-error/30 rounded-2xl p-6 flex flex-col gap-4 shadow-sm mt-4 md:mt-0">
          <button 
            onClick={handleLogout}
            className="w-full py-3 bg-surface-container-low text-on-surface font-semibold rounded-lg hover:bg-surface-variant flex items-center justify-center gap-2 transition-colors border border-outline-variant"
          >
            <Icon name="logout"  />
            Log Out
          </button>

          {currentUser?.email === 'dummytest2025@example.com' && (
            <button 
              onClick={async () => {
                try {
                  await updateDoc(doc(db, 'users', currentUser.uid), { isPro: true });
                  alert('Pro status granted! Please reload the page to see changes.');
                } catch (e) {
                  console.error(e);
                  alert('Error granting Pro');
                }
              }}
              className="w-full py-3 bg-primary/10 text-primary font-semibold rounded-lg hover:bg-primary/20 flex items-center justify-center gap-2 transition-colors border border-primary/20"
            >
              <Icon name="workspace_premium" />
              Grant Pro (Test)
            </button>
          )}
          
          <div className="w-full h-px bg-outline-variant/30 my-2"></div>

          <div className="flex flex-col gap-2">
            <h3 className="text-error font-bold text-sm">Danger Zone</h3>
            <p className="text-xs text-on-surface-variant mb-2">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-3 bg-error/10 text-error font-semibold rounded-lg hover:bg-error/20 flex items-center justify-center gap-2 transition-colors border border-error/20"
            >
              <Icon name="delete_forever"  />
              Delete Account
            </button>
          </div>
        </section>
      </div>

      {/* Right Column: My Habits */}
      <div className="md:col-span-8 flex flex-col gap-6">
        <section className="bg-surface border border-outline-variant rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="font-headline-md text-headline-md text-on-surface">My Habits</h2>
            {showHabitsList && (
              <button onClick={handleAddHabitClick} className="bg-primary text-on-primary font-label-sm text-label-sm px-4 py-2 rounded-full flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm">
                <Icon name="add" style={{fontSize: '18px'}} />
                Add Habit
              </button>
            )}
          </div>

          <button 
            onClick={() => setShowHabitsList(!showHabitsList)}
            className="w-full py-3 bg-surface-container-low text-on-surface font-semibold rounded-lg hover:bg-surface-variant flex items-center justify-center gap-2 transition-colors border border-outline-variant"
          >
            <Icon name="list_alt" />
            {showHabitsList ? "Hide My Habits" : "View My Habits"}
            <Icon name={showHabitsList ? "expand_less" : "expand_more"} className="ml-auto mr-2" />
          </button>

          {showHabitsList && (
            <div className="flex flex-col mt-2 border-t border-outline-variant/30 pt-2">
              {loadingData ? (
                <div className="py-12 text-center text-on-surface-variant flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  Loading habits...
                </div>
              ) : habits.length === 0 ? (
                <div className="py-12 text-center text-on-surface-variant flex flex-col items-center gap-4">
                  <Icon name="inbox" className=" text-4xl opacity-50" />
                  You have no habits tracked.
                </div>
              ) : (
                habits.map(habit => (
                  <div key={habit.id} className="flex items-center justify-between py-4 border-b border-outline-variant/50 last:border-0 group">
                    <div className="flex items-center gap-4 flex-grow">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                        <Icon name={habit.icon} className=" text-2xl" />
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
                        <Icon name="delete"  style={{fontSize: '20px'}} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>
      
      {/* Paywall Modal */}
      <ProModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        source="total_habits_limit" 
      />

      {/* Account Deletion Warning Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mb-4 mx-auto">
              <Icon name="warning" className="text-2xl" />
            </div>
            <h2 className="text-headline-sm font-headline-sm text-on-surface text-center mb-2">Delete Account?</h2>
            <p className="text-body-md font-body-md text-on-surface-variant text-center mb-6">
              This action is <span className="font-bold text-error">permanent</span>. All your tracked habits, daily summaries, and streaks will be erased immediately. You cannot undo this.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                disabled={isDeletingAccount}
                onClick={async () => {
                  setIsDeletingAccount(true);
                  try {
                    // Fetch all subcollections to delete
                    const habitsSnap = await getDocs(collection(db, 'users', currentUser.uid, 'habits'));
                    const entriesSnap = await getDocs(collection(db, 'users', currentUser.uid, 'entries'));
                    const summariesSnap = await getDocs(collection(db, 'users', currentUser.uid, 'dailySummaries'));
                    
                    const batch = writeBatch(db);
                    
                    // Batch delete all documents
                    habitsSnap.forEach(d => batch.delete(d.ref));
                    entriesSnap.forEach(d => batch.delete(d.ref));
                    summariesSnap.forEach(d => batch.delete(d.ref));
                    batch.delete(doc(db, 'users', currentUser.uid));
                    
                    await batch.commit();

                    try {
                      await currentUser.delete();
                    } catch (authError) {
                      console.warn("Auth deletion failed (likely requires recent login), but data is deleted.", authError);
                      await logout();
                    }
                    
                    navigate('/login');
                  } catch (error) {
                    console.error("Error deleting account data:", error);
                    alert("A critical error occurred while deleting your data. Please try again later.");
                    setIsDeletingAccount(false);
                  }
                }}
                className="w-full py-3 bg-error text-on-error font-semibold rounded-lg hover:opacity-90 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isDeletingAccount ? (
                  <div className="w-5 h-5 border-2 border-on-error border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Icon name="delete_forever" />
                    Yes, Delete My Account
                  </>
                )}
              </button>
              <button 
                disabled={isDeletingAccount}
                onClick={() => setShowDeleteModal(false)}
                className="w-full py-3 bg-transparent text-on-surface font-medium rounded-lg hover:bg-on-surface/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
