import { calculateRecoveryScore } from './recoveryAnalytics';

export function getBinaryDeepDiveAnalytics(habit, allSummaries, dateRange) {
  if (!habit || !allSummaries) return null;

  const { start, end } = dateRange;
  const recoveryData = calculateRecoveryScore(allSummaries, habit.id, 7, 30);
  
  // 1. Time-boxing: Filter data for current period and previous period
  const currentData = [];
  const previousData = [];
  
  const startDt = new Date(start);
  const endDt = new Date(end);
  const diffTime = Math.abs(endDt - startDt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  const prevStartDt = new Date(startDt);
  prevStartDt.setDate(prevStartDt.getDate() - diffDays);
  const prevEndDt = new Date(startDt);
  prevEndDt.setDate(prevEndDt.getDate() - 1);
  
  const prevStart = prevStartDt.toISOString().split('T')[0];
  const prevEnd = prevEndDt.toISOString().split('T')[0];

  let successfulDays = 0;
  let missedDays = 0;
  let prevSuccessfulDays = 0;
  let prevMissedDays = 0;

  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
  const weekdaySuccess = [0, 0, 0, 0, 0, 0, 0];
  const daily = [];
  
  for (let i = 0; i < allSummaries.length; i++) {
    const s = allSummaries[i];
    const score = s.habitScores?.[habit.id];
    const rawValue = s.habitValues?.[habit.id];
    const hasData = score !== undefined && score !== null;
    
    if (s.id >= start && s.id <= end) {
      currentData.push(s);
      let val = null;
      let isSuccess = false;
      let isMiss = false;
      
      if (hasData) {
        if (score >= 60) {
          successfulDays++;
          isSuccess = true;
          val = true;
        } else {
          missedDays++;
          isMiss = true;
          val = false;
        }
      }
      
      daily.push({
        date: s.id,
        value: val,
        score: hasData ? score : null,
        status: isSuccess ? 'SUCCESS' : (isMiss ? 'FAILED' : 'NO_DATA')
      });
      
      if (isSuccess || isMiss) {
        const d = new Date(s.id);
        const dayIdx = d.getDay();
        weekdayCounts[dayIdx]++;
        if (isSuccess) weekdaySuccess[dayIdx]++;
      }
    } else if (s.id >= prevStart && s.id <= prevEnd) {
      previousData.push(s);
      if (hasData) {
        if (score >= 60) prevSuccessfulDays++;
        else prevMissedDays++;
      }
    }
  }

  const heatmap = [];
  let curr = new Date(start);
  while (curr <= endDt) {
    const dStr = curr.toISOString().split('T')[0];
    const existing = daily.find(d => d.date === dStr);
    if (existing) {
      heatmap.push(existing);
    } else {
      heatmap.push({ date: dStr, value: null, score: null, status: 'NO_DATA' });
    }
    curr.setDate(curr.getDate() + 1);
  }

  const trackedDays = successfulDays + missedDays;
  const overallScore = trackedDays > 0 ? Math.round((successfulDays / trackedDays) * 100) : 0;
  
  const prevTrackedDays = prevSuccessfulDays + prevMissedDays;
  const prevOverallScore = prevTrackedDays > 0 ? Math.round((prevSuccessfulDays / prevTrackedDays) * 100) : 0;

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  
  const sortedAll = [...allSummaries].filter(s => s.id <= end).sort((a, b) => a.id.localeCompare(b.id));
  const scoreMap = new Map();
  sortedAll.forEach(s => {
    if (s.habitScores && s.habitScores[habit.id] !== undefined) {
      scoreMap.set(s.id, s.habitScores[habit.id]);
    }
  });
  
  if (sortedAll.length > 0) {
    let checkDate = new Date(sortedAll[0].id);
    const endCheck = new Date(end);
    
    while (checkDate <= endCheck) {
      const dStr = checkDate.toISOString().split('T')[0];
      const sScore = scoreMap.get(dStr) || 0;
      if (sScore >= 60) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }
    
    let cDate = new Date(end);
    let firstMissFound = false;
    
    const todayStr = end; 
    if (scoreMap.has(todayStr) === false) {
       cDate.setDate(cDate.getDate() - 1);
    }

    while (!firstMissFound) {
       const dStr = cDate.toISOString().split('T')[0];
       if (dStr < sortedAll[0].id) break;
       
       if (scoreMap.has(dStr)) {
         const sc = scoreMap.get(dStr);
         if (sc >= 60) {
            currentStreak++;
         } else {
            firstMissFound = true;
         }
       } else {
         firstMissFound = true;
       }
       cDate.setDate(cDate.getDate() - 1);
    }
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const patternsObj = {};
  let mostConsistentDay = null;
  let bestRate = -1;
  
  days.forEach((day, idx) => {
    const count = weekdayCounts[idx];
    const succ = weekdaySuccess[idx];
    const rate = count > 0 ? Math.round((succ / count) * 100) : null;
    patternsObj[day.toLowerCase()] = rate;
    
    if (rate !== null && rate > bestRate) {
      bestRate = rate;
      mostConsistentDay = day;
    }
  });

  const patterns = {
    monday: patternsObj.monday,
    tuesday: patternsObj.tuesday,
    wednesday: patternsObj.wednesday,
    thursday: patternsObj.thursday,
    friday: patternsObj.friday,
    saturday: patternsObj.saturday,
    sunday: patternsObj.sunday,
  };

  const impacts = [];
  const otherHabitIds = new Set();
  currentData.forEach(s => {
    if (s.habitScores) {
      Object.keys(s.habitScores).forEach(hId => {
        if (hId !== habit.id) otherHabitIds.add(hId);
      });
    }
  });
  
  otherHabitIds.forEach(otherId => {
    let otherWhenYesTotal = 0;
    let otherWhenYesCount = 0;
    let otherWhenNoTotal = 0;
    let otherWhenNoCount = 0;
    
    currentData.forEach(s => {
      const myScore = s.habitScores?.[habit.id];
      const otherScore = s.habitScores?.[otherId];
      
      if (myScore !== undefined && otherScore !== undefined) {
        if (myScore >= 60) {
          otherWhenYesTotal += otherScore;
          otherWhenYesCount++;
        } else {
          otherWhenNoTotal += otherScore;
          otherWhenNoCount++;
        }
      }
    });
    
    if (otherWhenYesCount >= 3 && otherWhenNoCount >= 1) {
      const yesAvg = Math.round(otherWhenYesTotal / otherWhenYesCount);
      const noAvg = Math.round(otherWhenNoTotal / otherWhenNoCount);
      const diff = yesAvg - noAvg;
      
      if (diff >= 10) {
        impacts.push({
          habitId: otherId,
          difference: diff
        });
      }
    }
  });

  impacts.sort((a, b) => b.difference - a.difference);

  let bestMonth = null;
  let bestMonthScore = -1;
  const monthlyStats = {};
  
  sortedAll.forEach(s => {
    if (s.habitScores && s.habitScores[habit.id] !== undefined) {
      const monthKey = s.id.substring(0, 7);
      if (!monthlyStats[monthKey]) monthlyStats[monthKey] = { total: 0, succ: 0 };
      monthlyStats[monthKey].total++;
      if (s.habitScores[habit.id] >= 60) monthlyStats[monthKey].succ++;
    }
  });
  
  Object.keys(monthlyStats).forEach(m => {
    const stat = monthlyStats[m];
    if (stat.total >= 10) {
      const rate = Math.round((stat.succ / stat.total) * 100);
      if (rate > bestMonthScore) {
        bestMonthScore = rate;
        const [yy, mm] = m.split('-');
        const dateObj = new Date(yy, parseInt(mm)-1, 1);
        bestMonth = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
      }
    }
  });

  const insights = [];
  if (currentStreak > 0) {
    insights.push(`You're on a ${currentStreak}-day streak. One more successful day makes ${currentStreak + 1}.`);
  }
  
  const diffTrend = overallScore - prevOverallScore;
  if (trackedDays >= 5 && prevTrackedDays >= 5) {
    if (diffTrend >= 10) {
      insights.push(`Consistency improved by ${diffTrend}% this period. Keep the routine!`);
    } else if (diffTrend <= -10) {
      insights.push(`Consistency dropped by ${Math.abs(diffTrend)}%. Time to get back on track.`);
    }
  }

  let weekdayTotal = 0, weekdayCount = 0;
  let weekendTotal = 0, weekendCount = 0;
  
  [1, 2, 3, 4, 5].forEach(i => {
    weekdayCount += weekdayCounts[i];
    weekdayTotal += weekdaySuccess[i];
  });
  [0, 6].forEach(i => {
    weekendCount += weekdayCounts[i];
    weekendTotal += weekdaySuccess[i];
  });
  
  const wRate = weekdayCount > 0 ? Math.round(weekdayTotal/weekdayCount*100) : 0;
  const weRate = weekendCount > 0 ? Math.round(weekendTotal/weekendCount*100) : 0;
  
  if (weekdayCount >= 3 && weekendCount >= 2) {
    if (wRate - weRate >= 20) {
      insights.push(`You perform better on weekdays (${wRate}%) than weekends (${weRate}%).`);
    } else if (weRate - wRate >= 20) {
      insights.push(`You perform better on weekends (${weRate}%) than weekdays (${wRate}%).`);
    }
  }

  return {
    template: 'BINARY',
    habit: habit,
    period: dateRange,
    summary: {
      overallScore,
      totalDays: diffDays,
      successfulDays,
      missedDays,
      trackedDays
    },
    streaks: {
      current: recoveryData.currentStreak !== undefined ? recoveryData.currentStreak : currentStreak,
      best: recoveryData.bestStreak !== undefined ? recoveryData.bestStreak : bestStreak,
      recoveryScore: recoveryData.recoveryScore,
      recoveryStreak: recoveryData.recoveryStreak,
      resilienceSummary: recoveryData.resilienceSummary
    },
    recoveryData: recoveryData,
    trend: {
      currentPeriodScore: overallScore,
      previousPeriodScore: prevOverallScore,
      change: diffTrend
    },
    distribution: {
      completed: successfulDays,
      missed: missedDays,
      noData: diffDays - trackedDays
    },
    daily: heatmap.filter(d => d.status !== 'NO_DATA').reverse(),
    heatmap: heatmap,
    patterns,
    personalBests: {
      bestMonthScore: bestMonthScore > -1 ? { value: bestMonthScore, period: bestMonth } : null,
      mostConsistentDay: bestRate > -1 ? mostConsistentDay : null
    },
    impacts: impacts.slice(0, 3),
    insights: insights.slice(0, 3)
  };
}

