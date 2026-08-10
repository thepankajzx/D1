import { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const HABITS_SEED_DATA = [
  { id: 'wakeup', name: 'Wake Up Time', category: 'Morning', scoringType: 'time', direction: 'lower_is_better', defaultUnit: 'time', target100: 360, target0: 480, icon: 'alarm' },
  { id: 'sleep', name: 'Sleep Time', category: 'Morning', scoringType: 'time', direction: 'lower_is_better', defaultUnit: 'time', target100: 1320, target0: 1440, icon: 'bedtime' },
  { id: 'sleep_duration', name: 'Sleep Duration', category: 'Morning', scoringType: 'duration', direction: 'higher_is_better', defaultUnit: 'hours', target100: 8, target0: 5, icon: 'hourglass_empty' },
  { id: 'workout', name: 'Workout', category: 'Fitness', scoringType: 'duration', direction: 'higher_is_better', defaultUnit: 'minutes', target100: 45, target0: 0, icon: 'fitness_center' },
  { id: 'walking', name: 'Walking / Steps', category: 'Fitness', scoringType: 'number', direction: 'higher_is_better', defaultUnit: 'steps', target100: 10000, target0: 2000, icon: 'directions_walk' },
  { id: 'water', name: 'Water Intake', category: 'Nutrition', scoringType: 'number', direction: 'higher_is_better', defaultUnit: 'liters', target100: 3.0, target0: 0.5, icon: 'water_drop' },
  { id: 'protein', name: 'Protein Intake', category: 'Nutrition', scoringType: 'number', direction: 'higher_is_better', defaultUnit: 'grams', target100: 100, target0: 20, icon: 'restaurant' },
  { id: 'calories', name: 'Calories', category: 'Nutrition', scoringType: 'number', direction: 'lower_is_better', defaultUnit: 'kcal', target100: 2000, target0: 3000, icon: 'local_dining' },
  { id: 'deepwork', name: 'Deep Work', category: 'Focus', scoringType: 'duration', direction: 'higher_is_better', defaultUnit: 'minutes', target100: 120, target0: 0, icon: 'psychology' },
  { id: 'pomodoro', name: 'Pomodoro Sessions', category: 'Focus', scoringType: 'number', direction: 'higher_is_better', defaultUnit: 'sessions', target100: 6, target0: 0, icon: 'timer' },
  { id: 'reading', name: 'Reading', category: 'Mind', scoringType: 'duration', direction: 'higher_is_better', defaultUnit: 'minutes', target100: 30, target0: 0, icon: 'menu_book' },
  { id: 'study', name: 'Study', category: 'Focus', scoringType: 'duration', direction: 'higher_is_better', defaultUnit: 'minutes', target100: 120, target0: 0, icon: 'school' },
  { id: 'screentime', name: 'Screen Time', category: 'Lifestyle', scoringType: 'duration', direction: 'lower_is_better', defaultUnit: 'minutes', target100: 60, target0: 240, icon: 'smartphone' },
  { id: 'meditation', name: 'Meditation', category: 'Mind', scoringType: 'duration', direction: 'higher_is_better', defaultUnit: 'minutes', target100: 20, target0: 0, icon: 'self_improvement' },
  { id: 'journal', name: 'Journal', category: 'Mind', scoringType: 'binary', direction: 'n/a', defaultUnit: 'n/a', target100: null, target0: null, icon: 'edit_note' },
  { id: 'coldshower', name: 'Cold Shower', category: 'Lifestyle', scoringType: 'binary', direction: 'n/a', defaultUnit: 'n/a', target100: null, target0: null, icon: 'ac_unit' },
  { id: 'mood', name: 'Mood', category: 'Mind', scoringType: 'subjective', direction: 'n/a', defaultUnit: 'scale_1_10', target100: null, target0: null, icon: 'mood' },
  { id: 'energy', name: 'Energy Level', category: 'Mind', scoringType: 'subjective', direction: 'n/a', defaultUnit: 'scale_1_10', target100: null, target0: null, icon: 'bolt' },
  { id: 'alcoholfree', name: 'Alcohol Free', category: 'Lifestyle', scoringType: 'binary', direction: 'n/a', defaultUnit: 'n/a', target100: null, target0: null, icon: 'no_drinks' },
  { id: 'smokingfree', name: 'Smoking / Nicotine Free', category: 'Lifestyle', scoringType: 'binary', direction: 'n/a', defaultUnit: 'n/a', target100: null, target0: null, icon: 'smoke_free' }
];

export default function Seed() {
  const [status, setStatus] = useState('Idle');
  
  async function handleSeed() {
    setStatus('Seeding...');
    try {
      for (const habit of HABITS_SEED_DATA) {
        await setDoc(doc(db, 'habitLibrary', habit.id), habit);
      }
      setStatus('Success! 20 habits seeded.');
    } catch (error) {
      console.error(error);
      setStatus(`Error: ${error.message}`);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-surface rounded-xl border border-outline-variant">
      <h1 className="text-2xl font-bold text-primary mb-4">Seed Firestore Database</h1>
      <p className="mb-4 text-on-surface-variant">Clicking this will write the 20 predefined habits into the <code>/habitLibrary</code> collection.</p>
      
      <button 
        onClick={handleSeed}
        className="bg-primary text-on-primary px-6 py-2 rounded font-medium hover:opacity-90"
      >
        Run Seed Script
      </button>
      
      <div className="mt-4 font-mono-data text-sm">{status}</div>
    </div>
  );
}
