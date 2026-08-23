function computeStreaks(allSummaries, endDate, habitId = 'overall') {
  const sorted = [...allSummaries].filter(s => s.id <= endDate).sort((a, b) => a.id.localeCompare(b.id));
  
  if (sorted.length === 0) return { currentStreak: 0, bestStreak: 0 };

  const scoreMap = new Map();
  sorted.forEach(s => {
    let score = 0;
    if (habitId === 'overall') {
      score = s.overallScore || 0;
    } else {
      score = (s.habitScores && s.habitScores[habitId] !== undefined) ? s.habitScores[habitId] : 0;
    }
    scoreMap.set(s.id, score);
  });

  const firstDate = new Date(sorted[0].id);
  const lastDate = new Date(endDate);
  
  let bestStreak = 0;
  let tempStreak = 0;
  let current = new Date(firstDate);
  
  while (current <= lastDate) {
    const dateStr = current.toISOString().split('T')[0];
    const score = scoreMap.get(dateStr) || 0;
    if (score >= 60) {
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
    current.setDate(current.getDate() + 1);
  }

  let currentStreak = 0;
  let checkDate = new Date(endDate);
  
  const endStr = checkDate.toISOString().split('T')[0];
  const endScore = scoreMap.get(endStr) || 0;
  
  if (endScore >= 60) {
    while (true) {
      const dStr = checkDate.toISOString().split('T')[0];
      const s = scoreMap.get(dStr) || 0;
      if (s >= 60) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  } else {
    checkDate.setDate(checkDate.getDate() - 1);
    const yestStr = checkDate.toISOString().split('T')[0];
    const yestScore = scoreMap.get(yestStr) || 0;
    if (yestScore >= 60) {
      while (true) {
        const dStr = checkDate.toISOString().split('T')[0];
        const s = scoreMap.get(dStr) || 0;
        if (s >= 60) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }

  return { currentStreak, bestStreak };
}

export function computeKPIs(summaries, startDate, endDate, allSummaries = []) {
  let weightedScoreSum = 0;
  let totalHabitsRecorded = 0;
  let expectedHabitsTotal = 0;
  
  let count = 0;
  let highestScore = -1;
  let bestDay = null;
  let lowestScore = 101;
  let worstDay = null;
  
  let daysWithEntry = 0;

  for (const sum of summaries) {
    if (sum.id >= startDate && sum.id <= endDate) {
      if (sum.overallScore !== undefined && sum.overallScore !== null) {
        const recordedCount = sum.habitsCompleted ?? 1;
        const totalCount = sum.habitsTotal ?? recordedCount;
        
        weightedScoreSum += (sum.overallScore * recordedCount);
        totalHabitsRecorded += recordedCount;
        expectedHabitsTotal += totalCount;
        
        count++;
        
        if (sum.overallScore > highestScore) {
          highestScore = sum.overallScore;
          bestDay = sum.id;
        }
        if (sum.overallScore < lowestScore) {
          lowestScore = sum.overallScore;
          worstDay = sum.id;
        }
      }
      
      if (sum.habitsCompleted > 0) {
          daysWithEntry++;
      }
    }
  }

  // To compute tracked days, we need total days in range
  const start = new Date(startDate);
  const end = new Date(endDate);
  // inclusive
  const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
  
  const { currentStreak, bestStreak } = computeStreaks(allSummaries, endDate, 'overall');
  
  return {
    averageScore: totalHabitsRecorded > 0 ? Math.round(weightedScoreSum / totalHabitsRecorded) : 0,
    totalHabitsRecorded,
    expectedHabitsTotal,
    dataCoverage: expectedHabitsTotal > 0 ? Math.round((totalHabitsRecorded / expectedHabitsTotal) * 100) : 0,
    bestDay: bestDay,
    bestDayScore: highestScore === -1 ? null : highestScore,
    lowestDay: worstDay,
    lowestDayScore: lowestScore === 101 ? null : lowestScore,
    consistency: Math.round((daysWithEntry / totalDays) * 100) || 0,
    trackedDays: daysWithEntry,
    totalDays: totalDays,
    currentStreak,
    bestStreak
  };
}

export function formatLocalDate(date) {
  if (!date) return '';
  if (typeof date === 'string') {
    if (date.length === 10 && date.includes('-')) return date;
    const parts = date.split('T')[0].split('-');
    if (parts.length === 3) return date.split('T')[0];
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateHeatmapGrid(summaries, filterMode, selectedHabitId, startDate, endDate) {
  // A heatmap usually shows columns of weeks, 7 rows per column (Mon - Sun).
  const datesByMonth = new Map();
  
  // Parse startDate and endDate safely into year, month, day components
  const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
  const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
  
  let current = new Date(sYear, sMonth - 1, sDay, 12, 0, 0);
  const end = new Date(eYear, eMonth - 1, eDay, 12, 0, 0);
  
  while (current <= end) {
    const monthKey = `${current.getFullYear()}-${current.getMonth()}`;
    if (!datesByMonth.has(monthKey)) {
      datesByMonth.set(monthKey, []);
    }
    datesByMonth.get(monthKey).push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // Pre-process scores into a map for fast lookup
  const scoreMap = new Map();
  if (filterMode === 'overall') {
    summaries.forEach(s => {
      scoreMap.set(s.id, {
          score: s.overallScore,
          meta: s
      });
    });
  } else {
    // Per-habit filter
    summaries.forEach(s => {
      if (s.habitScores && s.habitScores[selectedHabitId] !== undefined) {
        scoreMap.set(s.id, {
            score: s.habitScores[selectedHabitId],
            meta: s
        });
      }
    });
  }

  const result = [];
  
  for (const [monthKey, monthDates] of datesByMonth.entries()) {
    const firstDay = monthDates[0];
    const dayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0
    
    const paddedDates = Array(dayOfWeek).fill(null).concat(monthDates);
    
    const gridCells = paddedDates.map(date => {
      if (!date) return { isPad: true };
      
      const dateStr = formatLocalDate(date);
      const data = scoreMap.get(dateStr);
      const score = data?.score !== undefined && data?.score !== null ? data.score : null;
      
      let perfBand = 0;
      if (score !== null) {
        if (score <= 10) perfBand = 1;
        else if (score <= 20) perfBand = 2;
        else if (score <= 30) perfBand = 3;
        else if (score <= 40) perfBand = 4;
        else if (score <= 50) perfBand = 5;
        else if (score <= 60) perfBand = 6;
        else if (score <= 70) perfBand = 7;
        else if (score <= 80) perfBand = 8;
        else if (score <= 90) perfBand = 9;
        else perfBand = 10;
      }
      
      return {
        isPad: false,
        date: dateStr,
        score: score,
        perfBand: perfBand,
        meta: data?.meta
      };
    });
    
    const monthLabel = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    result.push({
      monthLabel,
      cells: gridCells
    });
  }
  
  return result;
}

export function computeHabitBreakdown(habits, summaries, startDate, endDate, allSummaries = []) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
  
  const breakdown = habits.map(habit => {
    let sum = 0;
    let count = 0;
    let max = -1;
    let maxDate = null;
    let min = 101;
    let minDate = null;
    let daysWithEntry = 0;
    
    summaries.forEach(s => {
      if (s.id >= startDate && s.id <= endDate) {
        if (s.habitScores && s.habitScores[habit.id] !== undefined) {
          const score = s.habitScores[habit.id];
          if (score !== null && score !== undefined) {
            sum += score;
            count++;
            if (score > max) { max = score; maxDate = s.id; }
            if (score < min) { min = score; minDate = s.id; }
          }
          daysWithEntry++;
        }
      }
    });
    
    const avgScore = count > 0 ? sum / count : 0;
    const consistency = Math.round((daysWithEntry / totalDays) * 100) || 0;
    
    const { currentStreak, bestStreak } = computeStreaks(allSummaries, endDate, habit.id);
    
    return {
      ...habit,
      avgScore,
      consistency,
      bestScore: max === -1 ? null : max,
      bestDate: maxDate,
      lowestScore: min === 101 ? null : min,
      lowestDate: minDate,
      trackedDays: daysWithEntry,
      totalDays,
      currentStreak,
      bestStreak
    };
  });
  
  // Exclude purely subjective habits from ranking if desired, 
  // but we want to show them in the breakdown so users can see their entries.
  return breakdown.sort((a, b) => b.consistency - a.consistency);
}

export function identifyAreasToImprove(breakdown) {
  // surface bottom 2-3 where average < 70
  const needsImprovement = breakdown.filter(h => h.avgScore < 70);
  return needsImprovement.slice(0, 3);
}
