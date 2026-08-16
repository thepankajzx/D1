export function calculateScore(scoringType, direction, rawValue, target100, target0) {
  if (scoringType === "binary") return rawValue === 1 ? 100 : 0;
  if (scoringType === "subjective") return null;

  const lowerIsBetter = direction === "lower_is_better";
  
  // Special case for time (sleep time wraparound)
  if (scoringType === "time") {
    // We already handle the +1440 at the component level for sleep time specifically if needed
    // The exact scoring formula remains linear between target100 and target0
  }

  if (lowerIsBetter) {
    if (rawValue <= target100) return 100;
    if (rawValue >= target0) return 0;
    return 100 * (target0 - rawValue) / (target0 - target100);
  } else {
    if (rawValue >= target100) return 100;
    if (rawValue <= target0) return 0;
    return 100 * (rawValue - target0) / (target100 - target0);
  }
}

export function calculateDailySummary(habits, entries, priorityModeEnabled) {
  let scoredHabitsTotal = 0;
  let scoreSum = 0;
  let highestScore = -1;
  let bestHabitId = null;
  let lowestScore = 101;
  let weakestHabitId = null;
  
  let habitsCompleted = 0;
  let habitsTotal = habits.length;

  for (const habit of habits) {
    const entry = entries.find(e => e.habitId === habit.id);
    const score = entry?.computedScore;
    
    // Check if habit is completed (for the completion counter)
    // A habit is considered "completed" if an entry exists and it's not a 0 score (or is subjective)
    if (entry && (habit.scoringType === 'subjective' || score > 0)) {
        habitsCompleted++;
    }

    if (habit.scoringType === 'subjective' || score == null) {
      continue;
    }

    // Weighting logic if Priority Mode is enabled
    // If high priority, it counts as 2 habits for the average.
    const weight = (priorityModeEnabled && habit.priority === 'high') ? 2 : 1;
    
    scoreSum += score * weight;
    scoredHabitsTotal += weight;

    if (score > highestScore) {
      highestScore = score;
      bestHabitId = habit.id;
    }
    if (score < lowestScore) {
      lowestScore = score;
      weakestHabitId = habit.id;
    }
  }

  const overallScore = scoredHabitsTotal > 0 ? Math.round(scoreSum / scoredHabitsTotal) : 0;

  return {
    overallScore,
    habitsCompleted,
    habitsTotal,
    bestHabitId,
    bestHabitScore: highestScore === -1 ? null : highestScore,
    weakestHabitId,
    weakestHabitScore: lowestScore === 101 ? null : lowestScore,
  };
}

export function recalculateStreaks(dailySummaries) {
  // dailySummaries is assumed to be an array of documents ordered by date descending
  // format: [{ id: 'YYYY-MM-DD', overallScore: number }, ...]
  
  const todayStr = new Date().toISOString().split('T')[0];
  let currentStreak = 0;
  let longestStreak = 0;
  
  // Create a map for O(1) lookups by date
  const summaryMap = new Map();
  for (const sum of dailySummaries) {
      summaryMap.set(sum.id, sum);
      
      // Calculate longest streak historically in the loaded data while we're at it
      // This is a naive historical calculation for longest streak from the provided data segment
  }
  
  // Calculate Current Streak
  let checkDate = new Date();
  
  // If today has no summary yet, we might still have a streak ending yesterday.
  // We'll see if today's summary exists.
  const todaySummary = summaryMap.get(todayStr);
  if (todaySummary) {
      currentStreak++;
  }
  
  checkDate.setDate(checkDate.getDate() - 1);
  let streakActive = true;
  
  while(streakActive) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const summary = summaryMap.get(dateStr);
      
      if (summary) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
      } else {
          streakActive = false;
      }
  }

  // Calculate Longest Streak from the historical data
  let tempLongest = 0;
  let currentHistoricalStreak = 0;
  
  // sort ascending to calculate longest streak
  const sortedSummaries = [...dailySummaries].sort((a,b) => a.id.localeCompare(b.id));
  
  let previousDate = null;
  
  for (const sum of sortedSummaries) {
      if (sum) {
          if (!previousDate) {
              currentHistoricalStreak = 1;
          } else {
              const diffTime = Math.abs(new Date(sum.id) - previousDate);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              if (diffDays === 1) {
                  currentHistoricalStreak++;
              } else {
                  currentHistoricalStreak = 1;
              }
          }
          if (currentHistoricalStreak > tempLongest) {
              tempLongest = currentHistoricalStreak;
          }
      } else {
          currentHistoricalStreak = 0;
      }
      previousDate = new Date(sum.id);
  }
  
  // Longest streak could also be the current streak if they just broke the record
  longestStreak = Math.max(tempLongest, currentStreak);

  return { currentStreak, longestStreak };
}
