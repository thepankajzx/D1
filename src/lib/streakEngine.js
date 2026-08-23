/**
 * streakEngine.js
 * "Steady Fire" Habit Streak & Consistency Engine
 * 
 * Computes:
 * - Current Streak (Active consecutive days)
 * - Longest Streak (All-time personal best)
 * - Consistency Rate (% of active days in timeframe)
 * - Milestone Progress (Next trophy goal e.g. 3, 7, 14, 21, 30, 60, 90, 180, 365 days)
 */

export const MILESTONE_TARGETS = [3, 7, 14, 21, 30, 60, 90, 180, 365];

/**
 * Calculates current and longest streak for a specific habit or overall composite
 * @param {string} habitId 'all' or specific habit ID
 * @param {Array} summaries Array of daily summaries [{ id: 'YYYY-MM-DD', overallScore: number, habitScores: {} }]
 * @param {string} [referenceDateStr] Target date string 'YYYY-MM-DD', defaults to today
 * @returns {{ currentStreak: number, longestStreak: number, activeDays: number, totalDays: number }}
 */
export function calculateStreakData(habitId = 'all', summaries = [], referenceDateStr = null) {
  if (!summaries || summaries.length === 0) {
    return { currentStreak: 0, longestStreak: 0, activeDays: 0, totalDays: 0 };
  }

  const todayStr = referenceDateStr || new Date().toISOString().split('T')[0];
  const sorted = [...summaries].filter(s => s.id <= todayStr).sort((a, b) => a.id.localeCompare(b.id));

  if (sorted.length === 0) {
    return { currentStreak: 0, longestStreak: 0, activeDays: 0, totalDays: 0 };
  }

  const scoreMap = new Map();
  sorted.forEach(s => {
    let score = 0;
    if (habitId === 'all') {
      score = s.overallScore || 0;
    } else {
      score = (s.habitScores && s.habitScores[habitId] !== undefined) ? s.habitScores[habitId] : 0;
    }
    scoreMap.set(s.id, score);
  });

  // Calculate longest streak across history
  const firstDate = new Date(sorted[0].id + 'T00:00:00');
  const lastDate = new Date(todayStr + 'T00:00:00');

  let longestStreak = 0;
  let tempStreak = 0;
  let activeDays = 0;
  let totalDays = 0;
  const current = new Date(firstDate);

  while (current <= lastDate) {
    totalDays++;
    const dStr = current.toISOString().split('T')[0];
    const score = scoreMap.get(dStr) || 0;

    if (score > 0) {
      activeDays++;
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
    current.setDate(current.getDate() + 1);
  }

  // Calculate current streak (with grace period for today if not yet logged)
  let currentStreak = 0;
  const checkDate = new Date(lastDate);
  const todayScore = scoreMap.get(todayStr) || 0;

  if (todayScore > 0) {
    while (true) {
      const dStr = checkDate.toISOString().split('T')[0];
      const s = scoreMap.get(dStr) || 0;
      if (s > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  } else {
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = checkDate.toISOString().split('T')[0];
    const yesterdayScore = scoreMap.get(yesterdayStr) || 0;

    if (yesterdayScore > 0) {
      while (true) {
        const dStr = checkDate.toISOString().split('T')[0];
        const s = scoreMap.get(dStr) || 0;
        if (s > 0) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    activeDays,
    totalDays
  };
}

/**
 * Calculates consistency rate over a trailing window (default 30 days)
 * @param {string} habitId 'all' or habit ID
 * @param {Array} summaries Array of summaries
 * @param {number} days Window duration in days (default 30)
 * @param {string} [referenceDateStr] Target date
 * @returns {{ consistencyPct: number, activeDaysInWindow: number, windowDays: number }}
 */
export function calculateConsistencyRate(habitId = 'all', summaries = [], days = 30, referenceDateStr = null) {
  const todayStr = referenceDateStr || new Date().toISOString().split('T')[0];
  const refDate = new Date(todayStr + 'T00:00:00');
  
  const scoreMap = new Map();
  summaries.forEach(s => {
    let score = 0;
    if (habitId === 'all') {
      score = s.overallScore || 0;
    } else {
      score = (s.habitScores && s.habitScores[habitId] !== undefined) ? s.habitScores[habitId] : 0;
    }
    scoreMap.set(s.id, score);
  });

  let activeCount = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(refDate);
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    const score = scoreMap.get(dStr) || 0;
    if (score > 0) {
      activeCount++;
    }
  }

  const consistencyPct = Math.round((activeCount / days) * 100);

  return {
    consistencyPct,
    activeDaysInWindow: activeCount,
    windowDays: days
  };
}

/**
 * Calculates milestone progress for current streak
 * @param {number} currentStreak Current streak count
 * @returns {{ target: number, remaining: number, label: string, progressPct: number, isUnlocked: boolean }}
 */
export function getNextMilestone(currentStreak = 0) {
  let target = MILESTONE_TARGETS[MILESTONE_TARGETS.length - 1];
  for (const m of MILESTONE_TARGETS) {
    if (currentStreak < m) {
      target = m;
      break;
    }
  }

  const remaining = Math.max(0, target - currentStreak);
  const prevTarget = MILESTONE_TARGETS.filter(m => m < target).pop() || 0;
  const progressPct = target > prevTarget 
    ? Math.min(100, Math.round(((currentStreak - prevTarget) / (target - prevTarget)) * 100))
    : 100;

  let label = '';
  if (remaining === 0) {
    label = '🎉 ' + target + '-Day Legend!';
  } else if (remaining === 1) {
    label = '🔥 1 day to ' + target + 'd badge';
  } else {
    label = '🔥 ' + remaining + ' days to ' + target + 'd badge';
  }

  return {
    target,
    remaining,
    label,
    progressPct,
    isUnlocked: currentStreak >= target
  };
}

/**
 * Gets the current highest unlocked milestone for a streak
 * @param {number} currentStreak
 * @returns {{ title: string, days: number, isUnlocked: boolean, color: string, badgeName: string }}
 */
export function getCurrentMilestone(currentStreak = 0) {
  const definitions = [
    { days: 365, title: 'Grandmaster', badgeName: 'Grandmaster (365d)', color: 'text-amber-500 bg-amber-500/15 border-amber-500/30' },
    { days: 180, title: 'Titan', badgeName: 'Titan (180d)', color: 'text-amber-600 bg-amber-500/15 border-amber-500/30' },
    { days: 90, title: 'New Identity', badgeName: 'New Identity (90d)', color: 'text-rose-500 bg-rose-500/15 border-rose-500/30' },
    { days: 60, title: 'Unstoppable', badgeName: 'Unstoppable (60d)', color: 'text-purple-500 bg-purple-500/15 border-purple-500/30' },
    { days: 30, title: 'Solid Iron', badgeName: 'Solid Iron (30d)', color: 'text-blue-500 bg-blue-500/15 border-blue-500/30' },
    { days: 21, title: 'Neural Path', badgeName: 'Neural Path (21d)', color: 'text-cyan-500 bg-cyan-500/15 border-cyan-500/30' },
    { days: 14, title: 'Habit Seed', badgeName: 'Habit Seed (14d)', color: 'text-emerald-500 bg-emerald-500/15 border-emerald-500/30' },
    { days: 7, title: 'Momentum', badgeName: 'Momentum (7d)', color: 'text-orange-500 bg-orange-500/15 border-orange-500/30' },
    { days: 3, title: 'Ignition', badgeName: 'Ignition (3d)', color: 'text-amber-500 bg-amber-500/15 border-amber-500/30' }
  ];

  const unlocked = definitions.find(d => currentStreak >= d.days);
  if (unlocked) {
    return {
      title: unlocked.title,
      days: unlocked.days,
      badgeName: unlocked.badgeName,
      color: unlocked.color,
      isUnlocked: true
    };
  }

  return {
    title: 'Starter',
    days: 0,
    badgeName: 'Starter Tier',
    color: 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    isUnlocked: false
  };
}
