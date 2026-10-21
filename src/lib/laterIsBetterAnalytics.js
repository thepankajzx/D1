import { calculateRecoveryScore } from './recoveryAnalytics';
import { HABITS_SEED_DATA } from './premadeHabits';
import { formatTimeVal as formatTimeHelper } from './timeFormat';

// laterIsBetterAnalytics.js
// O(N) single-pass analytics for "Later Is Better" habit scoring type (Time)

const DAYS_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function toDateStr(d) { return d.toISOString().split('T')[0]; }

export function formatTimeVal(minutes, timeFormat) {
  if (minutes === null || minutes === undefined || minutes === '') return 'N/A';
  const res = formatTimeHelper(minutes, timeFormat);
  return res || 'N/A';
}

function getDOWIndex(dateStr) {
  const dow = new Date(dateStr + 'T00:00:00').getDay();
  return dow === 0 ? 6 : dow - 1;
}

export function getLaterIsBetterAnalytics(habit, allSummaries, dateRange) {
  if (!habit || !allSummaries) return null;

  const { start, end } = dateRange;
  const recoveryData = calculateRecoveryScore(allSummaries, habit.id, 7, 30);

  const startDt = new Date(start + 'T00:00:00');
  const endDt   = new Date(end   + 'T00:00:00');
  const diffDays = Math.round((endDt - startDt) / 86400000) + 1;

  const prevEndDt   = new Date(startDt); prevEndDt.setDate(prevEndDt.getDate() - 1);
  const prevStartDt = new Date(prevEndDt); prevStartDt.setDate(prevStartDt.getDate() - (diffDays - 1));
  const prevStart = toDateStr(prevStartDt);
  const prevEnd   = toDateStr(prevEndDt);

  // Robust target resolution
  const seed = HABITS_SEED_DATA.find(s => s.id === habit.id || (habit.name && s.name.toLowerCase() === habit.name.toLowerCase()));
  let isNightHabit = habit.id?.includes('sleep') || habit.id?.includes('bed') || (habit.name && habit.name.toLowerCase().includes('sleep'));

  const rawT100 = (habit.userTarget100 !== undefined && habit.userTarget100 !== null && habit.userTarget100 !== '') 
    ? habit.userTarget100
    : (habit.target100 !== undefined && habit.target100 !== null && habit.target100 !== '')
    ? habit.target100
    : (habit.target !== undefined && habit.target !== null && habit.target !== '')
    ? habit.target
    : (habit.targetValue !== undefined && habit.targetValue !== null && habit.targetValue !== '')
    ? habit.targetValue
    : (seed?.target100 !== undefined ? seed.target100 : 1080);

  const rawT0 = (habit.userTarget0 !== undefined && habit.userTarget0 !== null && habit.userTarget0 !== '')
    ? habit.userTarget0
    : (habit.target0 !== undefined && habit.target0 !== null && habit.target0 !== '')
    ? habit.target0
    : (habit.floor !== undefined && habit.floor !== null && habit.floor !== '')
    ? habit.floor
    : (habit.startValue !== undefined && habit.startValue !== null && habit.startValue !== '')
    ? habit.startValue
    : (seed?.target0 !== undefined ? seed.target0 : 900);

  let targetValue = Number(rawT100);
  if (isNaN(targetValue)) {
    const tv = String(rawT100 || "18:00");
    if (tv.includes(':')) {
      const [h, m] = tv.split(':').map(Number);
      targetValue = (h || 0) * 60 + (m || 0);
    } else {
      targetValue = 1080;
    }
  }

  let target0 = Number(rawT0);
  if (isNaN(target0)) {
    const t0 = String(rawT0 || "15:00");
    if (t0.includes(':')) {
      const [h, m] = t0.split(':').map(Number);
      target0 = (h || 0) * 60 + (m || 0);
    } else {
      target0 = 900;
    }
  }

  // Detect night/bedtime habits to handle midnight wraparound
  isNightHabit = isNightHabit || targetValue >= 12 * 60;

  const normalizeTimeForAvg = (val) => {
    if (val === null || val === undefined || typeof val !== 'number') return null;
    if (isNightHabit && val < 12 * 60) {
      return val + 1440;
    }
    return val;
  };

  const denormalizeAvg = (val) => {
    if (val === null || val === undefined) return null;
    let v = Math.round(val);
    if (isNightHabit && v >= 1440) {
      v = v % 1440;
    }
    return v;
  };

  let scoreSum = 0, normalizedValueSum = 0, trackedDays = 0;
  let prevScoreSum = 0, prevNormalizedValueSum = 0, prevTrackedDays = 0;
  let daysOnTarget = 0;
  let bestValue = -Infinity, bestDate = null;

  const weekdayValueSum   = [0, 0, 0, 0, 0, 0, 0];
  const weekdayScoreSum   = [0, 0, 0, 0, 0, 0, 0];
  const weekdayCounts     = [0, 0, 0, 0, 0, 0, 0];

  const dailyAll = [];
  let longestStreak = 0, curStreak = 0;

  for (let i = 0; i < allSummaries.length; i++) {
    const s = allSummaries[i];
    const score = s.habitScores?.[habit.id];
    let numValue = s.habitValues?.[habit.id];
    
    if (numValue !== null && numValue !== undefined && typeof numValue === 'number') {
      if (numValue > 1440 && isNightHabit) numValue -= 1440;
    } else {
      numValue = null;
    }

    const hasData = score !== null && score !== undefined;
    const normalizedVal = normalizeTimeForAvg(numValue);

    if (s.id >= start && s.id <= end) {
      if (hasData) {
        scoreSum += score;
        if (normalizedVal !== null) normalizedValueSum += normalizedVal;
        trackedDays++;
        if (score >= 100) daysOnTarget++;
        // Later is better means HIGHER time is better
        if (normalizedVal !== null && normalizedVal > bestValue) {
          bestValue = normalizedVal;
          bestDate = s.id;
        }
        const dowIdx = getDOWIndex(s.id);
        weekdayValueSum[dowIdx] += normalizedVal || 0;
        weekdayScoreSum[dowIdx] += score;
        weekdayCounts[dowIdx]++;
      }
      dailyAll.push({ date: s.id, score: hasData ? score : null, value: numValue });
    }

    if (s.id >= prevStart && s.id <= prevEnd && hasData) {
      prevScoreSum += score;
      if (normalizedVal !== null) prevNormalizedValueSum += normalizedVal;
      prevTrackedDays++;
    }
  }

  const orderedDates = dailyAll.sort((a, b) => a.date.localeCompare(b.date));
  orderedDates.forEach(d => {
    if (d.score !== null && d.score >= 100) {
      curStreak++;
      longestStreak = Math.max(longestStreak, curStreak);
    } else {
      curStreak = 0;
    }
  });

  const overallScore = trackedDays > 0 ? Math.round(scoreSum / trackedDays) : 0;
  const rawAvgNormalized = trackedDays > 0 ? (normalizedValueSum / trackedDays) : 0;
  const avgValue = denormalizeAvg(rawAvgNormalized);

  const prevScore = prevTrackedDays > 0 ? Math.round(prevScoreSum / prevTrackedDays) : null;
  const rawPrevAvgNormalized = prevTrackedDays > 0 ? (prevNormalizedValueSum / prevTrackedDays) : null;
  const prevAvgValue = denormalizeAvg(rawPrevAvgNormalized);
  
  const improvement = prevScore !== null ? overallScore - prevScore : null;
  const valueChange = (rawAvgNormalized !== null && rawPrevAvgNormalized !== null) ? Math.round(rawAvgNormalized - rawPrevAvgNormalized) : null;

  const weekdayPattern = DAYS_ORDER.map((day, i) => ({
    day,
    avg: weekdayCounts[i] > 0 ? denormalizeAvg(weekdayValueSum[i] / weekdayCounts[i]) : 0,
    avgScore: weekdayCounts[i] > 0 ? Math.round(weekdayScoreSum[i] / weekdayCounts[i]) : 0,
    count: weekdayCounts[i],
  }));
  const maxWeekdayAvg = Math.max(...weekdayPattern.map(w => w.avg), 0.0001);

  const tracked = weekdayPattern.filter(w => w.count > 0);
  const mostConsistentDay = tracked.length
    ? tracked.reduce((b, w) => w.avgScore > b.avgScore ? w : b, tracked[0]).day
    : 'N/A';
  const weakestDay = tracked.length
    ? tracked.reduce((b, w) => w.avgScore < b.avgScore ? w : b, tracked[0]).day
    : 'N/A';

  let bestWeekAvg = -Infinity;
  for (let i = 0; i <= orderedDates.length - 7; i++) {
    const week = orderedDates.slice(i, i + 7).filter(d => d.value !== null);
    if (week.length === 0) continue;
    const avg = week.reduce((s, d) => s + d.value, 0) / week.length;
    if (avg > bestWeekAvg) bestWeekAvg = Math.round(avg);
  }

  const insights = [];
  if (weakestDay !== 'N/A') {
    insights.push(`You tend to miss your target time most on ${weakestDay}s.`);
  }
  if (improvement !== null && improvement > 0) {
    insights.push(`↗ Score improved by ${improvement}% vs the previous period. Great job!`);
  } else if (improvement !== null && improvement < 0) {
    insights.push(`↘ Score dropped by ${Math.abs(improvement)}% vs last period.`);
  }
  if (daysOnTarget > 0) {
    insights.push(`You were on target on ${daysOnTarget} of ${diffDays} days (${Math.round(daysOnTarget / diffDays * 100)}%).`);
  }
  if (valueChange !== null && valueChange > 0) {
    const hr = Math.floor(valueChange / 60);
    const mn = Math.round(valueChange % 60);
    const timeStr = hr > 0 ? `${hr}h ${mn}m` : `${mn}m`;
    insights.push(`↗ You averaged ${timeStr} later vs last period.`);
  }

  return {
    summary: {
      overallScore,
      avgValue,
      daysOnTarget,
      totalDays: diffDays,
      trackedDays,
    },
    streaks: {
      current: recoveryData.currentStreak !== undefined ? recoveryData.currentStreak : curStreak,
      best: recoveryData.bestStreak !== undefined ? recoveryData.bestStreak : longestStreak,
      recoveryScore: recoveryData.recoveryScore,
      recoveryStreak: recoveryData.recoveryStreak,
      resilienceSummary: recoveryData.resilienceSummary
    },
    recoveryData,
    currentStreak: recoveryData.currentStreak !== undefined ? recoveryData.currentStreak : curStreak,
    bestStreak: recoveryData.bestStreak !== undefined ? recoveryData.bestStreak : longestStreak,
    recoveryScore: recoveryData.recoveryScore,
    recoveryStreak: recoveryData.recoveryStreak,
    resilienceSummary: recoveryData.resilienceSummary,
    targetValue,
    target0,
    unit: 'Time',
    formatVal: formatTimeVal,
    fmtVal: formatTimeVal,
    bestDay: bestDate ? { value: bestValue, date: bestDate } : null,
    improvement,
    valueChange,
    prevScore,
    prevAvgValue,
    weekdayPattern,
    maxWeekdayAvg,
    dailyDetails: [...orderedDates].reverse().slice(0, 10),
    personalBests: {
      bestValue: bestDate ? bestValue : null,
      bestDate,
      bestWeekAvg: bestWeekAvg !== -Infinity ? bestWeekAvg : null,
      longestStreak: recoveryData.bestStreak !== undefined ? recoveryData.bestStreak : longestStreak,
      mostConsistentDay,
    },
    trend: {
      currentAvg: avgValue,
      prevAvg: prevAvgValue,
      change: valueChange,
      currentScore: overallScore,
      prevScore,
    },
    insights,
    weakestDay
  };
}
