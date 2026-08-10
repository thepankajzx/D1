import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export default function OnboardingTargets() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserHabits() {
      try {
        const querySnapshot = await getDocs(collection(db, 'users', currentUser.uid, 'habits'));
        const loadedHabits = [];
        querySnapshot.forEach((doc) => {
          loadedHabits.push({ id: doc.id, ...doc.data() });
        });
        setHabits(loadedHabits);
      } catch (error) {
        console.error("Error fetching user habits:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUserHabits();
  }, [currentUser]);

  const handleTargetChange = (habitId, field, value) => {
    setHabits(habits.map(h => {
      if (h.id === habitId) {
        return { ...h, [field]: value };
      }
      return h;
    }));
  };

  const parseTimeString = (timeString) => {
    // "HH:MM" -> minutes since midnight
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTimeString = (minutes) => {
    if (minutes == null) return "00:00";
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      for (const habit of habits) {
        const userHabitRef = doc(db, 'users', currentUser.uid, 'habits', habit.id);
        
        let finalTarget100 = habit.target100;
        let finalTarget0 = habit.target0;

        // Ensure proper types
        if (habit.scoringType === 'time') {
          // If the user used the time input, we need to ensure it's in minutes
          // We handle this conversion directly in the input onChange, so it should already be minutes
        } else if (habit.scoringType !== 'binary' && habit.scoringType !== 'subjective') {
          finalTarget100 = Number(finalTarget100);
          finalTarget0 = Number(finalTarget0);
        }

        await updateDoc(userHabitRef, {
          target100: finalTarget100,
          target0: finalTarget0
        });
      }
      navigate('/dashboard'); // Go to main dashboard when done
    } catch (error) {
      console.error("Error saving targets:", error);
      alert("Failed to save targets.");
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen justify-center items-center bg-surface">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Top Nav */}
      <header className="w-full flex items-center pt-8 px-margin-mobile md:px-margin-desktop max-w-container-max-width mx-auto">
        <button 
          onClick={() => navigate(-1)}
          aria-label="Go back" 
          className="p-2 -ml-2 rounded-full hover:bg-surface-variant transition-colors flex items-center justify-center text-on-surface-variant"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1 flex justify-center items-center">
          <div className="flex space-x-2 items-center">
            <div className="w-8 h-2 rounded-full bg-surface-variant"></div>
            <div className="w-8 h-2 rounded-full bg-primary"></div>
          </div>
        </div>
        <div className="w-10"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-margin-mobile md:px-margin-desktop pb-32 flex flex-col">
        <div className="mt-4 md:mt-8 mb-8">
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
            Set your targets
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Adjust the baseline (0% score) and optimal (100% score) for each habit.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {habits.map(habit => {
            const isBinaryOrSubjective = habit.scoringType === 'binary' || habit.scoringType === 'subjective';

            return (
              <div key={habit.id} className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>{habit.icon}</span>
                  </div>
                  <div>
                    <h2 className="font-label-sm text-label-sm font-semibold">{habit.name}</h2>
                    <span className="text-xs text-on-surface-variant">{habit.scoringType} • {habit.unit}</span>
                  </div>
                </div>

                {isBinaryOrSubjective ? (
                  <p className="text-sm text-on-surface-variant bg-surface p-3 rounded-lg border border-outline-variant/50">
                    This habit is tracked simply by logging it. No targets needed.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-on-surface-variant">
                        100% Score (Optimal)
                      </label>
                      {habit.scoringType === 'time' ? (
                        <input 
                          type="time" 
                          value={formatTimeString(habit.target100)}
                          onChange={(e) => handleTargetChange(habit.id, 'target100', parseTimeString(e.target.value))}
                          className="px-3 py-2 bg-surface border border-outline-variant rounded-lg text-on-surface w-full"
                        />
                      ) : (
                        <input 
                          type="number" 
                          value={habit.target100 || 0}
                          onChange={(e) => handleTargetChange(habit.id, 'target100', e.target.value)}
                          className="px-3 py-2 bg-surface border border-outline-variant rounded-lg text-on-surface w-full"
                        />
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-on-surface-variant">
                        0% Score (Baseline)
                      </label>
                      {habit.scoringType === 'time' ? (
                        <input 
                          type="time" 
                          value={formatTimeString(habit.target0)}
                          onChange={(e) => handleTargetChange(habit.id, 'target0', parseTimeString(e.target.value))}
                          className="px-3 py-2 bg-surface border border-outline-variant rounded-lg text-on-surface w-full"
                        />
                      ) : (
                        <input 
                          type="number" 
                          value={habit.target0 || 0}
                          onChange={(e) => handleTargetChange(habit.id, 'target0', e.target.value)}
                          className="px-3 py-2 bg-surface border border-outline-variant rounded-lg text-on-surface w-full"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-sm border-t border-outline-variant px-margin-mobile md:px-margin-desktop py-4 flex justify-center z-50">
        <div className="w-full max-w-container-max-width flex justify-center">
          <button 
            onClick={handleFinish}
            disabled={saving}
            className="w-full md:w-[400px] h-12 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Finish Setup'}
          </button>
        </div>
      </div>
    </div>
  );
}
