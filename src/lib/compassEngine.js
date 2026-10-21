/**
 * compassEngine.js
 * Intelligence engine for "Today's Compass" (आज का कम्पास).
 *
 * Core Psychology & Features:
 * 1. Aaj Ka Trishul - Top 3 Focus Habits ranked by leverage, resilience defense, and habit formation.
 * 2. Resilience Pulse - Trajectory health bar with context-aware bounce-back recommendations.
 * 3. Drag Alert - Root-cause detection of habits dragging down overall rhythm with feasible micro action / tactical advisory.
 * 4. Guru's Whisper - Contextual philosophical doses (Kintsugi, Sumi-e, Candle wisdom).
 * 5. Quick Win - Standalone zero-friction micro-actions (+2 points).
 */

function getTodayDateStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format any habit target into human-friendly representation (e.g. 6:00 AM, 10:00 PM, 3 Liters, 45 mins)
 */
export function formatHabitTarget(habit) {
  if (!habit) return '';
  const isTime = habit.scoringType === 'time' || habit.unit === 'Time' || habit.unit === 'time' || habit.id === 'wakeup' || habit.id === 'sleep';
  const targetVal = habit.target100 !== undefined && habit.target100 !== null 
    ? habit.target100 
    : (habit.userTarget100 !== undefined ? habit.userTarget100 : (habit.target !== undefined ? habit.target : 10));
  
  if (isTime) {
    if (typeof targetVal === 'string' && targetVal.includes(':')) {
      const [hStr, mStr] = targetVal.split(':');
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10) || 0;
      const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
    }
    const num = Number(targetVal) || 0;
    let h = Math.floor(num / 60);
    const m = Math.floor(num % 60);
    const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  if (habit.scoringType === 'binary' || habit.scoringType === 'yn') {
    return 'Yes / No';
  }

  const rawUnit = (habit.unit && habit.unit !== 'Time' && habit.unit !== 'time') 
    ? habit.unit 
    : (habit.defaultUnit && habit.defaultUnit !== 'time' ? habit.defaultUnit : '');
  return `${targetVal} ${rawUnit}`.trim();
}

/**
 * Intelligent catalog of on-the-spot scalable Micro/Mini modes.
 * Non-splittable habits like sleep, wakeup, fasting return isFeasible: false with smart tactical tips.
 */
