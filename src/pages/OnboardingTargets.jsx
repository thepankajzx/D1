import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { calculateScore, isNightHabit } from '../lib/scoring';
import Icon from '../components/Icon';
import { formatTimeVal } from '../lib/timeFormat';

export default function OnboardingTargets() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { currentUser } = useAuth();
  const { refreshData } = useData();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserHabits() {
      if (!currentUser) return;
      try {
        const habitsRef = collection(db, 'users', currentUser.uid, 'habits');
        const snap = await getDocs(habitsRef);
        const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setHabits(fetched);
      } catch (error) {
        console.error("Error fetching habits:", error);
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
    return (hours || 0) * 60 + (minutes || 0);
  };

  const formatTimeString = (minutes) => {
    if (minutes == null) return "00:00";
    const totalMins = (Math.round(minutes) % 1440 + 1440) % 1440;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const handleFinish = async () => {
    setSaving(true);
    // Instant navigation to dashboard
    navigate('/');
    try {
      if (currentUser?.uid) {
        const batch = writeBatch(db);
        for (const habit of habits) {
          const userHabitRef = doc(db, 'users', currentUser.uid, 'habits', habit.id);
          
          let finalTarget100 = habit.target100;
          let finalTarget0 = habit.target0;

          // Ensure proper types
          if (habit.scoringType === 'time') {
            if (isNightHabit(habit)) {
              if (typeof finalTarget100 === 'number' && finalTarget100 < 12 * 60) finalTarget100 += 1440;
              if (typeof finalTarget0 === 'number' && finalTarget0 < 12 * 60) finalTarget0 += 1440;
            }
          } else if (habit.scoringType !== 'binary' && habit.scoringType !== 'subjective') {
            finalTarget100 = Number(finalTarget100);
            finalTarget0 = Number(finalTarget0);
          }

          batch.update(userHabitRef, {
            target100: finalTarget100,
            target0: finalTarget0,
            userTarget100: finalTarget100,
            userTarget0: finalTarget0
          });
        }
        await batch.commit();
        if (refreshData) {
          refreshData();
        }
      }
    } catch (error) {
      console.error("Error saving targets:", error);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen justify-center items-center bg-surface">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Top Nav */}
      <header className="w-full flex items-center pt-[max(env(safe-area-inset-top,0px),28px)] px-margin-mobile md:px-margin-desktop max-w-container-max-width mx-auto">
        <button 
          onClick={() => navigate(-1)}
          aria-label="Go back" 
          className="p-2 -ml-2 rounded-full hover:bg-surface-variant transition-colors flex items-center justify-center text-on-surface-variant"
        >
          <Icon name="arrow_back"  />
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
            const isBinary = habit.scoringType === 'binary';
            const isSubjective = habit.scoringType === 'subjective';
            const isTime = habit.scoringType === 'time';
            
            // Preview logic
            let previewScore = null;
            if (!isBinary && !isSubjective) {
                let currentVal = habit.previewValue !== undefined ? habit.previewValue : (habit.target0 !== undefined ? habit.target0 : 0);
                
                let adjustedVal = currentVal;
                let t100 = habit.target100;
                let t0 = habit.target0;
                const isNight = isTime && isNightHabit(habit);
                if (isNight) {
                  if (adjustedVal !== null && adjustedVal !== undefined && adjustedVal < 12 * 60) adjustedVal += 1440;
                  if (typeof t100 === 'number' && t100 < 12 * 60) t100 += 1440;
                  if (typeof t0 === 'number' && t0 < 12 * 60) t0 += 1440;
                }
                
                const rawScore = calculateScore(habit.scoringType, habit.direction, adjustedVal, t100, t0);
                previewScore = rawScore !== null ? Math.max(0, Math.min(100, Math.round(rawScore))) : 0;
            }

            return (
              <div key={habit.id} className="bg-surface-container-low border border-outline-variant rounded-xl p-5 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-primary shadow-sm border border-outline-variant/30">
                    <Icon name={habit.icon}  style={{fontVariationSettings: "'FILL' 1"}} />
                  </div>
                  <div>
                    <h2 className="font-label-sm text-label-sm font-bold text-on-surface">{habit.name}</h2>
                    <span className="text-xs text-on-surface-variant font-medium">{habit.scoringType} • {habit.unit}</span>
                  </div>
                </div>

                {isBinary ? (
                  <div className="text-sm text-on-surface-variant bg-surface p-4 rounded-lg border border-outline-variant/50">
                    <strong className="text-on-surface block mb-2">Track this habit using a simple Yes/No.</strong>
                    Logging <span className="font-bold text-primary">Yes</span> earns you 100% of the points, and <span className="font-bold">No</span> earns 0%.
                  </div>
                ) : isSubjective ? (
                  <p className="text-sm text-on-surface-variant bg-surface p-4 rounded-lg border border-outline-variant/50">
                    This habit is tracked on a subjective 1-10 scale and does not affect your overall score.
                  </p>
                ) : (
                  <div className="flex flex-col gap-6">
                    {/* Target Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1 uppercase tracking-wider">
                          100% Score <Icon name="edit" className=" text-[14px]" />
                        </label>
                        {isTime ? (
                          <>
                            <input 
                              type="time" 
                              aria-label={`Optimal time for ${habit.name}`}
                              value={formatTimeString(habit.target100)}
                              onChange={(e) => handleTargetChange(habit.id, 'target100', parseTimeString(e.target.value))}
                              className="px-3 py-2 bg-surface border-2 border-outline-variant rounded-lg text-on-surface font-mono-data font-bold focus:border-primary outline-none transition-colors w-full"
                            />
                            <span className="text-[10px] font-bold text-primary">
                              {formatTimeVal(habit.target100)}
                            </span>
                          </>
                        ) : (
                          <input 
                            type="number" 
                            aria-label={`Optimal target for ${habit.name}`}
                            value={habit.target100 || 0}
                            onChange={(e) => handleTargetChange(habit.id, 'target100', Number(e.target.value))}
                            className="px-3 py-2 bg-surface border-2 border-outline-variant rounded-lg text-on-surface font-mono-data font-bold focus:border-primary outline-none transition-colors w-full"
                          />
                        )}
                        <span className="text-[10px] text-on-surface-variant">Optimal</span>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1 uppercase tracking-wider">
                          0% Score <Icon name="edit" className=" text-[14px]" />
                        </label>
                        {isTime ? (
                          <>
                            <input 
                              type="time" 
                              aria-label={`Baseline time for ${habit.name}`}
                              value={formatTimeString(habit.target0)}
                              onChange={(e) => handleTargetChange(habit.id, 'target0', parseTimeString(e.target.value))}
                              className="px-3 py-2 bg-surface border border-outline-variant rounded-lg text-on-surface font-mono-data focus:border-primary outline-none transition-colors w-full"
                            />
                            <span className="text-[10px] font-bold text-primary">
                              {formatTimeVal(habit.target0)}
                            </span>
                          </>
                        ) : (
                          <input 
                            type="number" 
                            aria-label={`Baseline target for ${habit.name}`}
                            value={habit.target0 || 0}
                            onChange={(e) => handleTargetChange(habit.id, 'target0', Number(e.target.value))}
                            className="px-3 py-2 bg-surface border border-outline-variant rounded-lg text-on-surface font-mono-data focus:border-primary outline-none transition-colors w-full"
                          />
                        )}
                        <span className="text-[10px] text-on-surface-variant">Baseline (Min)</span>
                      </div>
                    </div>

                    {/* Interactive Preview */}
                    <div className="bg-surface p-4 rounded-xl border border-primary/20 shadow-sm relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-1 bg-primary h-full"></div>
                       <div className="flex justify-between items-center mb-4">
                           <span className="text-xs font-bold text-primary uppercase tracking-wider">Live Preview</span>
                           <div className="px-2 py-0.5 bg-primary text-on-primary rounded font-mono-data text-xs font-bold shadow-sm">
                               {previewScore}% Score
                           </div>
                       </div>
                       
                       <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-xs text-on-surface-variant">
                             <span>
                               {isTime ? '00:00' : '0'}
                             </span>
                             <span className="font-bold text-on-surface">
                               {habit.previewValue !== undefined 
                                  ? (isTime ? formatTimeString(habit.previewValue) : habit.previewValue) 
                                  : (isTime ? formatTimeString(habit.target0) : habit.target0)}
                             </span>
                             <span>
                               {isTime 
                                  ? formatTimeString(Math.max(habit.target100, habit.target0) + 120) 
                                  : Math.max(habit.target100, habit.target0) * 1.5 || 100}
                             </span>
                          </div>
                          <input 
                            type="range" 
                            aria-label={`Preview slider for ${habit.name}`}
                            min="0" 
                            max={isTime ? 1440 : Math.max(habit.target100, habit.target0) * 1.5 || 100}
                            step={isTime ? "15" : "1"}
                            value={habit.previewValue !== undefined ? habit.previewValue : (habit.target0 || 0)}
                            onChange={(e) => handleTargetChange(habit.id, 'previewValue', Number(e.target.value))}
                            className="custom-slider w-full" 
                          />
                          <p className="text-[10px] text-on-surface-variant text-center mt-2">
                             Drag to see how your daily score will be calculated based on your targets.
                          </p>
                       </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 w-full bg-surface/95 border-t border-outline-variant px-margin-mobile md:px-margin-desktop py-4 flex justify-center z-50">
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
