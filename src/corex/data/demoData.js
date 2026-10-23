/**
 * CoreX Demo Data - 30 days of realistic Sleep Optimization data
 * Covers all property types: boolean, number, time, text/custom
 * Clear patterns: Coffee late → bad, Exercise → good, Milk+Ashwagandha → good, etc.
 */

function getDateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

// Seeded random — same output every render
function sr(seed) {
  let x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export const DEMO_CONFIG = {
  id: 'demo_sleep_opt',
  name: 'Sleep Optimization',
  color: '#7c3aed',
  outcome: { label: 'Sleep Score', key: 'outcome' },
  factors: [
    {
      id: 'f_coffee', name: 'Coffee', icon: 'Coffee', color: '#ea580c', type: 'boolean',
      properties: [
        { id: 'p_cups',  label: 'Cups',          type: 'number', unit: 'cups' },
        { id: 'p_ctime', label: 'Last Cup Time',  type: 'time' }
      ]
    },
    {
      id: 'f_exercise', name: 'Exercise', icon: 'Barbell', color: '#16a34a', type: 'boolean',
      properties: [
        { id: 'p_exdur', label: 'Duration',  type: 'number', unit: 'mins' },
        { id: 'p_exint', label: 'Intensity', type: 'number', unit: '/5' }
      ]
    },
    {
      id: 'f_milk', name: 'Milk + Ashwagandha', icon: 'Drop', color: '#7c3aed', type: 'boolean',
      properties: [
        { id: 'p_mtime', label: 'Time Taken',   type: 'time' },
        { id: 'p_mingr', label: 'Ingredients',  type: 'text' }
      ]
    },
    {
      id: 'f_heavyfood', name: 'Heavy Food', icon: 'ForkKnife', color: '#dc2626', type: 'boolean',
      properties: [
        { id: 'p_ftime', label: 'Ate At', type: 'time' },
        { id: 'p_famt',  label: 'Amount', type: 'number', unit: '/5' }
      ]
    },
    {
      id: 'f_screen', name: 'Screen Before Bed', icon: 'DeviceMobile', color: '#0891b2', type: 'boolean',
      properties: [
        { id: 'p_sdur', label: 'Duration', type: 'number', unit: 'mins' },
        { id: 'p_sdev', label: 'Device',   type: 'text' }
      ]
    },
    {
      id: 'f_meditation', name: 'Meditation', icon: 'Sparkle', color: '#9333ea', type: 'boolean',
      properties: [
        { id: 'p_mdur',  label: 'Duration', type: 'number', unit: 'mins' },
        { id: 'p_mtype', label: 'Type',     type: 'text' }
      ]
    }
  ]
};

export function generateDemoLogs() {
  const logs = [];

  for (let day = 29; day >= 0; day--) {
    const s = day * 13; // seed base

    // Factor presence
    const hasCoffee     = sr(s + 1) > 0.25;  // 75%
    const hasExercise   = sr(s + 2) > 0.45;  // 55%
    const hasMilk       = sr(s + 3) > 0.35;  // 65%
    const hasHeavyFood  = sr(s + 4) > 0.45;  // 55%
    const hasScreen     = sr(s + 5) > 0.35;  // 65%
    const hasMeditation = sr(s + 6) > 0.60;  // 40%

    // Coffee props
    const cups         = hasCoffee ? Math.round(1 + sr(s + 7) * 2) : null;
    const coffeeLate   = hasCoffee && sr(s + 8) > 0.40;
    const coffeeHour   = coffeeLate ? (14 + Math.floor(sr(s + 9) * 6)) : (8 + Math.floor(sr(s + 9) * 5));
    const coffeeMin    = Math.floor(sr(s + 10) * 6) * 10;
    const ctime        = hasCoffee ? `${coffeeHour}:${coffeeMin.toString().padStart(2, '0')}` : null;

    // Exercise props
    const exDur  = hasExercise ? Math.round(20 + sr(s + 11) * 60) : null;
    const exInt  = hasExercise ? Math.round(2 + sr(s + 12) * 3) : null;

    // Milk props
    const milkHour = hasMilk ? (20 + Math.floor(sr(s + 13) * 2)) : null;
    const milkMin  = Math.floor(sr(s + 14) * 6) * 10;
    const mtime    = hasMilk ? `${milkHour}:${milkMin.toString().padStart(2, '0')}` : null;
    const mingr    = hasMilk ? (['Plain Milk', 'With Ashwagandha', 'Ashwagandha+Turmeric', 'Turmeric Only'][Math.floor(sr(s + 15) * 4)]) : null;

    // Heavy food props
    const foodHour = hasHeavyFood ? (18 + Math.floor(sr(s + 16) * 4)) : null;
    const foodMin  = Math.floor(sr(s + 17) * 6) * 10;
    const ftime    = hasHeavyFood ? `${foodHour}:${foodMin.toString().padStart(2, '0')}` : null;
    const famt     = hasHeavyFood ? Math.round(1 + sr(s + 18) * 4) : null;

    // Screen props
    const sdur = hasScreen ? Math.round(30 + sr(s + 19) * 90) : null;
    const sdev = hasScreen ? (['Phone', 'TV', 'Laptop'][Math.floor(sr(s + 20) * 3)]) : null;

    // Meditation props
    const mdur  = hasMeditation ? Math.round(10 + sr(s + 21) * 25) : null;
    const mtype = hasMeditation ? (['Guided', 'Silent', 'Breathing'][Math.floor(sr(s + 22) * 3)]) : null;

    // Outcome score (deterministic based on factors)
    let score = 6.0;
    if (hasCoffee)     score -= coffeeLate ? cups * 0.75 : cups * 0.18;
    if (hasExercise)   score += 1.6;
    if (hasMilk) {
      const milkBonus = (mingr === 'With Ashwagandha' || mingr === 'Ashwagandha+Turmeric') ? 2.1 : 0.7;
      score += milkBonus;
    }
    if (hasHeavyFood)  score -= famt * 0.35 + (foodHour >= 20 ? 0.5 : 0);
    if (hasScreen)     score -= sdur / 85;
    if (hasMeditation) score += 1.0;

    // Small noise (seeded)
    score += (sr(s + 23) - 0.5) * 1.3;
    score = Math.round(Math.max(1.0, Math.min(10.0, score)) * 10) / 10;

    const dateStr = getDateStr(day);

    logs.push({
      id: dateStr,
      date: dateStr,
      outcome: score,
      factors: {
        f_coffee:     { had: hasCoffee,     p_cups: cups,  p_ctime: ctime },
        f_exercise:   { had: hasExercise,   p_exdur: exDur, p_exint: exInt },
        f_milk:       { had: hasMilk,       p_mtime: mtime, p_mingr: mingr },
        f_heavyfood:  { had: hasHeavyFood,  p_ftime: ftime, p_famt: famt },
        f_screen:     { had: hasScreen,     p_sdur: sdur,   p_sdev: sdev },
        f_meditation: { had: hasMeditation, p_mdur: mdur,   p_mtype: mtype }
      }
    });
  }

  return logs;
}
