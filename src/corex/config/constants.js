export const COREX_LIMITS = {
  MAX_FACTORS: 12,
  MAX_PROPERTIES_PER_FACTOR: 8,
  MAX_COREX_PER_USER: 3
};

export const PROPERTY_TYPES = {
  YESNO: 'yesno',
  NUMBER: 'number',
  TIME: 'time',
  RATING: 'rating',
  CHOICE: 'choice',
  NOTE: 'note'
};

export const OUTCOME_TIMING = {
  SAME_DAY: 'same_day',
  NEXT_DAY: 'next_day'
};

export const ANALYZER_CONFIG = {
  MIN_DAYS_REQUIRED: 5,
  EARLY_SIGNAL_MAX: 13,
  BUILDING_MAX: 29,
  RELIABLE_MIN: 30,
  DELTA_THRESHOLD_PERCENT: 0.10, // 10% of scale
  EFFECT_SIZE_THRESHOLD: 0.3
};

export const PRESET_FACTOR_SUGGESTIONS = [
  { name: 'Coffee / Caffeine', icon: 'Coffee', color: '#d97706', defaultProps: [{ label: 'Quantity', type: 'number', unit: 'cups' }, { label: 'Last Cup Time', type: 'time' }] },
  { name: 'Milk / Warm Drink', icon: 'Drop', color: '#3b82f6', defaultProps: [{ label: 'Quantity', type: 'number', unit: 'ml' }] },
  { name: 'Workout / Exercise', icon: 'Barbell', color: '#10b981', defaultProps: [{ label: 'Duration', type: 'number', unit: 'min' }, { label: 'Intensity', type: 'choice', options: ['Light', 'Moderate', 'Intense'] }] },
  { name: 'Screen Before Bed', icon: 'Monitor', color: '#ec4899', defaultProps: [{ label: 'Used within 1hr', type: 'yesno' }] },
  { name: 'Late Dinner / Food', icon: 'ForkKnife', color: '#f59e0b', defaultProps: [{ label: 'Dinner Time', type: 'time' }, { label: 'Heavy Meal', type: 'yesno' }] },
  { name: 'Meditation / Breathwork', icon: 'Brain', color: '#8b5cf6', defaultProps: [{ label: 'Duration', type: 'number', unit: 'min' }] },
  { name: 'Stress Level', icon: 'Lightning', color: '#ef4444', defaultProps: [{ label: 'Rating (1-10)', type: 'rating', min: 1, max: 10 }] },
  { name: 'Outdoor Sun / Walk', icon: 'Sun', color: '#f97316', defaultProps: [{ label: 'Duration', type: 'number', unit: 'min' }] },
  { name: 'Supplements / Vitamins', icon: 'Pill', color: '#06b6d4', defaultProps: [{ label: 'Taken', type: 'yesno' }] },
  { name: 'Cold Shower / Ice Bath', icon: 'Snowflake', color: '#0284c7', defaultProps: [{ label: 'Duration', type: 'number', unit: 'min' }] }
];

export const COREX_TEMPLATES = {
  SLEEP: {
    name: "Sleep Optimization",
    icon: "Moon",
    color: "#6366f1",
    outcome: {
      key: "outcome",
      label: "Sleep Quality",
      type: PROPERTY_TYPES.RATING,
      min: 1,
      max: 10,
      higherIsBetter: true,
      timing: OUTCOME_TIMING.NEXT_DAY
    },
    factors: [
      {
        id: "factor_coffee",
        name: "Coffee",
        icon: "Coffee",
        color: "#d97706",
        order: 1,
        active: true,
        properties: [
          { id: "prop_qty", label: "Quantity", type: PROPERTY_TYPES.NUMBER, unit: "cups", order: 1 },
          { id: "prop_time", label: "Last Cup Time", type: PROPERTY_TYPES.TIME, order: 2 }
        ]
      },
      {
        id: "factor_milk",
        name: "Milk",
        icon: "Drop",
        color: "#3b82f6",
        order: 2,
        active: true,
        properties: [
          { id: "prop_qty_milk", label: "Quantity", type: PROPERTY_TYPES.NUMBER, unit: "ml", order: 1 }
        ]
      },
      {
        id: "factor_exercise",
        name: "Exercise",
        icon: "Barbell",
        color: "#10b981",
        order: 3,
        active: true,
        properties: [
          { id: "prop_dur", label: "Duration", type: PROPERTY_TYPES.NUMBER, unit: "min", order: 1 },
          { id: "prop_int", label: "Intensity", type: PROPERTY_TYPES.CHOICE, options: ["Low", "Medium", "High"], order: 2 }
        ]
      },
      {
        id: "factor_screen",
        name: "Screen Before Bed",
        icon: "Monitor",
        color: "#ec4899",
        order: 4,
        active: true,
        properties: [
          { id: "prop_yesno", label: "Used Screen?", type: PROPERTY_TYPES.YESNO, order: 1 }
        ]
      }
    ]
  },
  FOCUS: {
    name: "Deep Work & Focus",
    icon: "Brain",
    color: "#8b5cf6",
    outcome: {
      key: "outcome",
      label: "Deep Work Hours",
      type: PROPERTY_TYPES.NUMBER,
      min: 0,
      max: 12,
      unit: "hrs",
      higherIsBetter: true,
      timing: OUTCOME_TIMING.SAME_DAY
    },
    factors: [
      {
        id: "factor_morning_routine",
        name: "Morning Sunlight",
        icon: "Sun",
        color: "#f59e0b",
        order: 1,
        active: true,
        properties: [
          { id: "prop_sun_min", label: "Minutes Outside", type: PROPERTY_TYPES.NUMBER, unit: "min", order: 1 }
        ]
      },
      {
        id: "factor_phone_distraction",
        name: "Phone in Other Room",
        icon: "DeviceMobile",
        color: "#ef4444",
        order: 2,
        active: true,
        properties: [
          { id: "prop_phone_away", label: "Kept Away", type: PROPERTY_TYPES.YESNO, order: 1 }
        ]
      },
      {
        id: "factor_caffeine",
        name: "Caffeine Timing",
        icon: "Coffee",
        color: "#d97706",
        order: 3,
        active: true,
        properties: [
          { id: "prop_caff_time", label: "First Cup After Wakeup", type: PROPERTY_TYPES.NUMBER, unit: "min", order: 1 }
        ]
      }
    ]
  }
};