export function getHabitMicroModeInfo(habit) {
  if (!habit) return { isFeasible: false };

  const id = (habit.id || '').toLowerCase();
  const name = (habit.name || '').toLowerCase();

  // 1. Workout / Physical Exercise
  if (id.includes('workout') || name.includes('workout') || name.includes('exercise') || name.includes('gym')) {
    return {
      isFeasible: true,
      labelEn: '2-Min Stretch / 10 Pushups',
      labelHi: '2-मिनट स्ट्रेच या 10 पुशअप्स',
      actionEn: 'Do a quick 2-minute body stretch or 10 squats/pushups right on the spot.',
      actionHi: 'अभी इसी जगह 2 मिनट का बॉडी स्ट्रेच या 10 पुशअप्स/उठक-बैठक करो।',
      miniTarget: '2 mins'
    };
  }

  // 2. Walking / Steps
  if (id.includes('walk') || name.includes('walk') || name.includes('step')) {
    return {
      isFeasible: true,
      labelEn: '500 Steps / 5-Min Stroll',
      labelHi: '500 कदम या 5-मिनट वॉक',
      actionEn: 'Take a quick 5-minute walk around the room or hallway (500 steps).',
      actionHi: 'कमरे या छत पर 5 मिनट की तेज़ वॉक (लगभग 500 कदम) पूरी करो।',
      miniTarget: '500 steps'
    };
  }

  // 3. Hydration
  if (id.includes('water') || name.includes('water') || name.includes('hydrat')) {
    return {
      isFeasible: true,
      labelEn: '1 Glass (300ml) Water',
      labelHi: '1 बड़ा गिलास (300ml) पानी',
      actionEn: 'Drink 1 full glass of fresh water right now to re-energize.',
      actionHi: 'अभी 1 बड़ा गिलास ताज़ा पानी पियो और तुरंत एनर्जी रीसेट करो।',
      miniTarget: '300 ml'
    };
  }

  // 4. Meditation / Breath
  if (id.includes('meditat') || name.includes('meditat') || name.includes('breath')) {
    return {
      isFeasible: true,
      labelEn: '1-Min Box Breathing',
      labelHi: '1-मिनट शांत श्वास (Box Breathing)',
      actionEn: 'Close your eyes and take 4 deep, slow breaths for 1 minute.',
      actionHi: 'आँखें बंद करो और 1 मिनट के लिए 4 गहरी, शांत साँसें लो।',
      miniTarget: '1 min'
    };
  }

  // 5. Reading
  if (id.includes('read') || name.includes('read') || name.includes('book')) {
    return {
      isFeasible: true,
      labelEn: 'Read 2 Pages / 3 Mins',
      labelHi: '2 पेज या 3 मिनट पढ़ाई',
      actionEn: 'Open your book and read just 2 pages or 3 minutes without distractions.',
      actionHi: 'किताब खोलो और बिना किसी भटकाव के सिर्फ 2 पेज पढ़ो।',
      miniTarget: '2 pages'
    };
  }

  // 6. Journaling
  if (id.includes('journal') || name.includes('journal') || name.includes('write')) {
    return {
      isFeasible: true,
      labelEn: 'Write 1 Line Gratitude',
      labelHi: '1 लाइन का विचार या आभार',
      actionEn: 'Write down 1 single sentence of gratitude or what went well today.',
      actionHi: 'कागज़ या फोन पर सिर्फ 1 वाक्य लिखो कि आज क्या अच्छा हुआ।',
      miniTarget: '1 line'
    };
  }

  // 7. Focus / Pomodoro / Deep Work
  if (id.includes('deepwork') || id.includes('pomodoro') || name.includes('focus') || name.includes('study') || name.includes('work')) {
    return {
      isFeasible: true,
      labelEn: '10-Min Focus Sprint',
      labelHi: '10-मिनट का फोकस स्प्रिंट',
      actionEn: 'Put your phone away and do a pure 10-minute sprint on your main task.',
      actionHi: 'फोन अलग रखो और 10 मिनट का एक सिंगल-टास्क फोकस राउंड पूरा करो।',
      miniTarget: '10 mins'
    };
  }

  // 8. Cold Shower / Face Splash
  if (id.includes('coldshower') || name.includes('cold shower')) {
    return {
      isFeasible: true,
      labelEn: 'Cold Face Splash (30s)',
      labelHi: '30s ठंडे पानी से मुँह धोना',
      actionEn: 'Splash cold water on your face and wrists for an instant dopaminergic reset.',
      actionHi: 'चेहरे और कलाई पर 30 सेकंड ठंडा पानी छिड़को - तुरंत ताजगी मिलेगी।',
      miniTarget: '30 sec'
    };
  }

  // 9. Check if custom habit is duration/number
  if (habit.scoringType === 'number' || habit.scoringType === 'numeric' || habit.scoringType === 'duration') {
    const rawTarget = Number(habit.target100) || 10;
    if (rawTarget > 1) {
      const scaled = Math.max(1, Math.round(rawTarget * 0.25));
      const u = habit.unit || '';
      return {
        isFeasible: true,
        labelEn: `Mini Target: ${scaled} ${u}`,
        labelHi: `मिनी टारगेट: ${scaled} ${u}`,
        actionEn: `Complete an effortless 25% mini-version (${scaled} ${u}) to protect your momentum.`,
        actionHi: `आलस से बचने के लिए सिर्फ 25% हिस्सा (${scaled} ${u}) पूरा करो और लय बचाओ।`,
        miniTarget: `${scaled} ${u}`
      };
    }
  }

  // 10. Non-splittable habits: Sleep, Wakeup, Screen Time, Fasting, Alcohol Free
  let tacticalAdvisoryEn = 'Focus on protecting your evening wind-down routine today.';
  let tacticalAdvisoryHi = 'आज समय पर सोने और स्क्रीन दूर रखने की तैयारी पहले से करो।';

  if (id.includes('sleep') || id.includes('wakeup') || name.includes('sleep') || name.includes('wake')) {
    tacticalAdvisoryEn = 'Prepare wind-down 30m prior: dim lights and keep phone outside the bedroom.';
    tacticalAdvisoryHi = 'सोने से 30 मिनट पहले रोशनी धीमी करो और फोन को बिस्तर से दूर रखो।';
  } else if (id.includes('screen') || name.includes('screen')) {
    tacticalAdvisoryEn = 'Turn on grayscale mode and keep phone in another room during focus hours.';
    tacticalAdvisoryHi = 'फोन में ग्रे-स्केल मोड ऑन करो और काम के वक्त फोन दूर रखो।';
  } else if (id.includes('alcohol') || id.includes('smoke') || name.includes('alcohol') || name.includes('smoke')) {
    tacticalAdvisoryEn = 'Replace craving with cold sparkling water, herbal tea, or mint.';
    tacticalAdvisoryHi = 'जब भी तलब लगे, तुरंत 1 गिलास ठंडा पानी पियो या गहरी सांस लो।';
  }

  return {
    isFeasible: false,
    tacticalAdvisoryEn,
    tacticalAdvisoryHi
  };
}

