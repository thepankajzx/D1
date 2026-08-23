import { calculateRecoveryScore } from './recoveryAnalytics';

// optimalRangeAnalytics.js
// O(N) single-pass analytics for "Optimal Range" habit scoring type

const DAYS_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function toDateStr(d) { return d.toISOString().split('T')[0]; }

export function formatVal(val, unit) {
  if (val === null || val === undefined) return 'N/A';
  const rounded = Math.round(val * 10) / 10;
  return unit ? `${rounded} ${unit}` : String(rounded);
}

function getDOWIndex(dateStr) {
  const dow = new Date(dateStr + 'T00:00:00').getDay();
  return dow === 0 ? 6 : dow - 1;
}

export function getOptimalRangeAnalytics(habit, allSummaries, dateRange) {
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

  // Targets for Optimal Range (e.g. 5 = min0, 7 = min100, 9 = max100, 11 = max0)
  // Fallbacks in case they are missing
  const target0 = Number(habit.target0) || 5; 
  const target100 = Number(habit.target100) || 7; 
  const targetMax100 = Number(habit.targetMax || habit.userTargetMax || (target100 + 2)); // default +2 window
  const targetMax0 = Number(habit.targetMax0) || (targetMax100 + (target100 - target0));

  const unit = habit.unit || habit.defaultUnit || habit.customUnit || habit.targetUnit || "";

  let scoreSum = 0, valueSum = 0, trackedDays = 0;
  let prevScoreSum = 0, prevValueSum = 0, prevTrackedDays = 0;
  let daysOnTarget = 0;
  let bestValue = null, bestScore = -1, bestDate = null; // "best" means closest to middle of optimal range

  const weekdayValueSum   = [0, 0, 0, 0, 0, 0, 0];
  const weekdayScoreSum   = [0, 0, 0, 0, 0, 0, 0];
  const weekdayCounts     = [0, 0, 0, 0, 0, 0, 0];

  const dailyAll = [];
  let longestStreak = 0, curStreak = 0;

  for (let i = 0; i < allSummaries.length; i++) {
    const s = allSummaries[i];
    const score = s.habitScores?.[habit.id];
    let numValue = s.habitValues?.[habit.id];
    
    if (numValue !== null && numValue !== undefined) {
      numValue = Number(numValue);
    } else {
      numValue = null;
    }

    const hasData = score !== null && score !== undefined;

    if (s.id >= start && s.id <= end) {
      if (hasData) {
        scoreSum += score;
        if (numValue !== null) valueSum += numValue;
        trackedDays++;
        if (score >= 100) daysOnTarget++;
        
        if (score > bestScore) {
          bestScore = score;
          bestValue = numValue;
          bestDate = s.id;
        }

        const dowIdx = getDOWIndex(s.id);
        weekdayValueSum[dowIdx] += numValue || 0;
        weekdayScoreSum[dowIdx] += score;
        weekdayCounts[dowIdx]++;
      }
      dailyAll.push({ date: s.id, score: hasData ? score : null, value: numValue });
    }

    if (s.id >= prevStart && s.id <= prevEnd && hasData) {
      prevScoreSum += score;
      if (numValue !== null) prevValueSum += numValue;
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
  const avgValue     = trackedDays > 0 ? valueSum / trackedDays : 0;

  const prevScore    = prevTrackedDays > 0 ? Math.round(prevScoreSum / prevTrackedDays) : null;
  const prevAvgValue = prevTrackedDays > 0 ? prevValueSum / prevTrackedDays : null;
  const improvement  = prevScore !== null ? overallScore - prevScore : null;
  const valueChange  = prevAvgValue !== null ? avgValue - prevAvgValue : null;

  const weekdayPattern = DAYS_ORDER.map((day, i) => ({
    day,
    avg: weekdayCounts[i] > 0 ? weekdayValueSum[i] / weekdayCounts[i] : 0,
    avgScore: weekdayCounts[i] > 0 ? weekdayScoreSum[i] / weekdayCounts[i] : 0,
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

  // Best week average (closest to optimal range)
  let bestWeekAvg = null;
  let bestWeekScoreDiff = Infinity;
  for (let i = 0; i <= orderedDates.length - 7; i++) {
    const week = orderedDates.slice(i, i + 7).filter(d => d.value !== null);
    if (week.length === 0) continue;
    const avg = week.reduce((s, d) => s + d.value, 0) / week.length;
    
    // How close is this average to the optimal range?
    let diff = 0;
    if (avg < target100) diff = target100 - avg;
    else if (avg > targetMax100) diff = avg - targetMax100;
    
    if (diff < bestWeekScoreDiff) {
      bestWeekScoreDiff = diff;
      bestWeekAvg = avg;
    }
  }

  const insights = [];
  if (weakestDay !== 'N/A') {
    insights.push(`💡 You tend to miss your optimal range most on ${weakestDay}s.`);
  }
  if (improvement !== null && improvement > 0) {
    insights.push(`↗ Score improved by ${improvement}% vs the previous period.`);
  } else if (improvement !== null && improvement < 0) {
    insights.push(`↘ Score dropped by ${Math.abs(improvement)}% vs last period.`);
  }
  if (daysOnTarget > 0) {
    insights.push(`🎯 You were in the optimal range on ${daysOnTarget} of ${diffDays} days (${Math.round(daysOnTarget / diffDays * 100)}%).`);
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
    target0,
    target100,
    targetMax100,
    targetMax0,
    targetValue: target100 ? (targetMax100 && targetMax100 !== target100 ? `${Math.min(target100, targetMax100)} - ${Math.max(target100, targetMax100)}` : target100) : null,
    unit,
    formatVal: (v) => formatVal(v, unit),
    fmtVal: (v) => formatVal(v, unit),
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
      bestWeekAvg,
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
