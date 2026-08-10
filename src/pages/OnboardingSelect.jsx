import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export default function OnboardingSelect() {
  const [habits, setHabits] = useState([]);
  const [selectedHabits, setSelectedHabits] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchHabits() {
      try {
        const querySnapshot = await getDocs(collection(db, 'habitLibrary'));
        const loadedHabits = [];
        querySnapshot.forEach((doc) => {
          loadedHabits.push({ id: doc.id, ...doc.data() });
        });
        setHabits(loadedHabits);
      } catch (error) {
        console.error("Error fetching habit library:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchHabits();
  }, []);

  const categories = ['All', ...new Set(habits.map(h => h.category))];
  const displayedHabits = activeCategory === 'All' 
    ? habits 
    : habits.filter(h => h.category === activeCategory);

  const toggleHabit = (habit) => {
    const isSelected = selectedHabits.some(h => h.id === habit.id);
    if (isSelected) {
      setSelectedHabits(selectedHabits.filter(h => h.id !== habit.id));
    } else {
      if (selectedHabits.length < 8) {
        setSelectedHabits([...selectedHabits, habit]);
      } else {
        alert("You can only select up to 8 habits to start.");
      }
    }
  };

  const handleContinue = async () => {
    if (selectedHabits.length === 0) {
      alert("Please select at least one habit.");
      return;
    }
    
    setSaving(true);
    try {
      // Write selected habits to user doc
      for (const habit of selectedHabits) {
        const userHabitRef = doc(db, 'users', currentUser.uid, 'habits', habit.id);
        await setDoc(userHabitRef, {
          habitLibraryId: habit.id,
          name: habit.name,
          category: habit.category,
          icon: habit.icon,
          scoringType: habit.scoringType,
          direction: habit.direction,
          unit: habit.defaultUnit,
          target100: habit.target100,
          target0: habit.target0,
          isActive: true,
          priority: 'medium',
          createdAt: new Date().toISOString()
        });
      }
      navigate('/onboarding/targets');
    } catch (error) {
      console.error("Error saving selected habits:", error);
      alert("Failed to save habits.");
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Top Nav (simplified for onboarding) */}
      <header className="w-full flex items-center pt-8 px-margin-mobile md:px-margin-desktop max-w-container-max-width mx-auto">
        <button 
          onClick={() => navigate(-1)}
          aria-label="Go back" 
          className="p-2 -ml-2 rounded-full hover:bg-surface-variant transition-colors flex items-center justify-center text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1 flex justify-center items-center">
          <div className="flex space-x-2 items-center">
            <div className="w-8 h-2 rounded-full bg-primary"></div>
            <div className="w-2 h-2 rounded-full bg-outline-variant"></div>
          </div>
        </div>
        <div className="w-10"></div> {/* Spacer for flex balance */}
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop pb-32 flex flex-col">
        {/* Header & Counter */}
        <div className="mt-4 md:mt-8 mb-8">
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
            Choose up to 8 habits to track
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            {selectedHabits.length} of 8 selected
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-4 mb-4 -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 border px-4 py-2 rounded-full font-label-sm text-label-sm transition-colors ${
                activeCategory === cat 
                  ? 'bg-primary text-on-primary border-primary' 
                  : 'bg-surface text-on-surface border-outline-variant hover:border-primary'
              }`}
            >
              {cat === 'All' ? 'All Habits' : cat}
            </button>
          ))}
        </div>

        {/* Habit Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {displayedHabits.map(habit => {
              const isSelected = selectedHabits.some(h => h.id === habit.id);
              
              return (
                <button 
                  key={habit.id}
                  onClick={() => toggleHabit(habit)}
                  className={`group relative flex flex-col items-start p-4 rounded-xl text-left transition-all ${
                    isSelected 
                      ? 'bg-surface-container-lowest border-2 border-primary' 
                      : 'bg-surface-container-low border border-outline-variant hover:border-primary'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    isSelected ? 'bg-surface-container-low text-primary' : 'bg-surface text-on-surface-variant'
                  }`}>
                    <span className="material-symbols-outlined" style={isSelected ? {fontVariationSettings: "'FILL' 1"} : {}}>
                      {habit.icon}
                    </span>
                  </div>
                  <span className={`font-label-sm text-label-sm line-clamp-2 ${isSelected ? 'text-on-surface' : 'text-on-surface-variant group-hover:text-on-surface'}`}>
                    {habit.name}
                  </span>
                  
                  {isSelected ? (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full border border-outline-variant text-on-surface-variant flex items-center justify-center group-hover:border-primary group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[16px]">add</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-sm border-t border-outline-variant px-margin-mobile md:px-margin-desktop py-4 flex justify-center z-50">
        <div className="w-full max-w-container-max-width flex justify-center">
          <button 
            onClick={handleContinue}
            disabled={saving || selectedHabits.length === 0}
            aria-label="Continue to next step" 
            className="w-full md:w-[400px] h-12 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