const GURU_QUOTES = {
  missedRecently: [
    {
      author: 'Kintsugi Master (किन्त्सुगी दर्शन)',
      en: 'Kintsugi teaches that the break is where the gold belongs. What you repair today becomes your strongest foundation.',
      hi: 'किन्त्सुगी कहता है - टूटने के बाद जुड़ना ही असली ख़ूबसूरती है। आज का दिन सुनहरा जोड़ है।',
      theme: 'gold'
    },
    {
      author: 'Zen Parable (ज़ेन नीति)',
      en: 'A fallen branch feeds the roots of the mightiest cedar. Reset without guilt, move with grace.',
      hi: 'गिरा हुआ पत्ता पेड़ की जड़ों को ही पोषण देता है। बिना पछतावे के आज फिर शुरुआत करो।',
      theme: 'emerald'
    }
  ],
  streakGoingStrong: [
    {
      author: 'Sumi-e Master (सुमी-ए दर्शन)',
      en: 'Seven unbroken brushstrokes form the spine of a masterwork. Keep your wrist fluid and your mind still.',
      hi: 'सुमी-ए मास्टर कहते हैं - लगातार सात ब्रश स्ट्रोक एक उत्कृष्ट कृति की नींव हैं। अपनी लय बनाए रखो।',
      theme: 'amber'
    },
    {
      author: 'Samurai Discipline (बुशिडो ज्ञान)',
      en: 'Momentum is a river carved one drop at a time. Today you expand the banks.',
      hi: 'प्रवाह एक-एक बूँद से ही नदी बनता है। आज तुम्हारी साधना इसे और गहरा करेगी।',
      theme: 'indigo'
    }
  ],
  resilienceDipping: [
    {
      author: 'The Candle Keeper (दीप दर्शन)',
      en: 'The flame may flicker in the wind, but it does not extinguish. Take one deep breath and complete just one small act.',
      hi: 'मोमबत्ती की लौ हवा में काँपती है, लेकिन बुझती नहीं। आज एक गहरी साँस लो और सिर्फ एक छोटा काम पूरा करो।',
      theme: 'rose'
    },
    {
      author: 'Stoic Whisper (धैर्य वचन)',
      en: 'You do not need to move the mountain today. Just place one warm stone in your path.',
      hi: 'आज पूरा पहाड़ हिलाने की ज़रूरत नहीं है। बस अपनी राह में एक सही कदम बढ़ाओ।',
      theme: 'orange'
    }
  ],
  defaultWisdom: [
    {
      author: 'Mindful Compass (दैनिक सूत्र)',
      en: 'Action creates clarity, not the other way around. Begin with the lightest step.',
      hi: 'कर्म से स्पष्टता आती है, सोचने से नहीं। सबसे आसान कदम से शुरुआत करो।',
      theme: 'cyan'
    },
    {
      author: 'Ancient Kaizen (काइज़ेन विचार)',
      en: 'One percent of devotion today compounds into an unshakeable destiny tomorrow.',
      hi: 'आज का 1% का समर्पण कल का अटूट सामर्थ्य बन जाता है।',
      theme: 'sky'
    }
  ]
};

