/**
 * Recovery Analytics for Habit Deep Dive
 * Computes Recovery Score, Recovery Streak, regular Streaks, and resilience rating
 * Entirely client-side from allSummaries (localStorage / Firestore snapshot).
 */

/**
 * Helper to get status color classes for resilience badge
 */
export function getResilienceBadgeClasses(summary, score) {
  if (score === null || score === undefined || summary === "Flawless Streak" || summary === "Flawless") {
    return {
      badge: "text-emerald-300 bg-emerald-500/20 border-emerald-400/30",
      text: "text-emerald-400",
      dot: "bg-emerald-400"
    };
  }
  if (score >= 80 || (summary && summary.includes("High"))) {
    return {
      badge: "text-emerald-300 bg-emerald-500/20 border-emerald-400/30",
      text: "text-emerald-400",
      dot: "bg-emerald-400"
    };
  }
  if (score >= 60 || (summary && (summary.includes("Moderate") || summary.includes("Steady")))) {
    return {
      badge: "text-amber-300 bg-amber-500/20 border-amber-400/30",
      text: "text-amber-400",
      dot: "bg-amber-400"
    };
  }
  return {
    badge: "text-rose-300 bg-rose-500/20 border-rose-400/30",
    text: "text-rose-400",
    dot: "bg-rose-400"
  };
}

/**
 * @param {Array} allSummaries - array of daily summary objects.
 * @param {string} habitId
 * @param {number} recoveryWindow - days to check after a miss (default 7)
 * @param {number} lookbackDays - total past days to consider (default 30)
 * @param {number} successThreshold - recovery rate above which a miss is considered "recovered" (default 70)
 * @param {string} [habitCreatedAt] - ISO string or date string of when the habit was created
 * @returns {{
 *   recoveryScore: number|null,
 *   totalMisses: number,
 *   recoveryStreak: number,
 *   bestRecoveryStreak: number,
 *   currentStreak: number,
 *   bestStreak: number,
 *   resilienceSummary: string,
 *   successThreshold: number,
 *   recoveryWindow: number,
 *   misses: Array<{ date: string, recoveryRate: number, recovered: boolean, isInProgress: boolean }>,
 *   hasEnoughData: boolean,
 *   trackedDaysCount: number
 * }}
 */
