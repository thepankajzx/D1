/**
 * demoData.js
 * Complete 50-day ultra-rich demo dataset for Guest / Preview mode.
 * Fully synchronized with modern D1 features:
 * - Compare Matrix (7 habits, heatmaps, streak milestones)
 * - Resilience Hub (Recovery Score 88%, 1-Day Reset Rate, Bounce-Back Curve)
 * - AI Habit Coach Bot telemetry
 * - Upcoming Features: Today's Compass briefing, Progress Tower, Habit Diagnostics, Better Report
 */

import { canonicalizeHabit } from './habitColors';

// 1. RICH 7-HABIT SUITE COVERING ALL KEY LIFE DOMAINS
const RAW_DEMO_HABITS = [
  {
    id: 'demo-workout',
    name: 'Morning Workout',
    category: 'Fitness',
    icon: 'fitness_center',
    scoringType: 'duration',
    direction: 'higher_is_better',
    targetValue: 45,
    startValue: 0,
    target100: 45,
    target0: 0,
    userTarget100: 45,
    userTarget0: 0,
    unit: 'min',
    defaultUnit: 'min',
    priority: 'high',
    priorityRank: 1,
    orderIndex: 0,
    color: '#10b981',
  },
  {
    id: 'demo-screentime',
    name: 'Screen Time',
    category: 'Lifestyle',
    icon: 'smartphone',
    scoringType: 'duration',
    direction: 'lower_is_better',
    targetValue: 60,
    startValue: 240,
    target100: 60,
    target0: 240,
    userTarget100: 60,
    userTarget0: 240,
    unit: 'min',
    defaultUnit: 'min',
    priority: 'medium',
    priorityRank: 2,
    orderIndex: 1,
    color: '#f59e0b',
  },
  {
    id: 'demo-wakeup',
    name: 'Wake Up Time',
    category: 'Morning',
    icon: 'alarm',
    scoringType: 'time',
    direction: 'earlier_is_better',
    targetValue: 390,  // 6:30 AM
    startValue: 540,   // 9:00 AM
    target100: 390,
    target0: 540,
    userTarget100: 390,
    userTarget0: 540,
    unit: 'Time',
    defaultUnit: 'Time',
    priority: 'high',
    priorityRank: 3,
    orderIndex: 2,
    color: '#6366f1',
  },
  {
    id: 'demo-coldshower',
    name: 'Cold Shower',
    category: 'Lifestyle',
    icon: 'ac_unit',
    scoringType: 'binary',
    direction: 'higher_is_better',
    targetValue: 1,
    startValue: 0,
    target100: 1,
    target0: 0,
    userTarget100: 1,
    userTarget0: 0,
    unit: '',
    defaultUnit: '',
    priority: 'low',
    orderIndex: 3,
    color: '#0ea5e9',
  },
  {
    id: 'demo-reading',
    name: 'Daily Reading',
    category: 'Mind',
    icon: 'menu_book',
    scoringType: 'duration',
    direction: 'higher_is_better',
    targetValue: 25,
    startValue: 0,
    target100: 25,
    target0: 0,
    userTarget100: 25,
    userTarget0: 0,
    unit: 'min',
    defaultUnit: 'min',
    priority: 'medium',
    orderIndex: 4,
    color: '#8b5cf6',
  },
  {
    id: 'demo-water',
    name: 'Water Intake',
    category: 'Nutrition',
    icon: 'water_drop',
    scoringType: 'number',
    direction: 'higher_is_better',
    targetValue: 3.5,
    startValue: 0.5,
    target100: 3.5,
    target0: 0.5,
    userTarget100: 3.5,
    userTarget0: 0.5,
    unit: 'Liters',
    defaultUnit: 'Liters',
    priority: 'high',
    orderIndex: 5,
    color: '#0284c7',
  },
  {
    id: 'demo-deepwork',
    name: 'Deep Work',
    category: 'Focus',
    icon: 'psychology',
    scoringType: 'duration',
    direction: 'higher_is_better',
    targetValue: 120,
    startValue: 0,
    target100: 120,
    target0: 0,
    userTarget100: 120,
    userTarget0: 0,
    unit: 'min',
    defaultUnit: 'min',
    priority: 'medium',
    orderIndex: 6,
    color: '#ef4444',
  }
];

export const DEMO_HABITS = RAW_DEMO_HABITS.map(canonicalizeHabit);

