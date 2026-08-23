import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  // Navigation & General
  'today': { en: 'Today', hinglish: 'Today' },
  'stats': { en: 'Stats', hinglish: 'Stats' },
  'dive': { en: 'Dive', hinglish: 'Dive' },
  'me': { en: 'Me', hinglish: 'Me' },
  
  // Dashboard / Today Page
  'focus_title': { en: 'Focus', hinglish: 'Focus' },
  'streak_title': { en: 'Streak', hinglish: 'Streak' },
  'needs_rebound': { en: 'Needs rebound', hinglish: 'Rebound ki zaroorat hai' },
  'execute_early': { en: 'Execute early', hinglish: 'Pehle complete karo' },
  'keep_unbroken': { en: 'Keep unbroken', hinglish: 'Streak tootne mat dena' },
  'daily_insight_title': { en: "Today's Daily Insight", hinglish: "Aaj Ka Daily Insight" },
  'all_insights': { en: 'All Insights', hinglish: 'All Insights' },
  
  // Deep Dive Index
  'deep_dive_title': { en: 'Deep Dive Priorities', hinglish: 'Deep Dive Priorities' },
  'deep_dive_sub': { 
    en: 'Explore advanced analytics and detailed breakdowns for your top priority habits.', 
    hinglish: 'Apni top priority habits ke detailed analytics aur breakdowns explore karo.' 
  },
  'explore_sample_deep_dive': { en: 'Explore Sample Deep Dive', hinglish: 'Sample Deep Dive Dekho' },
  'sample_preview_mode': { en: 'Sample Preview Mode', hinglish: 'Sample Preview Mode' },
  
  // Resilience & Recovery Deep Dive
  'habit_resilience': { en: 'Habit Resilience', hinglish: 'Habit Resilience' },
  'resilience_sub': { en: '7-Day bounce-backs & comeback timeline', hinglish: '7-Day bounce-backs aur comeback timeline' },
  'bounce_backs': { en: 'BOUNCE-BACKS', hinglish: 'BOUNCE-BACKS' },
  'score_label': { en: 'SCORE', hinglish: 'SCORE' },
  'why_recovery_title': { en: 'Why Recovery > Streaks', hinglish: 'Recovery Streak Se Zyada Zaroori Kyun Hai?' },
  'why_recovery_desc': { 
    en: 'Streaks measure perfection. Recovery measures resilience. Real life has disruptions — your ability to bounce back within 24-48 hours is the #1 predictor of lifelong habit retention.',
    hinglish: 'Streak sirf perfection naapti hai, lekin Recovery tumhari comeback ki taqat naapti hai. Asli zindagi me busy din aayenge — 24-48 ghante me wapas aana hi habit banaye rakhne ka sabse bada secret hai.' 
  },
  'how_recovery_calc_title': { en: 'How Recovery Score is Calculated', hinglish: 'Recovery Score Kaise Banta Hai?' },
  'how_recovery_calc_desc': { 
    en: 'Every time you drop below target (<70%), a 7-day window begins. Completing your habit within 24-48 hours scores a Fast Recovery (100 pts). Later bounce-backs within 7 days score 40-75 pts. Unrecovered misses score 0 pts.',
    hinglish: 'Jab bhi habit miss hoti hai (<70%), ek 7-day comeback window chalu hoti hai. 24-48 ghante me pura karne par Fast Recovery (100 pts) milti hai. 7 din ke andar bounce back par 40-75 pts milte hain.' 
  },
  
  // Deep Dive Insights Card
  'insights_suggestions': { en: 'Insights & Suggestions', hinglish: 'Insights & Suggestions' },
  'weakest_day_hint': { en: 'tends to be your weakest day. Try a midday reminder.', hinglish: 'tumhara sabse weak din rehta hai. Dopahar ka reminder try karo.' },
  'improving_trend_hint': { en: 'Upward trajectory vs last period. Keep the momentum going.', hinglish: 'Pichle dino ke mukable progress upar ja rahi hai. Momentum bana ke rakho.' },
  'declining_trend_hint': { en: 'Score is dipping vs previous average. Focus on small daily wins.', hinglish: 'Pichle average ke mukable score thoda gira hai. Chhoti-chhoti daily wins par focus karo.' },
  
  // Analytics / Stats Page
  'weighted_average': { en: 'Weighted Average', hinglish: 'Weighted Average' },
  'overall_score': { en: 'Overall Score', hinglish: 'Overall Score' },
  'not_recorded': { en: 'Not Recorded', hinglish: 'Not Recorded' },
  'no_data': { en: 'No Data', hinglish: 'No Data' },
  'how_weighted_works': { en: 'How Weighted Average Works', hinglish: 'Weighted Average Kaise Kaam Karta Hai' },
  'how_weighted_sub': { en: 'Smart scoring focused on your core priorities', hinglish: 'Tumhari core priorities par focused smart scoring' },
  'traditional_avg': { en: 'Traditional Average', hinglish: 'Traditional Average' },
  'other_trackers': { en: 'Other trackers', hinglish: 'Dusre trackers' },
  
  // Profile / Settings
  'my_habits': { en: 'My Habits', hinglish: 'My Habits' },
  'unlock_insights': { en: 'Unlock Advanced Insights', hinglish: 'Advanced Insights Unlock Karo' },
  'unlock_insights_sub': { en: 'Power Duos, Time-of-Day correlations, and habit radar', hinglish: 'Power Duos, Time-of-Day correlations aur habit radar' },
  'better_report': { en: '30-Day Better Report', hinglish: '30-Day Better Report' },
  'better_report_sub': { en: 'Your personal 30-day habit documentary & growth story', hinglish: 'Tumhari personal 30-day habit documentary aur growth story' },
  'membership': { en: 'Membership', hinglish: 'Membership' },
  'membership_sub': { en: 'Subscription tier, plan limits & features', hinglish: 'Subscription tier, plan limits aur features' },
  'my_profile': { en: 'My Profile', hinglish: 'My Profile' },
  'personal_account': { en: 'Personal account info, theme & preferences', hinglish: 'Personal account info, theme aur preferences' },
  'language_preferences': { en: 'Language & Preferences', hinglish: 'Language & Preferences' },
  'language_sub': { en: 'Choose your preferred app language', hinglish: 'Apni pasandeeda app language chuno' },
  'lang_english': { en: 'English', hinglish: 'English' },
  'lang_hinglish': { en: 'Hinglish', hinglish: 'Hinglish' },
  'email_address': { en: 'Email Address', hinglish: 'Email Address' },
  'logout': { en: 'Log Out', hinglish: 'Log Out' },
  'danger_zone': { en: 'Danger Zone', hinglish: 'Danger Zone' },
  'delete_account': { en: 'Delete Account', hinglish: 'Account Delete Karo' }
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('user_app_language') || 'en';
  });

  const setLanguage = (newLang) => {
    setLanguageState(newLang);
    localStorage.setItem('user_app_language', newLang);
  };

  const t = (key, fallback = '') => {
    if (translations[key]) {
      return translations[key][language] || translations[key]['en'] || fallback || key;
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isHinglish: language === 'hinglish' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key, fallback) => fallback || key,
      isHinglish: false
    };
  }
  return context;
}
