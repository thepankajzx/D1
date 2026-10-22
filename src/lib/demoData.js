/**
 * demoData.js
 * Complete 50-day demo dataset for Guest / Preview mode.
 * Fully compatible with all analytics, deep dive, heatmap, streaks, resilience, and profile screens.
 */

import { canonicalizeHabit } from './habitColors';

// 1. DEMO HABITS
const RAW_DEMO_HABITS = [
  {
    id: 'demo-workout',
    name: 'Morning Workout',
    icon: 'fitness_center',
    scoringType: 'duration',
    direction: 'higher_is_better',
    targetValue: 30,
    startValue: 0,
    target100: 30,
    target0: 0,
    userTarget100: 30,
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
    icon: 'menu_book',
    scoringType: 'duration',
    direction: 'higher_is_better',
    targetValue: 20,
    startValue: 0,
    target100: 20,
    target0: 0,
    userTarget100: 20,
    userTarget0: 0,
    unit: 'min',
    defaultUnit: 'min',
    priority: 'medium',
    orderIndex: 4,
    color: '#8b5cf6',
  },
];

export const DEMO_HABITS = RAW_DEMO_HABITS.map(canonicalizeHabit);

function clamp(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

function improvementCurve(dayIndex, total, startAvg, endAvg, noiseAmp) {
  const progress = dayIndex / (total - 1);
  const base = startAvg + (endAvg - startAvg) * Math.pow(progress, 0.7);
  const noise = Math.sin(dayIndex * 2.7 + 1.3) * noiseAmp * (1 - progress * 0.4);
  const dip = ((dayIndex % 9 === 0) || (dayIndex % 13 === 0)) && dayIndex > 0 && dayIndex < 45 ? -22 : 0;
  return clamp(Math.round(base + noise + dip));
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
  if (habit.id === 'demo-workout') return Math.round((score / 100) * 30);
  if (habit.id === 'demo-screentime') return Math.round(240 - (score / 100) * 180);
  if (habit.id === 'demo-wakeup') return Math.round(540 - (score / 100) * 150);
  if (habit.id === 'demo-coldshower') return score >= 50 ? 1 : 0;
  if (habit.id === 'demo-reading') return Math.round((score / 100) * 20);
  return score;
}

function buildDailySummaries() {
  const summaries = [];
  let streak = 0;
  
  const curveParams = {
    'demo-workout':    { start: 40, end: 92, noise: 18 },
    'demo-screentime': { start: 45, end: 85, noise: 20 },
    'demo-wakeup':     { start: 35, end: 88, noise: 16 },
    'demo-coldshower': { start: 60, end: 100, noise: 25 },
    'demo-reading':    { start: 30, end: 90, noise: 18 },
  };

  for (let ago = 49; ago >= 0; ago--) {
    const dayIndex = 49 - ago;
    const dateStr = getPastDate(ago);
    
    const habitScores = {};
    const habitValues = {};
    const entries = [];

    DEMO_HABITS.forEach(habit => {
      const p = curveParams[habit.id] || { start: 50, end: 80, noise: 18 };
      const score = improvementCurve(dayIndex, 50, p.start, p.end, p.noise);
      const actVal = scoreToActual(habit, score);
      
      habitScores[habit.id] = score;
      habitValues[habit.id] = actVal;

      let displayValue;
      if (habit.scoringType === 'time') displayValue = formatTimeVal(actVal);
      else if (habit.scoringType === 'binary') displayValue = actVal === 1 ? 'Yes' : 'No';
      else displayValue = actVal + ' ' + habit.unit;

      entries.push({
        id: `${habit.id}_${dateStr}`,
        habitId: habit.id,
        rawValue: actVal,
        computedScore: score,
        entryDate: dateStr,
        displayValue,
        targetValue: habit.targetValue,
      });
    });

    // Overall weighted score
    const priorityWeights = { high: 2, medium: 1.5, low: 1 };
    let weightedSum = 0;
    let totalWeight = 0;
    DEMO_HABITS.forEach(h => {
      const w = priorityWeights[h.priority] || 1;
      weightedSum += habitScores[h.id] * w;
      totalWeight += w;
    });
    const overallScore = clamp(Math.round(weightedSum / totalWeight));

    // Streak logic: in last 14 days, uninterrupted streak
    const isMissed = (dayIndex % 9 === 0) && dayIndex > 0 && dayIndex < 36;
    if (isMissed) {
      streak = 0;
    } else {
      streak += 1;
    }

    const isRecovery = (dayIndex % 9 === 1) && dayIndex > 0 && dayIndex < 36;

    summaries.push({
      id: dateStr,
      date: dateStr,
      overallScore,
      totalScore: overallScore,
      habitsCompleted: DEMO_HABITS.length,
      habitsTotal: DEMO_HABITS.length,
      habitScores,
      habitValues,
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

// Export today's entries for immediate Today Dashboard rendering
export const DEMO_TODAY_ENTRIES = DEMO_SUMMARIES[0]?.entries || [];

export const DEMO_USER_DOC = {
  isPro: true,
  displayName: 'Guest Explorer',
  email: 'guest@definitetracker.com',
  currentStreak: 14,
  longestStreak: 21,
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
  allSummaries: DEMO_SUMMARIES,
  userDoc: DEMO_USER_DOC,
  loadingData: false,
  priorityModeEnabled: true,
};