const MICRO_WINS = [
  {
    id: 'mw_water',
    title: 'Hydration Charge',
    titleHindi: '1 गिलास पानी पियो',
    desc: 'Drink 1 full glass of water right now to clear mental fog.',
    descHindi: 'अभी 1 गिलास ताज़ा पानी पियो और दिमाग को तुरंत तरोताज़ा करो।',
    icon: 'Drop',
    points: 2
  },
  {
    id: 'mw_breath',
    title: '4-7-8 Breath Reset',
    titleHindi: '3 गहरी सांसें लो (Breath Reset)',
    desc: 'Inhale for 4s, hold for 7s, exhale for 8s to calm the nervous system.',
    descHindi: 'गहरी सांस अंदर लो, 4 सेकंड रोको और धीरे-धीरे छोड़ो - तनाव गायब।',
    icon: 'Wind',
    points: 2
  },
  {
    id: 'mw_posture',
    title: 'Spine & Shoulder Alignment',
    titleHindi: 'कंधे ढीले करो व रीढ़ सीधी करो',
    desc: 'Roll your shoulders back, stand tall, and release forehead tension.',
    descHindi: 'कंधों को पीछे घुमाओ, रीढ़ सीधी करो और माथे की सिलवटें ढीली करो।',
    icon: 'PersonSimpleStretch',
    points: 2
  },
  {
    id: 'mw_sunlight',
    title: '60-Second Sun Gaze',
    titleHindi: '1 मिनट खिड़की से बाहर देखो',
    desc: 'Look out the window at distant natural light to sync circadian rhythm.',
    descHindi: '1 मिनट दूर आकाश या हरियाली को देखो - आंखों को सुकून मिलेगा।',
    icon: 'Sun',
    points: 2
  }
];

