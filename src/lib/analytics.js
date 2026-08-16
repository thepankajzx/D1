export function computeKPIs(summaries, startDate, endDate) {
  let scoreSum = 0;
  let count = 0;
  let highestScore = -1;
  let bestDay = null;
  let lowestScore = 101;
  let worstDay = null;
  
  let daysWithEntry = 0;

  for (const sum of summaries) {
    if (sum.id >= startDate && sum.id <= endDate) {
      if (sum.overallScore !== undefined) {
        scoreSum += sum.overallScore;
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
  
  return {
    averageScore: count > 0 ? Math.round(scoreSum / count) : 0,
    bestDay: bestDay,
    bestDayScore: highestScore === -1 ? null : highestScore,
    lowestDay: worstDay,
    lowestDayScore: lowestScore === 101 ? null : lowestScore,
    consistency: Math.round((daysWithEntry / totalDays) * 100) || 0,
    trackedDays: daysWithEntry,
    totalDays: totalDays
  };
}

export function generateHeatmapGrid(summaries, filterMode, selectedHabitId, startDate, endDate) {
  // A heatmap usually shows columns of weeks, 7 rows per column (Mon - Sun).
  const datesByMonth = new Map();
  let current = new Date(startDate);
  const end = new Date(endDate);
  
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
      
      const dateStr = date.toISOString().split('T')[0];
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

export function computeHabitBreakdown(habits, summaries, startDate, endDate) {
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
    
    return {
      ...habit,
      avgScore,
      consistency,
      bestScore: max === -1 ? null : max,
      bestDate: maxDate,
      lowestScore: min === 101 ? null : min,
      lowestDate: minDate,
      trackedDays: daysWithEntry,
      totalDays
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