function clamp(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

function getPastDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTimeVal(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return displayH + ':' + String(m).padStart(2, '0') + ' ' + ampm;
}

function scoreToActual(habit, score) {
  if (habit.id === 'demo-workout') return Math.round((score / 100) * 45);
  if (habit.id === 'demo-screentime') return Math.round(240 - (score / 100) * 180);
  if (habit.id === 'demo-wakeup') return Math.round(540 - (score / 100) * 150);
  if (habit.id === 'demo-coldshower') return score >= 50 ? 1 : 0;
  if (habit.id === 'demo-reading') return Math.round((score / 100) * 25);
  if (habit.id === 'demo-water') return Math.round((0.5 + (score / 100) * 3.0) * 10) / 10;
  if (habit.id === 'demo-deepwork') return Math.round((score / 100) * 120);
  return score;
}

function buildDailySummaries() {
  const summaries = [];
  let streak = 0;
  
  const curveParams = {
    'demo-workout':    { start: 45, end: 94, noise: 12, dipDays: [9, 21, 35] },
    'demo-screentime': { start: 50, end: 85, noise: 14, dipDays: [12, 26, 40] },
    'demo-wakeup':     { start: 40, end: 92, noise: 10, dipDays: [15, 29] },
    'demo-coldshower': { start: 65, end: 100, noise: 20, dipDays: [8, 19, 31, 42] },
    'demo-reading':    { start: 35, end: 88, noise: 15, dipDays: [14, 28] },
    'demo-water':      { start: 55, end: 98, noise: 8,  dipDays: [18, 36] },
    'demo-deepwork':   { start: 40, end: 90, noise: 16, dipDays: [11, 23, 37] },
  };

  for (let ago = 49; ago >= 0; ago--) {
    const dayIndex = 49 - ago;
    const dateStr = getPastDate(ago);
    
    const habitScores = {};
    const habitValues = {};
    const habitsMap = {};
    const entries = [];

    DEMO_HABITS.forEach(habit => {
      const p = curveParams[habit.id] || { start: 50, end: 85, noise: 14, dipDays: [] };
      const progress = dayIndex / 49;
      let base = p.start + (p.end - p.start) * Math.pow(progress, 0.75);
      let noise = Math.sin(dayIndex * 2.5 + 1.2) * p.noise * (1 - progress * 0.3);
      
      // Slump & Bounce-back simulation
      let dip = 0;
      if (p.dipDays.includes(dayIndex)) {
        dip = -45; // Sudden slump day (score ~30)
      } else if (p.dipDays.map(d => d + 1).includes(dayIndex)) {
        dip = 18; // Resilient 1-day bounce-back!
      }

      const score = clamp(Math.round(base + noise + dip));
      const actVal = scoreToActual(habit, score);
      const isCompleted = score >= 50;
      
      habitScores[habit.id] = score;
      habitValues[habit.id] = actVal;
      habitsMap[habit.id] = {
        completed: isCompleted,
        score,
        value: actVal
      };

      let displayValue;
      if (habit.scoringType === 'time') displayValue = formatTimeVal(actVal);
      else if (habit.scoringType === 'binary') displayValue = actVal === 1 ? 'Yes' : 'No';
      else displayValue = actVal + ' ' + (habit.unit || habit.defaultUnit || '');

      entries.push({
        id: `${habit.id}_${dateStr}`,
        habitId: habit.id,
        rawValue: actVal,
        computedScore: score,
        entryDate: dateStr,
        displayValue,
        targetValue: habit.targetValue,
        completed: isCompleted,
        updatedAt: new Date().toISOString()
      });
    });

    // Weighted Overall Score (Core priorities carry 2x weight)
    const priorityWeights = { high: 2, medium: 1.5, low: 1 };
    let weightedSum = 0;
    let totalWeight = 0;
    DEMO_HABITS.forEach(h => {
      const w = priorityWeights[h.priority] || 1;
      weightedSum += (habitScores[h.id] || 0) * w;
      totalWeight += w;
    });
    const overallScore = clamp(Math.round(weightedSum / totalWeight));

    // Global streak logic with bounce back
    const isMissed = [9, 21, 35].includes(dayIndex);
    const isRecovery = [10, 22, 36].includes(dayIndex);

    if (isMissed) {
      streak = 0;
    } else {
      streak += 1;
    }

    summaries.push({
      id: dateStr,
      date: dateStr,
      overallScore,
      totalScore: overallScore,
      habitsCompleted: Object.values(habitsMap).filter(h => h.completed).length,
      habitsTotal: DEMO_HABITS.length,
      habitScores,
      habitValues,
      habits: habitsMap,
      entries,
      streak,
      isRecovery,
      recoveryBonus: isRecovery ? 20 : 0,
      priorityModeEnabled: true,
    });
  }

  return summaries.sort((a, b) => b.id.localeCompare(a.id));
}

export const DEMO_SUMMARIES = buildDailySummaries();

// Export today's preloaded entries for immediate Today Dashboard rendering
export const DEMO_TODAY_ENTRIES = DEMO_SUMMARIES[0]?.entries || [];

export const DEMO_USER_DOC = {
  isPro: true,
  displayName: 'Guest Explorer',
  email: 'guest@definitetracker.com',
  currentStreak: 14,
  longestStreak: 28,
  totalDaysTracked: 50,
  createdAt: (() => { const d = new Date(); d.setDate(d.getDate() - 50); return d.toISOString(); })(),
  priorityModeEnabled: true,
  priorityLockDate: new Date().toISOString(),
  priorityLockedUntil: new Date(Date.now() + 25 * 86400000).toISOString(),
  milestones: {
    streak3: true,
    streak7: true,
    streak14: true,
    streak21: true,
    streak30: false,
    streak60: false,
    streak90: false,
    totalDays10: true,
    totalDays30: true,
    totalDays50: true,
    perfectDay: true,
    perfectWeek: true,
  },
};

export const DEMO_DATA = {
  habits: DEMO_HABITS,
  deletedHabits: [],
  allSummaries: DEMO_SUMMARIES,
  dailySummaries: DEMO_SUMMARIES,
  userDoc: DEMO_USER_DOC,
  loadingData: false,
  priorityModeEnabled: true,
  streakTrackingEnabled: true,
  coreXEnabled: true,
  todayCompassEnabled: true,
  aiCoachEnabled: true,
  earlyUnlockAll: true,
};
