/**
 * Daily Insight Intelligence Engine (Pure Deterministic Rule-Based)
 * Scans Today, 7, 14, and 30-day behavioral tracking data to generate human-centered,
 * surprising, actionable insights with explicit date ranges and distinct colors.
 */

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function getRangeLabel(summaries) {
  if (!summaries || summaries.length === 0) return 'Past Days';
  const start = formatDateShort(summaries[0].id || summaries[0].date);
  const end = formatDateShort(summaries[summaries.length - 1].id || summaries[summaries.length - 1].date);
  if (start === end) return start;
  return `${start} – ${end}`;
}

export function generateDailyInsights(habits = [], allSummaries = [], isHinglish = false) {
  if (!habits || habits.length === 0) return [];

  // Sort summaries ascending by date (e.g. 2026-08-01 -> 2026-08-21)
  const sortedSummaries = [...allSummaries].sort((a, b) => ((a.id || a.date) > (b.id || b.date) ? 1 : -1));
  const recent1 = sortedSummaries.slice(-1);
  const recent7 = sortedSummaries.slice(-7);
  const prior7 = sortedSummaries.slice(-14, -7);
  const recent14 = sortedSummaries.slice(-14);
  const recent30 = sortedSummaries.slice(-30);

  const range7Str = getRangeLabel(recent7);
  const prior7Str = getRangeLabel(prior7);
  const range14Str = getRangeLabel(recent14);
  const range30Str = getRangeLabel(recent30);

  const insights = [];

  // Helper map: habitId -> habit object
  const habitMap = {};
  habits.forEach(h => { habitMap[h.id] = h; });

  const getPriorityBoost = (habitId) => {
    const h = habitMap[habitId];
    return h?.isPriority || h?.priorityRank ? 5 : 0;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. TODAY'S DAILY INSIGHTS (Today's Momentum & Quick Triggers)
  // ─────────────────────────────────────────────────────────────────────────────
  if (recent7.length >= 2) {
    const latest = recent7[recent7.length - 1];
    const prev = recent7[recent7.length - 2];

    habits.forEach(h => {
      const todayScore = latest?.habitScores?.[h.id] ?? 0;
      const prevScore = prev?.habitScores?.[h.id] ?? 0;

      if (todayScore >= 100 && prevScore < 50) {
        insights.push({
          id: `today_surge_${h.id}`,
          timeframe: 'today',
          dateCategory: 'Today',
          type: 'daily_momentum',
          category: 'TODAY',
          timeScope: 'Today vs Yesterday',
          dateRange: 'Today',
          badge: { label: 'DAILY SURGE', color: 'emerald' },
          icon: 'Lightning',
          headline: isHinglish
            ? `Aaj ${h.name} me zabardast comeback! Score 100% hit hua`
            : `Strong daily comeback in ${h.name}! Score hit 100% today`,
          subtitle: isHinglish
            ? `Kal ke low score ke baad aaj perfect target achieve kiya`
            : `Achieved 100% target today following a slower yesterday`,
          body: isHinglish
            ? `Aapne bina kisi delay ke ${h.name} ko aaj top priority dekar reset kar diya. Is daily momentum ko kal bhi continue rakho.`
            : `You prioritized ${h.name} today to immediately bounce back. Carry this proactive momentum into tomorrow.`,
          visualType: 'comparison',
          visualData: { bar1Label: 'Yesterday', bar1Val: prevScore, bar2Label: 'Today', bar2Val: 100, accentColor: 'emerald' },
          actionLabel: `${h.name} Deep Dive`,
          actionHabitId: h.id,
          impactScore: 96 + getPriorityBoost(h.id)
        });
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. WEEKLY INSIGHTS (7-Day Trends, Slopes, Rebounds)
  // ─────────────────────────────────────────────────────────────────────────────
  habits.forEach(h => {
    if (recent7.length >= 5) {
      const scores7 = recent7.map(s => s.habitScores?.[h.id] ?? 0);
      const firstScore = scores7[0];
      const lastScore = scores7[scores7.length - 1];

      // Consistent Improvement (Rising Star)
      let isIncreasing = true;
      for (let k = 1; k < scores7.length; k++) {
        if (scores7[k] < scores7[k - 1] - 5) { isIncreasing = false; break; }
      }
      if (isIncreasing && lastScore - firstScore >= 25) {
        insights.push({
          id: `trend_up_${h.id}`,
          timeframe: 'weekly',
          dateCategory: 'Weekly',
          type: 'trend',
          category: 'GROWTH',
          timeScope: 'Last 7 Days',
          dateRange: range7Str,
          badge: { label: 'RISING STAR', color: 'emerald' },
          icon: 'TrendUp',
          headline: isHinglish
            ? `Zabardast momentum! ${h.name} lagatar 7 dino se upar badh raha hai`
            : `Solid momentum! ${h.name} has climbed 7 days straight`,
          subtitle: isHinglish
            ? `Score ${firstScore}% se jump karke ${lastScore}% ho gaya`
            : `Score surged from ${firstScore}% to ${lastScore}%`,
          body: isHinglish
            ? `Pichhle hafte ${h.name} ka pace ${firstScore}% tha, aur aaj aap ${lastScore}% par cruise kar rahe ho. Is consistency ko banaye rakho!`
            : `Last week your pace on ${h.name} was ${firstScore}%, and today you are cruising at ${lastScore}%. Keep this rhythm alive!`,
          visualType: 'sparkline',
          visualData: { points: scores7, label: h.name, isPositive: true, accentColor: 'emerald' },
          actionLabel: `${h.name} Deep Dive`,
          actionHabitId: h.id,
          impactScore: 95 + getPriorityBoost(h.id)
        });
      }

      // Consistent Drop (Attention Needed)
      let isDecreasing = true;
      for (let k = 1; k < scores7.length; k++) {
        if (scores7[k] > scores7[k - 1] + 5) { isDecreasing = false; break; }
      }
      if (isDecreasing && firstScore - lastScore >= 30) {
        insights.push({
          id: `trend_down_${h.id}`,
          timeframe: 'weekly',
          dateCategory: 'Weekly',
          type: 'trend',
          category: 'WARNING',
          timeScope: 'Last 7 Days',
          dateRange: range7Str,
          badge: { label: 'ATTENTION NEEDED', color: 'rose' },
          icon: 'TrendDown',
          headline: isHinglish
            ? `${h.name} ka score thoda neeche slip ho raha hai`
            : `${h.name} score is experiencing a downward slide`,
          subtitle: isHinglish
            ? `${firstScore}% se gir kar ${lastScore}% ho gaya`
            : `Flipped from ${firstScore}% down to ${lastScore}%`,
          body: isHinglish
            ? `Pehle iski performance strong thi, lekin abhi thoda slip hua hai. Aaj ek chhoti session se friction kam karke reset karo.`
            : `Performance was strong earlier, but has slipped recently. Lower the friction today with a small session to reset the slope.`,
          visualType: 'sparkline',
          visualData: { points: scores7, label: h.name, isPositive: false, accentColor: 'rose' },
          actionLabel: `${h.name} Deep Dive`,
          actionHabitId: h.id,
          impactScore: 92 + getPriorityBoost(h.id)
        });
      }

      // U-Shape Comeback Hero
      const minMid = Math.min(...scores7.slice(1, -1));
      if (firstScore >= 70 && minMid <= 35 && lastScore >= 75) {
        insights.push({
          id: `trend_ushape_${h.id}`,
          timeframe: 'weekly',
          dateCategory: 'Weekly',
          type: 'trend',
          category: 'RECOVERY',
          timeScope: 'Last 7 Days',
          dateRange: range7Str,
          badge: { label: 'COMEBACK HERO', color: 'violet' },
          icon: 'ShieldCheck',
          headline: isHinglish
            ? `Kamaal ka rebound! Aapne ${h.name} ke slump ko reverse kar diya`
            : `Remarkable rebound! You reversed the slump on ${h.name}`,
          subtitle: isHinglish
            ? `Mid-week me ${minMid}% gira, par wapas ${lastScore}% par bounce back kiya`
            : `Dipped to ${minMid}% mid-week, bounced back to ${lastScore}%`,
          body: isHinglish
            ? `Aap ${minMid}% ke low point par the, lekin zabardast resilience dikha kar wapas 75%+ par aa gaye. Ye bounce-back speed hi habits banati hai!`
            : `You hit a low point of ${minMid}%, but showed strong resilience by climbing right back to 75%+. That bounce-back ability is what builds lifelong habits!`,
          visualType: 'sparkline',
          visualData: { points: scores7, label: h.name, isPositive: true, accentColor: 'violet' },
          actionLabel: 'Resilience Hub',
          actionRoute: `/analytics/recovery?habitId=${h.id}`,
          impactScore: 98 + getPriorityBoost(h.id)
        });
      }
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. 14-DAY INSIGHTS (Bi-Weekly Trajectory & Stabilization)
  // ─────────────────────────────────────────────────────────────────────────────
  if (recent14.length >= 10) {
    const first7 = recent14.slice(0, 7);
    const second7 = recent14.slice(7);

    habits.forEach(h => {
      const avgFirst = Math.round(first7.reduce((acc, s) => acc + (s.habitScores?.[h.id] ?? 0), 0) / first7.length);
      const avgSecond = Math.round(second7.reduce((acc, s) => acc + (s.habitScores?.[h.id] ?? 0), 0) / second7.length);
      const delta = avgSecond - avgFirst;

      if (delta >= 20 && avgSecond >= 70) {
        insights.push({
          id: `biweekly_lift_${h.id}`,
          timeframe: 'days14',
          dateCategory: '14 Days',
          type: 'biweekly_trend',
          category: 'GROWTH',
          timeScope: '14-Day Comparison',
          dateRange: range14Str,
          badge: { label: 'BI-WEEKLY SURGE', color: 'sky' },
          icon: 'ChartBar',
          headline: isHinglish
            ? `${h.name} me pichhle 14 dino me ++${delta}% ka solid shift dekha gaya`
            : `${h.name} surged by +${delta}% over the past 14 days`,
          subtitle: isHinglish
            ? `Pichhla hafta: ${avgFirst}% ➔ Yeh hafta: ${avgSecond}%`
            : `Previous Week: ${avgFirst}% ➔ Current Week: ${avgSecond}%`,
          body: isHinglish
            ? `Aapka 14-day trajectory dikhata hai ki ${h.name} ab aapke daily lifestyle ka ek pakka hissa ban chuka hai.`
            : `Your 14-day trajectory indicates ${h.name} is successfully crystallizing into an automatic lifestyle routine.`,
          visualType: 'comparison',
          visualData: { bar1Label: 'Prior 7 Days', bar1Val: avgFirst, bar2Label: 'Recent 7 Days', bar2Val: avgSecond, accentColor: 'sky' },
          actionLabel: `${h.name} Deep Dive`,
          actionHabitId: h.id,
          impactScore: 94 + getPriorityBoost(h.id)
        });
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. 30-DAY INSIGHTS (Power Duos, Keystone Habits & Day Anomalies)
  // ─────────────────────────────────────────────────────────────────────────────
  if (recent30.length >= 7 && habits.length >= 2) {
    for (let i = 0; i < habits.length; i++) {
      for (let j = i + 1; j < habits.length; j++) {
        const hA = habits[i];
        const hB = habits[j];

        let bothHigh = 0;
        let aHighBlow = 0;
        let aHighCount = 0;

        recent30.forEach(s => {
          const scoreA = s.habitScores?.[hA.id];
          const scoreB = s.habitScores?.[hB.id];
          if (scoreA !== undefined && scoreA !== null && scoreB !== undefined && scoreB !== null) {
            if (scoreA >= 70) {
              aHighCount++;
              if (scoreB >= 70) bothHigh++;
              if (scoreB < 40) aHighBlow++;
            }
          }
        });

        // 4A. Positive Power Duo
        if (aHighCount >= 4 && (bothHigh / aHighCount) >= 0.65) {
          const pct = Math.round((bothHigh / aHighCount) * 100);
          insights.push({
            id: `corr_pos_${hA.id}_${hB.id}`,
            timeframe: 'days30',
            dateCategory: '30 Days',
            type: 'correlation',
            category: 'CORRELATION',
            timeScope: '30-Day Analysis',
            dateRange: range30Str,
            badge: { label: 'POWER DUO', color: 'sky' },
            icon: 'PlugsConnected',
            headline: isHinglish
              ? `Jab aap ${hA.name} complete karte ho, to ${hB.name} bhi top par rehta hai`
              : `When you conquer ${hA.name}, your ${hB.name} thrives too`,
            subtitle: `${hA.name} + ${hB.name} = Power Combo`,
            body: isHinglish
              ? `Pichhle mahine me ${pct}% dino par jab ${hA.name} ka score 70+ raha, tab ${hB.name} bhi top par raha. Ye aapka sabse strong synergy hai.`
              : `On ${pct}% of days across the last month when ${hA.name} scored 70+, your ${hB.name} was also at the top. This is your strongest behavioral synergy.`,
            visualType: 'overlap',
            visualData: { habitA: hA.name, habitB: hB.name, percentage: pct, accentColor: 'sky' },
            actionLabel: `${hA.name} Deep Dive`,
            actionHabitId: hA.id,
            impactScore: 99 + getPriorityBoost(hA.id)
          });
        }

        // 4B. Focus Drain
        if (aHighCount >= 4 && (aHighBlow / aHighCount) >= 0.60) {
          const pct = Math.round((aHighBlow / aHighCount) * 100);
          insights.push({
            id: `corr_neg_${hA.id}_${hB.id}`,
            timeframe: 'days30',
            dateCategory: '30 Days',
            type: 'correlation',
            category: 'CORRELATION',
            timeScope: '30-Day Analysis',
            dateRange: range30Str,
            badge: { label: 'FOCUS DRAIN', color: 'amber' },
            icon: 'BatteryLow',
            headline: isHinglish
              ? `${hA.name} par zyada focus karne se ${hB.name} ka score thoda girta hai`
              : `Heavy focus on ${hA.name} seems to drain your ${hB.name}`,
            subtitle: `${hA.name} vs ${hB.name} Energy Trade-off`,
            body: isHinglish
              ? `${pct}% dino par jab ${hA.name} peak par tha, tab ${hB.name} 40% se neeche gaya. In habits ko din ke alag-alag time par schedule karo.`
              : `On ${pct}% of days when ${hA.name} peaked, ${hB.name} fell below 40%. Consider spacing these habits across different parts of the day.`,
            visualType: 'overlap',
            visualData: { habitA: hA.name, habitB: hB.name, percentage: pct, isNegative: true, accentColor: 'amber' },
            actionLabel: `${hB.name} Deep Dive`,
            actionHabitId: hB.id,
            impactScore: 93 + getPriorityBoost(hB.id)
          });
        }
      }
    }
  }

  // 4C. Keystone Habit
  if (recent30.length >= 10 && habits.length >= 3) {
    let bestKeystone = null;
    let maxOverallLift = 0;

    habits.forEach(h => {
      let daysWithH = 0;
      let scoreSumWithH = 0;
      let daysWithoutH = 0;
      let scoreSumWithoutH = 0;

      recent30.forEach(s => {
        const score = s.habitScores?.[h.id];
        const overall = s.overallScore;
        if (score !== undefined && overall !== undefined) {
          if (score >= 80) {
            daysWithH++;
            scoreSumWithH += overall;
          } else if (score < 40) {
            daysWithoutH++;
            scoreSumWithoutH += overall;
          }
        }
      });

      if (daysWithH >= 3 && daysWithoutH >= 3) {
        const avgWith = scoreSumWithH / daysWithH;
        const avgWithout = scoreSumWithoutH / daysWithoutH;
        const lift = avgWith - avgWithout;
        if (lift > maxOverallLift && lift >= 20) {
          maxOverallLift = lift;
          bestKeystone = { habit: h, lift: Math.round(lift), avgWith: Math.round(avgWith), avgWithout: Math.round(avgWithout) };
        }
      }
    });

    if (bestKeystone) {
      insights.push({
        id: `keystone_${bestKeystone.habit.id}`,
        timeframe: 'days30',
        dateCategory: '30 Days',
        type: 'keystone',
        category: 'CATALYST',
        timeScope: '30-Day Analysis',
        dateRange: range30Str,
        badge: { label: 'KEYSTONE HABIT', color: 'purple' },
        icon: 'Crown',
        headline: isHinglish
          ? `${bestKeystone.habit.name} aapke poore din ka master catalyst hai`
          : `${bestKeystone.habit.name} is your master catalyst for the day`,
        subtitle: isHinglish
          ? `Overall daily score me +${bestKeystone.lift}% ka massive boost`
          : `Unlocks +${bestKeystone.lift}% higher overall daily score`,
        body: isHinglish
          ? `Jab aap ${bestKeystone.habit.name} complete karte ho, to overall completion average ${bestKeystone.avgWith}% rehta hai (miss hone par sirf ${bestKeystone.avgWithout}%). Is habit ko subah pehle protect karo!`
          : `When you hit your target on ${bestKeystone.habit.name}, your overall habit completion averages ${bestKeystone.avgWith}% (vs ${bestKeystone.avgWithout}% when missed). Protect this habit first!`,
        visualType: 'comparison',
        visualData: { bar1Label: `With ${bestKeystone.habit.name}`, bar1Val: bestKeystone.avgWith, bar2Label: 'Without It', bar2Val: bestKeystone.avgWithout, accentColor: 'purple' },
        actionLabel: `${bestKeystone.habit.name} Deep Dive`,
        actionHabitId: bestKeystone.habit.id,
        impactScore: 97 + getPriorityBoost(bestKeystone.habit.id)
      });
    }
  }

  // 4D. Anomalies
  if (recent30.length >= 10) {
    const dayStats = { 0: { total: 0, count: 0, label: 'Sunday' }, 1: { total: 0, count: 0, label: 'Monday' } };
    let nonSunTotal = 0;
    let nonSunCount = 0;

    recent30.forEach(s => {
      if (s.overallScore !== undefined && s.overallScore !== null) {
        const d = new Date(s.id + 'T00:00:00');
        const day = d.getDay();
        if (day === 0) {
          dayStats[0].total += s.overallScore;
          dayStats[0].count++;
        } else {
          nonSunTotal += s.overallScore;
          nonSunCount++;
          if (day === 1) {
            dayStats[1].total += s.overallScore;
            dayStats[1].count++;
          }
        }
      }
    });

    if (dayStats[0].count >= 2 && nonSunCount >= 6) {
      const sunAvg = Math.round(dayStats[0].total / dayStats[0].count);
      const restAvg = Math.round(nonSunTotal / nonSunCount);
      if (restAvg - sunAvg >= 25) {
        const diff = restAvg - sunAvg;
        insights.push({
          id: 'anomaly_sunday_slump',
          timeframe: 'days30',
          dateCategory: '30 Days',
          type: 'anomaly',
          category: 'PATTERN',
          timeScope: '30-Day Day Rhythm',
          dateRange: range30Str,
          badge: { label: 'SUNDAY SLUMP', color: 'orange' },
          icon: 'ChartLineUp',
          headline: isHinglish
            ? `Sundays ko aapka habit score ${diff}% tak gir jata hai`
            : `Your habit score drops by ${diff}% on Sundays`,
          subtitle: isHinglish
            ? `Sunday Avg: ${sunAvg}% vs Weekdays: ${restAvg}%`
            : `Sunday Avg: ${sunAvg}% vs Weekdays: ${restAvg}%`,
          body: isHinglish
            ? `Sundays ko consistency thodi kam ho jati hai. Perfection ke peeche bhaagne ke bajaye bas 1-2 core habits maintain karke rhythm banaye rakho.`
            : `Consistency takes a noticeable dip on Sundays. Rather than aiming for perfection, maintain just 1-2 core anchor habits to stay in rhythm.`,
          visualType: 'comparison',
          visualData: { bar1Label: 'Weekdays Avg', bar1Val: restAvg, bar2Label: 'Sunday Avg', bar2Val: sunAvg, accentColor: 'orange' },
          actionLabel: 'Explore Analytics',
          actionRoute: '/analytics',
          impactScore: 90
        });
      }
    }

    if (dayStats[1].count >= 2 && nonSunCount >= 6) {
      const monAvg = Math.round(dayStats[1].total / dayStats[1].count);
      const restAvg = Math.round(nonSunTotal / nonSunCount);
      if (monAvg - restAvg >= 15) {
        insights.push({
          id: 'anomaly_monday_champion',
          timeframe: 'days30',
          dateCategory: '30 Days',
          type: 'anomaly',
          category: 'MOMENTUM',
          timeScope: '30-Day Day Rhythm',
          dateRange: range30Str,
          badge: { label: 'MONDAY CHAMPION', color: 'teal' },
          icon: 'ChartLineUp',
          headline: isHinglish
            ? `Mondays aapka sabse peak discipline powerhouse din hai`
            : `Mondays are your peak discipline powerhouse`,
          subtitle: isHinglish
            ? `Monday Avg: ${monAvg}% (baki dino me ${restAvg}%)`
            : `Monday Avg: ${monAvg}% (vs ${restAvg}% overall)`,
          body: isHinglish
            ? `Fresh Start Effect aapke liye kamaal ka kaam karta hai. Monday ki will-power momentum ko poore hafte aage le jao!`
            : `The Fresh Start Effect works wonders for you. Your willpower peaks on Monday mornings — ride this momentum into midweek!`,
          visualType: 'comparison',
          visualData: { bar1Label: 'Monday Avg', bar1Val: monAvg, bar2Label: 'Other Days', bar2Val: restAvg, accentColor: 'teal' },
          actionLabel: 'Explore Analytics',
          actionRoute: '/analytics',
          impactScore: 87
        });
      }
    }
  }

  // Sort insights by impact score descending
  return insights.sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0));
}
