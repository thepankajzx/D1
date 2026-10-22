// B2B Professional Collaboration Architecture Configuration
// Supports generalized coaching/consulting domains: Dietitian, Fitness Coach, Life Coach, Wellness, etc.

export const PRO_TYPES = {
  dietitian: {
    id: 'dietitian',
    label: 'Dietitian & Nutritionist',
    shortLabel: 'Dietitian',
    clientLabel: 'Patient',
    clientPlural: 'Patients',
    planLabel: 'Diet & Nutrition Plan',
    orgLabel: 'Clinic / Practice Name',
    themeColor: 'emerald',
    badgeText: 'Clinical Dietitian',
    iconName: 'ForkKnife',
    tagline: 'Track meal timing, hydration, nutrition guidelines & clinical weight metrics',
    templates: [
      {
        id: 'diet_weight_metabolic',
        name: 'Weight & Metabolic Balance Plan',
        tag: 'Most Popular',
        description: 'Daily hydration, meal windows, vegetable volume, and anti-inflammatory habits.',
        habits: [
          { id: 'water', name: 'Water Intake', category: 'Hydration', type: 'number', unit: 'litres', direction: 'higher', floor: 1.0, target: 3.0, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Sip evenly through the day; avoid drinking large volumes right before bed.', avoid: false },
          { id: 'veg', name: 'Vegetable Portions', category: 'Meals', type: 'number', unit: 'servings', direction: 'higher', floor: 0, target: 5, priority: null, days: [1,2,3,4,5,6,7], instructions: 'One fist-sized portion equals one serving (steamed, raw, or sauteed).', avoid: false },
          { id: 'breakfast', name: 'Breakfast Time', category: 'Meals', type: 'time', unit: 'clock', direction: 'earlier', floor: '11:30', target: '09:00', priority: null, days: [1,2,3,4,5,6,7], instructions: 'Log the time you finish your first substantial meal of the day.', avoid: false },
          { id: 'mealslog', name: 'Logged All Meals', category: 'Meals', type: 'binary', unit: 'yes/no', direction: 'higher', floor: 0, target: 1, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Yes if all main meals and snacks were recorded.', avoid: false },
          { id: 'sugary', name: 'Sugary Beverages', category: 'Avoid', type: 'number', unit: 'drinks', direction: 'lower', floor: 3, target: 0, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Avoid sodas, packaged juices, energy drinks, and heavily sweetened tea/coffee.', avoid: true },
          { id: 'latefood', name: 'Avoided Eating After 8:30 PM', category: 'Avoid', type: 'binary', unit: 'yes/no', direction: 'higher', floor: 0, target: 1, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Finished dinner and snacks before 8:30 PM for metabolic rest.', avoid: true }
        ],
        metrics: [
          { id: 'weight', name: 'Body Weight', unit: 'kg', frequency: 'weekly', goal: null, sensitive: true }
        ]
      },
      {
        id: 'diet_pcos_hormonal',
        name: 'PCOS & Hormonal Health Protocol',
        tag: 'Specialized',
        description: 'Low-glycemic dietary habits, spearmint tea, insulin sensitivity walking, and sleep discipline.',
        habits: [
          { id: 'water', name: 'Spearmint & Water Hydration', category: 'Hydration', type: 'number', unit: 'litres', direction: 'higher', floor: 1.5, target: 3.0, priority: null, days: [1,2,3,4,5,6,7], instructions: '2 cups organic spearmint tea included in daily fluid intake.', avoid: false },
          { id: 'post_meal_walk', name: 'Post-Meal 15m Walk', category: 'Activity', type: 'binary', unit: 'yes/no', direction: 'higher', floor: 0, target: 1, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Light 10-15 min stroll within 30 mins after lunch or dinner.', avoid: false },
          { id: 'protein_breakfast', name: 'High Protein Breakfast (>25g)', category: 'Meals', type: 'binary', unit: 'yes/no', direction: 'higher', floor: 0, target: 1, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Ensure 25g+ quality protein in first meal to avoid blood sugar spike.', avoid: false },
          { id: 'processed_junk', name: 'Refined Bakery / Desserts', category: 'Avoid', type: 'number', unit: 'servings', direction: 'lower', floor: 2, target: 0, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Avoid maida, pastries, biscuits, and refined packaged snacks.', avoid: true },
          { id: 'sleep_8h', name: '8 Hours Nocturnal Sleep', category: 'Recovery', type: 'duration', unit: 'hours', direction: 'optimal', floor: 6, optimalLow: 7.5, optimalHigh: 8.5, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Restorative circadian rhythm support for cortisol regulation.', avoid: false }
        ],
        metrics: [
          { id: 'weight', name: 'Body Weight', unit: 'kg', frequency: 'weekly', goal: null, sensitive: true },
          { id: 'waist', name: 'Waist Circumference', unit: 'cm', frequency: 'biweekly', goal: null, sensitive: false }
        ]
      },
      {
        id: 'diet_gut_cleanse',
        name: 'Gut Health & Anti-Inflammatory Routine',
        tag: 'Digestive',
        description: 'Fermented food consumption, mindful chewing, and gut microbiome optimization.',
        habits: [
          { id: 'warm_water', name: 'Morning Warm Water + Lemon', category: 'Hydration', type: 'binary', unit: 'yes/no', direction: 'higher', floor: 0, target: 1, priority: null, days: [1,2,3,4,5,6,7], instructions: '500ml warm water immediately after waking up.', avoid: false },
          { id: 'probiotic_serving', name: 'Probiotic / Fermented Food', category: 'Nutrition', type: 'number', unit: 'servings', direction: 'higher', floor: 0, target: 1, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Homemade curd, kefir, kimchi, or kanji.', avoid: false },
          { id: 'chew_mindfully', name: '20-Minute Mindful Meal Window', category: 'Digestion', type: 'binary', unit: 'yes/no', direction: 'higher', floor: 0, target: 1, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Chew thoroughly; avoid eating while rushing or watching screens.', avoid: false },
          { id: 'deep_fried', name: 'Deep Fried & Greasy Foods', category: 'Avoid', type: 'number', unit: 'meals', direction: 'lower', floor: 1, target: 0, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Avoid heavy trans-fats and reheated restaurant oils.', avoid: true }
        ],
        metrics: [
          { id: 'bloating_score', name: 'Bloating Severity (1-5)', unit: 'score', frequency: 'daily', goal: null, sensitive: false }
        ]
      }
    ]
  },

  fitness_coach: {
    id: 'fitness_coach',
    label: 'Fitness Coach & Trainer',
    shortLabel: 'Coach',
    clientLabel: 'Client / Athlete',
    clientPlural: 'Clients',
    planLabel: 'Training & Conditioning Plan',
    orgLabel: 'Gym / Fitness Studio',
    themeColor: 'blue',
    badgeText: 'Fitness Trainer',
    iconName: 'Barbell',
    tagline: 'Monitor daily workouts, step counts, recovery sleep & protein goals',
    templates: [
      {
        id: 'fit_hypertrophy',
        name: 'Athletic Conditioning & Muscle Retention',
        tag: 'Strength',
        description: 'Daily activity foundation, progressive resistance, and restorative rest.',
        habits: [
          { id: 'steps', name: 'Daily Step Count', category: 'Activity', type: 'number', unit: 'steps', direction: 'higher', floor: 4000, target: 10000, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Accumulate brisk steps during commute, lunch walk, and evening.', avoid: false },
          { id: 'workout', name: 'Workout Session', category: 'Training', type: 'binary', unit: 'completed', direction: 'higher', floor: 0, target: 1, priority: null, days: [1,2,3,4,5], instructions: 'Completed scheduled resistance / cardio programming for the day.', avoid: false },
          { id: 'protein', name: 'Protein Target', category: 'Nutrition', type: 'number', unit: 'grams', direction: 'higher', floor: 60, target: 130, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Total dietary protein from eggs, whey, legumes, or lean meats.', avoid: false },
          { id: 'sleep', name: 'Sleep Recovery', category: 'Recovery', type: 'duration', unit: 'hours', direction: 'optimal', floor: 5, optimalLow: 7.5, optimalHigh: 9, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Deep restorative nocturnal sleep for tissue recovery.', avoid: false },
          { id: 'junk_food', name: 'Processed Fast Food Meals', category: 'Avoid', type: 'number', unit: 'meals', direction: 'lower', floor: 2, target: 0, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Avoid deep fried foods, ultra-processed packaged snacks, and commercial pizzas.', avoid: true }
        ],
        metrics: [
          { id: 'weight', name: 'Body Weight', unit: 'kg', frequency: 'weekly', goal: null, sensitive: true },
          { id: 'waist', name: 'Waist Circumference', unit: 'cm', frequency: 'biweekly', goal: null, sensitive: false }
        ]
      },
      {
        id: 'fit_fat_loss',
        name: 'Accelerated Fat Loss & NEAT Protocol',
        tag: 'Cut & Tone',
        description: '12,000 daily steps, calorie awareness, hydration, and zero liquid calories.',
        habits: [
          { id: 'steps_12k', name: 'Daily Steps (12,000 Target)', category: 'Activity', type: 'number', unit: 'steps', direction: 'higher', floor: 6000, target: 12000, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Maintain high non-exercise activity thermogenesis (NEAT).', avoid: false },
          { id: 'water_3_5', name: 'Daily Water (3.5 Litres)', category: 'Hydration', type: 'number', unit: 'litres', direction: 'higher', floor: 1.5, target: 3.5, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Cold water throughout the day for satiety and cellular hydration.', avoid: false },
          { id: 'cardio_session', name: 'Zone-2 Steady Cardio (30m)', category: 'Cardio', type: 'binary', unit: 'yes/no', direction: 'higher', floor: 0, target: 1, priority: null, days: [1,2,3,4,5,6], instructions: 'Brisk incline walking, cycling, or stairmaster at conversational pace.', avoid: false },
          { id: 'liquid_calories', name: 'Liquid Calories / Alcohol', category: 'Avoid', type: 'number', unit: 'drinks', direction: 'lower', floor: 2, target: 0, priority: null, days: [1,2,3,4,5,6,7], instructions: 'No beer, cocktails, sweetened lattes, or syrups.', avoid: true }
        ],
        metrics: [
          { id: 'weight', name: 'Body Weight', unit: 'kg', frequency: 'weekly', goal: null, sensitive: true }
        ]
      }
    ]
  },

  life_coach: {
    id: 'life_coach',
    label: 'Life & Mindset Coach',
    shortLabel: 'Coach',
    clientLabel: 'Mentee / Client',
    clientPlural: 'Mentees',
    planLabel: 'Mindset & Growth Protocol',
    orgLabel: 'Academy / Practice',
    themeColor: 'purple',
    badgeText: 'Mindset Coach',
    iconName: 'Brain',
    tagline: 'Track morning discipline, deep focus blocks, meditation & reading rituals',
    templates: [
      {
        id: 'mindset_morning',
        name: 'High Performance & Mental Clarity Protocol',
        tag: 'Discipline',
        description: 'Morning foundation, distraction shielding, and continuous learning.',
        habits: [
          { id: 'morning_routine', name: 'Morning Priming Protocol', category: 'Morning', type: 'binary', unit: 'yes/no', direction: 'higher', floor: 0, target: 1, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Hydration, light exposure, and intention setting before checking digital notifications.', avoid: false },
          { id: 'deep_work', name: 'Deep Work Focus Block', category: 'Productivity', type: 'duration', unit: 'hours', direction: 'higher', floor: 1, target: 3, priority: null, days: [1,2,3,4,5], instructions: 'Uninterrupted single-tasking without browser tabs or phone notifications.', avoid: false },
          { id: 'reading', name: 'Non-Fiction Reading', category: 'Growth', type: 'number', unit: 'pages', direction: 'higher', floor: 5, target: 20, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Philosophy, biographies, or domain-specific mastery material.', avoid: false },
          { id: 'meditation', name: 'Breathwork / Mindfulness', category: 'Mindfulness', type: 'duration', unit: 'minutes', direction: 'higher', floor: 5, target: 15, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Quiet box breathing or stillness to downregulate sympathetic tone.', avoid: false },
          { id: 'doomscroll', name: 'Avoided Bedtime Doomscrolling', category: 'Avoid', type: 'binary', unit: 'yes/no', direction: 'higher', floor: 0, target: 1, priority: null, days: [1,2,3,4,5,6,7], instructions: 'No social media feeds or algorithmic video scrolling after 9:30 PM.', avoid: true }
        ],
        metrics: [
          { id: 'energy_rating', name: 'Daily Energy & Clarity Score', unit: '1-10', frequency: 'daily', goal: null, sensitive: false }
        ]
      },
      {
        id: 'mindset_focus_detox',
        name: 'Deep Work & Digital Shielding Protocol',
        tag: 'Focus',
        description: 'Single-task blocks, screen hygiene, and evening mental shutdown.',
        habits: [
          { id: 'phone_free_morning', name: 'Phone-Free First 60 Mins', category: 'Focus', type: 'binary', unit: 'yes/no', direction: 'higher', floor: 0, target: 1, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Zero notification checking in first hour after waking.', avoid: false },
          { id: 'deep_work_blocks', name: '2x 90-Min Focus Blocks', category: 'Work', type: 'binary', unit: 'yes/no', direction: 'higher', floor: 0, target: 1, priority: null, days: [1,2,3,4,5], instructions: '2 pure uninterrupted deep work blocks on primary deliverables.', avoid: false },
          { id: 'evening_journal', name: 'Daily Wins & Tomorrow Plan', category: 'Review', type: 'binary', unit: 'yes/no', direction: 'higher', floor: 0, target: 1, priority: null, days: [1,2,3,4,5,6,7], instructions: '3 wins, 1 key improvement, and tomorrow schedule locked.', avoid: false }
        ],
        metrics: []
      }
    ]
  },

  wellness: {
    id: 'wellness',
    label: 'Corporate & Wellness Specialist',
    shortLabel: 'Wellness Lead',
    clientLabel: 'Employee / Member',
    clientPlural: 'Members',
    planLabel: 'Workplace Vitality Plan',
    orgLabel: 'Company / Wellness Dept',
    themeColor: 'teal',
    badgeText: 'Wellness Pro',
    iconName: 'HeartPulse',
    tagline: 'Encourage ergonomic breaks, hydration, screen balance & healthy sleep cycles',
    templates: [
      {
        id: 'wellness_ergonomics',
        name: 'Workplace Ergonomics & Vitality',
        tag: 'Daily Balance',
        description: 'Physical ergonomics, mental reset intervals, and restorative balance.',
        habits: [
          { id: 'screen_breaks', name: 'Hourly Stand & Stretch', category: 'Ergonomics', type: 'binary', unit: 'yes/no', direction: 'higher', floor: 0, target: 1, priority: null, days: [1,2,3,4,5], instructions: 'Stood up, looked at a distant object, and stretched for 2 minutes every hour.', avoid: false },
          { id: 'hydration', name: 'Workday Hydration', category: 'Health', type: 'number', unit: 'glasses', direction: 'higher', floor: 3, target: 8, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Drank fresh water or herbal infusion across the workday.', avoid: false },
          { id: 'outdoor_walk', name: 'Daylight Fresh Air Break', category: 'Vitality', type: 'duration', unit: 'minutes', direction: 'higher', floor: 10, target: 25, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Natural sunlight exposure and relaxed walking outdoors.', avoid: false },
          { id: 'mindful_lunch', name: 'Screen-Free Lunch Hour', category: 'Mindfulness', type: 'binary', unit: 'yes/no', direction: 'higher', floor: 0, target: 1, priority: null, days: [1,2,3,4,5], instructions: 'Ate lunch away from computer monitor, meetings, and smartphones.', avoid: false }
        ],
        metrics: [
          { id: 'stress_score', name: 'Stress / Calm Indicator', unit: '1-10', frequency: 'weekly', goal: null, sensitive: true }
        ]
      }
    ]
  },

  other: {
    id: 'other',
    label: 'Habit & Accountability Consultant',
    shortLabel: 'Professional',
    clientLabel: 'Client',
    clientPlural: 'Clients',
    planLabel: 'Habit & Accountability Plan',
    orgLabel: 'Practice / Business Name',
    themeColor: 'indigo',
    badgeText: 'Consultant',
    iconName: 'CheckSquare',
    tagline: 'Custom habit tracking, daily consistency accountability & progress oversight',
    templates: [
      {
        id: 'accountability_core',
        name: 'Core Accountability Protocol',
        tag: 'Essential',
        description: 'Key daily priority execution and milestone reporting.',
        habits: [
          { id: 'primary_goal', name: 'Main Daily Milestone Completed', category: 'Priority', type: 'binary', unit: 'yes/no', direction: 'higher', floor: 0, target: 1, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Executed your #1 highest ROI task of the day without procrastination.', avoid: false },
          { id: 'daily_reflection', name: 'Evening Review & Tomorrow Prep', category: 'Review', type: 'binary', unit: 'yes/no', direction: 'higher', floor: 0, target: 1, priority: null, days: [1,2,3,4,5,6,7], instructions: 'Audited today wins/misses and laid out tomorrow schedule.', avoid: false }
        ],
        metrics: []
      }
    ]
  }
};

export function getProTypeConfig(type) {
  if (!type || !PRO_TYPES[type]) {
    return PRO_TYPES.dietitian;
  }
  const config = PRO_TYPES[type];
  // Backward compatibility: default samplePlan to first template
  if (!config.samplePlan && config.templates && config.templates.length > 0) {
    config.samplePlan = config.templates[0];
  }
  return config;
}

export function getAllProTypes() {
  return Object.values(PRO_TYPES);
}