export function calculateRecoveryScore(
  allSummaries = [],
  habitId,
  recoveryWindow = 7,
  lookbackDays = 30,
  successThreshold = 70,
  habitCreatedAt = null
) {
  if (!allSummaries || !habitId) {
    return {
      recoveryScore: null,
      totalMisses: 0,
      recoveryStreak: 0,
      bestRecoveryStreak: 0,
      currentStreak: 0,
      bestStreak: 0,
      resilienceSummary: "Flawless Streak",
      successThreshold,
      recoveryWindow,
      misses: [],
      hasEnoughData: false,
      trackedDaysCount: 0
    };
  }

  // 1. Build lookup for all recorded summaries for this specific habit
  const dateMap = {};
  const recordedDates = [];
  for (const summary of allSummaries) {
    const day = summary.date || summary.id;
    if (!day) continue;

    let isCompleted = false;
    let hasRecord = false;

    if (summary.habits && summary.habits[habitId] !== undefined) {
      hasRecord = true;
      const hObj = summary.habits[habitId];
      if (typeof hObj === 'boolean') {
        isCompleted = hObj;
      } else if (hObj && typeof hObj === 'object') {
        isCompleted = hObj.completed === true || (typeof hObj.score === 'number' && hObj.score >= 60);
      }
    } else if (summary.habitScores && summary.habitScores[habitId] !== undefined) {
      hasRecord = true;
      const score = summary.habitScores[habitId];
      isCompleted = score !== null && score >= 60;
    }

    if (hasRecord) {
      dateMap[day] = isCompleted;
      recordedDates.push(day);
    }
  }

  // If the user has never tracked this habit or has 0 entries
  if (recordedDates.length === 0) {
    return {
      recoveryScore: null,
      totalMisses: 0,
      recoveryStreak: 0,
      bestRecoveryStreak: 0,
      currentStreak: 0,
      bestStreak: 0,
      resilienceSummary: "Flawless Streak",
      successThreshold,
      recoveryWindow,
      misses: [],
      hasEnoughData: false,
      trackedDaysCount: 0
    };
  }

  // 2. Determine earliest valid tracking date for this habit
  recordedDates.sort();
  const earliestRecordedDate = recordedDates[0];
  let startDate = earliestRecordedDate;
  if (habitCreatedAt) {
    const d = new Date(habitCreatedAt);
    if (!isNaN(d.getTime())) {
      const createdDateStr = d.toISOString().split('T')[0];
      if (createdDateStr < startDate) {
        startDate = createdDateStr;
      }
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoffDate = new Date(today);
  cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

  const startScanDateObj = new Date(startDate + 'T00:00:00');
  // Start scan strictly from the later of cutoffDate or the habit's actual start date
  const effectiveStart = startScanDateObj > cutoffDate ? startScanDateObj : cutoffDate;
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // If the habit was started today, no past full days exist to evaluate misses
  const allDates = [];
  const scanDate = new Date(effectiveStart);
  while (scanDate <= yesterday) {
    allDates.push(scanDate.toISOString().split('T')[0]);
    scanDate.setDate(scanDate.getDate() + 1);
  }

  // 3. Identify all misses ONLY within the active tracking window
  const misses = [];
  for (const date of allDates) {
    const completed = dateMap[date];
    if (completed === false || completed === undefined) {
      misses.push(date);
    }
  }

  // 4. Compute recovery rate for each miss
  const missDetails = [];
  for (const missDate of misses) {
    const missDay = new Date(missDate + 'T00:00:00');
    let recoveredDays = 0;
    let daysEvaluated = 0;
    const endWindowDay = new Date(missDay);
    endWindowDay.setDate(endWindowDay.getDate() + recoveryWindow);
    const endWindowDateStr = endWindowDay.toISOString().split('T')[0];

    // Check next recoveryWindow days
    for (let i = 1; i <= recoveryWindow; i++) {
      const checkDay = new Date(missDay);
      checkDay.setDate(checkDay.getDate() + i);
      const checkDateStr = checkDay.toISOString().split('T')[0];
      if (checkDay <= today) {
        daysEvaluated++;
        if (dateMap[checkDateStr] === true) {
          recoveredDays++;
        }
      }
    }
    const rate = daysEvaluated > 0 ? (recoveredDays / recoveryWindow) * 100 : 0;
    const recovered = rate >= successThreshold;
    const isInProgress = daysEvaluated < recoveryWindow && !recovered;
    missDetails.push({ 
      date: missDate, 
      missDate, 
      endDate: endWindowDateStr, 
      recoveryRate: Math.round(rate * 10) / 10, 
      recoveredDays, 
      daysEvaluated, 
      recoveryWindow,
      recovered, 
      isInProgress 
    });
  }

  // Recovery Score: average recovery rate across all misses (if any), else null (no misses yet)
  const totalMisses = missDetails.length;
  const recoveryScore = totalMisses > 0
    ? Math.round((missDetails.reduce((sum, m) => sum + m.recoveryRate, 0) / totalMisses) * 10) / 10
    : null;

  // Recovery Streak: consecutive successful recoveries (most recent first)
  let recoveryStreak = 0;
  for (let i = missDetails.length - 1; i >= 0; i--) {
    if (missDetails[i].recovered) {
      recoveryStreak++;
    } else {
      break;
    }
  }

  // Best Recovery Streak in the period
  let bestRecoveryStreak = 0;
  let tempRecStreak = 0;
  for (const m of missDetails) {
    if (m.recovered) {
      tempRecStreak++;
      if (tempRecStreak > bestRecoveryStreak) bestRecoveryStreak = tempRecStreak;
    } else {
      tempRecStreak = 0;
    }
  }
  bestRecoveryStreak = Math.max(bestRecoveryStreak, recoveryStreak);

  // Today's status (if completed today, add to streak)
  const todayStr = today.toISOString().split('T')[0];
  const todayCompleted = dateMap[todayStr] === true;

  // Regular streaks: current streak
  let currentStreak = todayCompleted ? 1 : 0;
  for (let i = allDates.length - 1; i >= 0; i--) {
    const date = allDates[i];
    if (dateMap[date] === true) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Best streak ever (within the lookback period)
  let bestStreak = 0;
  let tempStreak = 0;
  for (const date of allDates) {
    if (dateMap[date] === true) {
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }
  if (todayCompleted && currentStreak > bestStreak) {
    bestStreak = currentStreak;
  }

  // Resilience summary labels
  let resilienceSummary;
  if (totalMisses === 0) {
    resilienceSummary = "Flawless Streak";
  } else if (recoveryScore !== null && recoveryScore >= 80) {
    resilienceSummary = "High Resilience";
  } else if (recoveryScore !== null && recoveryScore >= 60) {
    resilienceSummary = "Moderate Resilience";
  } else {
    resilienceSummary = "Building Resilience";
  }

  const hasEnoughData = recordedDates.length >= 7;

  return {
    recoveryScore,
    totalMisses,
    recoveryStreak,
    bestRecoveryStreak: bestRecoveryStreak || recoveryStreak,
    currentStreak,
    bestStreak,
    successThreshold,
    recoveryWindow,
    resilienceSummary,
    misses: missDetails,
    hasEnoughData,
    trackedDaysCount: recordedDates.length
  };
}