export function getTodayBriefing({
  habits = [],
  allSummaries = [],
  todayEntries = [],
  priorityModeEnabled = false,
  selectedDate = null
}) {
  const targetDate = selectedDate || getTodayDateStr();

  const todayEntryMap = {};
  todayEntries.forEach((e) => {
    if (e.habitId) {
      todayEntryMap[e.habitId] = {
        rawValue: e.rawValue,
        computedScore: e.computedScore !== undefined && e.computedScore !== null ? Number(e.computedScore) : 0,
        isCompleted: Number(e.computedScore) >= 35
      };
    }
  });

  const todaySummary = allSummaries.find((s) => (s.id === targetDate || s.date === targetDate));
  if (todaySummary?.habitScores) {
    Object.entries(todaySummary.habitScores).forEach(([hId, sc]) => {
      if (!todayEntryMap[hId]) {
        todayEntryMap[hId] = {
          computedScore: Number(sc),
          isCompleted: Number(sc) >= 35
        };
      }
    });
  }

  const pastSummaries = allSummaries
    .filter((s) => (s.id || s.date) !== targetDate)
    .sort((a, b) => (b.id || b.date || '').localeCompare(a.id || a.date || ''))
    .slice(0, 14);

  const habitAnalytics = habits.map((habit) => {
    const isDoneToday = Boolean(todayEntryMap[habit.id]?.isCompleted);
    const todayScore = todayEntryMap[habit.id]?.computedScore || 0;

    let consecutiveMisses = 0;
    let past7Scores = [];
    let past7Misses = 0;
    let completedYesterday = false;

    for (let i = 0; i < pastSummaries.length && i < 7; i++) {
      const summary = pastSummaries[i];
      const score = summary?.habitScores?.[habit.id] !== undefined ? Number(summary.habitScores[habit.id]) : 0;
      past7Scores.push(score);

      const wasDone = score >= 35;
      if (i === 0) {
        completedYesterday = wasDone;
      }

      if (!wasDone) {
        past7Misses++;
      }
    }

    for (let i = 0; i < pastSummaries.length && i < 5; i++) {
      const score = pastSummaries[i]?.habitScores?.[habit.id] !== undefined ? Number(pastSummaries[i].habitScores[habit.id]) : 0;
      if (score < 35) {
        consecutiveMisses++;
      } else {
        break;
      }
    }

    let weight = 1;
    if (priorityModeEnabled && habit.priorityRank) {
      if (habit.priorityRank === 1) weight = 3;
      else if (habit.priorityRank === 2) weight = 2;
      else if (habit.priorityRank === 3) weight = 1.5;
    }
    const isHighPriority = habit.isPriority || weight > 1.2;
    const formattedTarget = formatHabitTarget(habit);
    const microMode = getHabitMicroModeInfo(habit);

    return {
      habit,
      isDoneToday,
      todayScore,
      consecutiveMisses,
      past7Misses,
      past7Scores,
      completedYesterday,
      weight,
      isHighPriority,
      formattedTarget,
      microMode,
      unit: habit.unit || habit.defaultUnit || ''
    };
  });

  // 2. Select Aaj Ka Trishul (Top 3 Focus Habits)
  const focusCandidates = habitAnalytics.map((item) => {
    let priorityScore = 0;
    let focusReasonEn = '';
    let focusReasonHi = '';
    let reasonType = 'impact'; // 'resilience_guard' | 'formation' | 'impact' | 'done'

    if (item.isDoneToday) {
      priorityScore = -100;
      focusReasonEn = 'Completed for today! Golden seam permanently bonded.';
      focusReasonHi = 'आज पूरा हो चुका है! रिज़िलिएंस स्कोर सुरक्षित है।';
      reasonType = 'done';
    } else {
      // 1. Resilience Guard (Missed 1 or more days)
      if (item.consecutiveMisses >= 1) {
        priorityScore += 60 + item.consecutiveMisses * 15;
        focusReasonEn = `Missed ${item.consecutiveMisses === 1 ? 'yesterday' : `${item.consecutiveMisses} days in a row`}. Doing it today guards your resilience score (+5%) and protects overall momentum.`;
        focusReasonHi = 'कल मिस हुआ था - आज इसे करते ही रिज़िलिएंस स्कोर (+5%) तुरंत बाउंस बैक करेगा और लय सुरक्षित रहेगी।';
        reasonType = 'resilience_guard';
      }
      // 2. Habit Formation Momentum (Started yesterday, critical day 2)
      else if (item.completedYesterday && item.past7Misses >= 3) {
        priorityScore += 55;
        focusReasonEn = 'Completed yesterday! Day 2 is the critical inflection point for habit formation.';
        focusReasonHi = 'कल शुरुआत की थी! आदत पक्की करने के लिए आज दूसरा दिन सबसे निर्णायक है।';
        reasonType = 'formation';
      }
      // 3. High Weight / Impact habit
      else if (item.isHighPriority) {
        priorityScore += 45 + item.weight * 10;
        focusReasonEn = 'Cornerstone habit for today. Completing this unlocks a high daily rhythm score.';
        focusReasonHi = 'सबसे ज्यादा असरदार आदत - इसे करते ही आज का रिज़िलिएंस स्कोर तेजी से ऊपर जाएगा।';
        reasonType = 'impact';
      } else {
        priorityScore += 25;
        focusReasonEn = "Essential daily discipline stone for today's foundation.";
        focusReasonHi = 'आज के अनुशासन और संतुलन के लिए जरूरी कदम।';
        reasonType = 'impact';
      }
    }

    return {
      ...item,
      priorityScore,
      focusReasonEn,
      focusReasonHi,
      reasonType
    };
  });

  focusCandidates.sort((a, b) => b.priorityScore - a.priorityScore);
  const focusTrio = focusCandidates.slice(0, 3);

  // 3. Resilience Pulse Calculation
  let overallMissesLast3Days = 0;
  let overallCompletedLast3Days = 0;
  for (let i = 0; i < pastSummaries.length && i < 3; i++) {
    const summary = pastSummaries[i];
    if (summary?.habitScores) {
      Object.values(summary.habitScores).forEach((sc) => {
        if (Number(sc) >= 35) overallCompletedLast3Days++;
        else overallMissesLast3Days++;
      });
    }
  }

  const totalPossibleIn3Days = Math.max(1, overallCompletedLast3Days + overallMissesLast3Days);
  const recentCompletionRate = Math.round((overallCompletedLast3Days / totalPossibleIn3Days) * 100);

  let resilienceTrend = 'stable';
  let resilienceScore = 78;
  let pulseMessageEn = '';
  let pulseMessageHi = '';

  if (recentCompletionRate >= 75) {
    resilienceTrend = 'rising';
    resilienceScore = Math.min(98, 85 + Math.round((recentCompletionRate - 75) / 2));
    pulseMessageEn = 'Your resilience is strong and rising. Maintain this steady rhythm today.';
    pulseMessageHi = 'तुम्हारा रिज़िलिएंस स्कोर बहुत मजबूत है। आज बस इसी शांत लय को बनाए रखो।';
  } else if (recentCompletionRate >= 45) {
    resilienceTrend = 'stable';
    resilienceScore = 68;
    pulseMessageEn = 'Resilience is steady. Completing your Top 3 will tilt momentum upwards.';
    pulseMessageHi = 'रिज़िलिएंस स्थिर है। आज त्रिशूल की 3 आदतें करते ही यह तेजी से ऊपर उछलेगा।';
  } else {
    resilienceTrend = 'dipping';
    resilienceScore = Math.max(35, Math.round(recentCompletionRate * 0.8));
    const quickEasyHabit = habits.find((h) => !todayEntryMap[h.id]?.isCompleted) || habits[0];
    const habitName = quickEasyHabit ? quickEasyHabit.name : '1 quick habit';
    pulseMessageEn = `Recent misses detected. Doing just "${habitName}" today triggers an immediate resilience bounce!`;
    pulseMessageHi = `हाल ही में कुछ आदतें मिस हुई हैं - आज सिर्फ "${habitName}" पूरा करो, रिज़िलिएंस तुरंत ऊपर बाउंस करेगा!`;
  }

  // 4. Drag Alert (Habit dragging down rhythm the most in past 7 days)
  const dragCandidates = habitAnalytics
    .filter((item) => item.past7Misses >= 2 && !item.isDoneToday)
    .sort((a, b) => b.past7Misses - a.past7Misses);

  let dragAlert = null;
  if (dragCandidates.length > 0) {
    const worstDrag = dragCandidates[0];
    const missCount = worstDrag.past7Misses;
    const impactDropPercent = Math.min(40, Math.max(12, missCount * 8));

    dragAlert = {
      habitId: worstDrag.habit.id,
      habitName: worstDrag.habit.name,
      habitIcon: worstDrag.habit.icon || 'star',
      habitColor: worstDrag.habit.color || '#f43f5e',
      missCount,
      impactDropPercent,
      formattedTarget: worstDrag.formattedTarget,
      microMode: worstDrag.microMode,
      unit: worstDrag.unit,
      messageEn: `"${worstDrag.habit.name}" was missed ${missCount} times in the last 7 days, causing a ${impactDropPercent}% drag on your rhythm.`,
      messageHi: `"${worstDrag.habit.name}" पिछले 7 दिनों में ${missCount} बार मिस हुई है, जिससे रिदम स्कोर ${impactDropPercent}% नीचे गिरा है।`
    };
  }

  // 5. Guru's Whisper
  let quotePool = GURU_QUOTES.defaultWisdom;
  if (resilienceTrend === 'dipping') {
    quotePool = GURU_QUOTES.resilienceDipping;
  } else if (resilienceTrend === 'rising') {
    quotePool = GURU_QUOTES.streakGoingStrong;
  } else if (pastSummaries.length > 0 && pastSummaries[0]?.overallScore < 40) {
    quotePool = GURU_QUOTES.missedRecently;
  }

  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const quoteIndex = dayOfYear % quotePool.length;
  const guruMessage = quotePool[quoteIndex];

  // 6. Quick Win Micro Action
  const quickWinIndex = dayOfYear % MICRO_WINS.length;
  const quickWin = MICRO_WINS[quickWinIndex];

  // 7. Visual Metaphor State
  const completedCountToday = Object.values(todayEntryMap).filter((e) => e.isCompleted).length;
  const totalHabitsCount = Math.max(1, habits.length);
  const completionRatio = Math.min(1, completedCountToday / totalHabitsCount);

  const visualState = {
    goldenSeamsCount: completedCountToday,
    candleFlameIntensity: Math.max(0.3, completionRatio),
    flameFlicker: resilienceTrend === 'dipping',
    zenGlowColor: completionRatio >= 0.8 ? '#f59e0b' : completionRatio >= 0.4 ? '#38bdf8' : '#64748b'
  };

  return {
    date: targetDate,
    focusTrio,
    resiliencePulse: {
      score: resilienceScore,
      trend: resilienceTrend,
      messageEn: pulseMessageEn,
      messageHi: pulseMessageHi,
      completionRate: recentCompletionRate
    },
    dragAlert,
    guruMessage,
    quickWin,
    visualState,
    todayStats: {
      completedCount: completedCountToday,
      totalCount: totalHabitsCount,
      completionPercentage: Math.round(completionRatio * 100)
    }
  };
}
