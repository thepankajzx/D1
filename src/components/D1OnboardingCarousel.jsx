import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkle, 
  Crown,
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  Check, 
  CheckCircle,
  X, 
  CaretRight, 
  Robot,
  CalendarCheck,
  CalendarBlank,
  Compass,
  Minus,
  Plus,
  Lightning,
  Sliders,
  ChartLineUp,
  Flame,
  ChartBar,
  Package,
  Lightbulb,
  Warning,
  Target
} from '@phosphor-icons/react';
import ProPill from './ProPill';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * D1 Onboarding Value Reveal Carousel
 * Slide 0: Tracks Every Single Step of Your Progress + 2-Column Comparison + Live Dashboard Preview
 * Slide 1: Feature 01 • Rule of Top 3
 * Slide 2: Feature 02 • 5 Precision Scoring Curves
 * Slide 3: Feature 03 • Resilience Hub (Bounce-Back Win Rate)
 * Slide 4: Feature 04 • Everything You Need (100% Free Forever vs AI Coach Pro)
 * Slide 5: Ready Systems / Routine Presets
 */
export default function D1OnboardingCarousel({ onComplete, onChooseBundle, onAddHabit }) {
  const { language, setLanguage } = useLanguage();
  const [activeLang, setActiveLang] = useState(() => {
    return language === 'hinglish' ? 'hinglish' : (localStorage.getItem('user_app_language') || 'en');
  });

  // Initial welcome language chooser modal (shows once until dismissed or chosen)
  const [showLangModal, setShowLangModal] = useState(() => {
    return !localStorage.getItem('d1_onboarding_lang_selected');
  });

  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);

  // Slide 0: Interactive Live Habit Card simulation state
  const [slide1Mins, setSlide1Mins] = useState(95);
  const [slide1WorkoutDone, setSlide1WorkoutDone] = useState(true);

  // Slide 2: Interactive 5-Engine Curve Selector state
  const [selectedEngine, setSelectedEngine] = useState('build');

  // Helper score calculator for Deep Work (Build habit curve target 120m)
  const calculateDeepWorkScore = (mins) => {
    if (mins >= 120) return 100;
    if (mins <= 0) return 0;
    // S-curve graded credit
    const pct = mins / 120;
    return Math.min(100, Math.round(Math.pow(pct, 0.75) * 100));
  };

  const TOTAL_SLIDES = 6;
  const isHinglish = activeLang === 'hinglish';

  const handleLanguageChange = (lang) => {
    if (navigator.vibrate) navigator.vibrate(12);
    setActiveLang(lang);
    if (setLanguage) {
      setLanguage(lang);
    } else {
      localStorage.setItem('user_app_language', lang);
    }
  };

  const handleLanguageModalSelect = (lang) => {
    handleLanguageChange(lang);
    localStorage.setItem('d1_onboarding_lang_selected', 'true');
    setShowLangModal(false);
  };

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => {
      if (prev < TOTAL_SLIDES - 1) {
        if (navigator.vibrate) navigator.vibrate(15);
        return prev + 1;
      }
      return prev;
    });
  }, [TOTAL_SLIDES]);

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => {
      if (prev > 0) {
        if (navigator.vibrate) navigator.vibrate(10);
        return prev - 1;
      }
      return prev;
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    setTouchStartX(null);
  };

  // Helper to render the taller, square-proportioned SVG scoring curves on Slide 2
  const renderEngineCurve = () => {
    switch (selectedEngine) {
      case 'build':
        return (
          <div className="space-y-2 animate-in fade-in duration-200">
            <svg viewBox="0 0 280 150" className="w-full h-34 sm:h-38 block overflow-visible">
              <defs>
                <linearGradient id="grad-build-large" x1="0" y1="20" x2="0" y2="130" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <line x1="35" y1="25" x2="265" y2="25" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="35" y1="60" x2="265" y2="60" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="35" y1="95" x2="265" y2="95" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="35" y1="130" x2="265" y2="130" stroke="#cbd5e1" strokeWidth="1.2" />

              <text x="12" y="29" fontSize="10" fontWeight="800" fill="#059669">100</text>
              <text x="18" y="64" fontSize="9" fontWeight="600" fill="#94a3b8">70</text>
              <text x="18" y="99" fontSize="9" fontWeight="600" fill="#94a3b8">40</text>
              <text x="24" y="133" fontSize="9" fontWeight="700" fill="#64748b">0</text>

              <path 
                d="M35 130 C 85 130, 135 90, 185 25 L 265 25 L 265 130 Z" 
                fill="url(#grad-build-large)" 
              />
              <path 
                d="M35 130 C 85 130, 135 90, 185 25 L 265 25" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="4" 
                strokeLinecap="round" 
              />
              <line x1="185" y1="25" x2="185" y2="130" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="185" cy="25" r="5.5" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
              <text x="185" y="16" textAnchor="middle" fontSize="10" fontWeight="900" fill="#047857">
                {isHinglish ? "Target Reach = 100!" : "Target Reached = 100"}
              </text>
              <text x="225" y="142" textAnchor="middle" fontSize="9" fontWeight="700" fill="#64748b">
                {isHinglish ? "मेहनत (Minutes / Reps) →" : "Effort Done →"}
              </text>
            </svg>
            <div className="text-[11.5px] text-slate-700 bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-2.5 flex items-center justify-between">
              <div>
                <strong className="text-emerald-950 font-bold block">Build Habit Curve</strong>
                <span className="text-[10.5px] text-emerald-800">Deep Work, Gym, Reading, Hydration</span>
              </div>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 shrink-0">
                {isHinglish ? "हर मिनट का क्रेडिट" : "Graded Credit"}
              </span>
            </div>
          </div>
        );

      case 'break':
        return (
          <div className="space-y-2 animate-in fade-in duration-200">
            <svg viewBox="0 0 280 150" className="w-full h-34 sm:h-38 block overflow-visible">
              <defs>
                <linearGradient id="grad-break-large" x1="0" y1="20" x2="0" y2="130" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <line x1="35" y1="25" x2="265" y2="25" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="35" y1="130" x2="265" y2="130" stroke="#cbd5e1" strokeWidth="1.2" />

              <text x="12" y="29" fontSize="10" fontWeight="800" fill="#059669">100</text>
              <text x="24" y="133" fontSize="9" fontWeight="700" fill="#64748b">0</text>

              <path 
                d="M35 25 L 140 25 C 180 25, 200 65, 235 130 L 265 130 L 265 130 L 35 130 Z" 
                fill="url(#grad-break-large)" 
              />
              <path 
                d="M35 25 L 140 25 C 180 25, 200 65, 235 130 L 265 130" 
                fill="none" 
                stroke="#f43f5e" 
                strokeWidth="4" 
                strokeLinecap="round" 
              />
              <line x1="140" y1="25" x2="140" y2="130" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="140" cy="25" r="5.5" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
              <text x="135" y="16" textAnchor="middle" fontSize="10" fontWeight="900" fill="#047857">
                {isHinglish ? "Max Limit (100)" : "Ceiling Threshold (100)"}
              </text>
              <text x="225" y="118" textAnchor="middle" fontSize="9" fontWeight="900" fill="#e11d48">
                {isHinglish ? "Penalty Decay ↓" : "Penalty Curve ↓"}
              </text>
            </svg>
            <div className="text-[11.5px] text-slate-700 bg-rose-50/80 border border-rose-200/90 rounded-xl p-2.5 flex items-center justify-between">
              <div>
                <strong className="text-rose-950 font-bold block">Break Habit Curve</strong>
                <span className="text-[10.5px] text-rose-800">Screen Time, Junk Food, Smoking</span>
              </div>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 shrink-0">
                {isHinglish ? "लिमिट के अंदर = 100" : "Safe Under Limit"}
              </span>
            </div>
          </div>
        );

      case 'range':
        return (
          <div className="space-y-2 animate-in fade-in duration-200">
            <svg viewBox="0 0 280 150" className="w-full h-34 sm:h-38 block overflow-visible">
              <defs>
                <linearGradient id="grad-range-large" x1="0" y1="20" x2="0" y2="130" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <line x1="35" y1="25" x2="265" y2="25" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="35" y1="130" x2="265" y2="130" stroke="#cbd5e1" strokeWidth="1.2" />

              <text x="12" y="29" fontSize="10" fontWeight="800" fill="#d97706">100</text>
              <text x="24" y="133" fontSize="9" fontWeight="700" fill="#64748b">0</text>

              <path 
                d="M45 130 C 95 130, 115 25, 150 25 C 185 25, 205 130, 255 130 Z" 
                fill="url(#grad-range-large)" 
              />
              <path 
                d="M45 130 C 95 130, 115 25, 150 25 C 185 25, 205 130, 255 130" 
                fill="none" 
                stroke="#f59e0b" 
                strokeWidth="4" 
                strokeLinecap="round" 
              />
              <circle cx="150" cy="25" r="5.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" />
              <text x="150" y="16" textAnchor="middle" fontSize="10" fontWeight="900" fill="#b45309">
                {isHinglish ? "Sweet Spot (7-8 hrs) = 100" : "Sweet Spot = 100"}
              </text>
              <text x="80" y="142" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#94a3b8">
                {isHinglish ? "कम नींद = ड्रॉप" : "Too little"}
              </text>
              <text x="220" y="142" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#94a3b8">
                {isHinglish ? "ज़रूरत से ज़्यादा = ड्रॉप" : "Too much"}
              </text>
            </svg>
            <div className="text-[11.5px] text-slate-700 bg-amber-50/80 border border-amber-200/90 rounded-xl p-2.5 flex items-center justify-between">
              <div>
                <strong className="text-amber-950 font-bold block">Target Range Curve</strong>
                <span className="text-[10.5px] text-amber-800">Sleep (7-8 hrs), Optimal Calorie Zone</span>
              </div>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 shrink-0">
                {isHinglish ? "गोल्डन ज़ोन = 100" : "Golden Zone"}
              </span>
            </div>
          </div>
        );

      case 'timing':
        return (
          <div className="space-y-2 animate-in fade-in duration-200">
            <svg viewBox="0 0 280 150" className="w-full h-34 sm:h-38 block overflow-visible">
              <defs>
                <linearGradient id="grad-timing-large" x1="0" y1="20" x2="0" y2="130" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <line x1="35" y1="25" x2="265" y2="25" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="35" y1="130" x2="265" y2="130" stroke="#cbd5e1" strokeWidth="1.2" />

              <text x="12" y="29" fontSize="10" fontWeight="800" fill="#4f46e5">100</text>
              <text x="24" y="133" fontSize="9" fontWeight="700" fill="#64748b">0</text>

              <path 
                d="M35 25 L 90 25 C 160 25, 200 70, 265 110 L 265 130 L 35 130 Z" 
                fill="url(#grad-timing-large)" 
              />
              <path 
                d="M35 25 L 90 25 C 160 25, 200 70, 265 110" 
                fill="none" 
                stroke="#6366f1" 
                strokeWidth="4" 
                strokeLinecap="round" 
              />
              <circle cx="90" cy="25" r="5.5" fill="#6366f1" stroke="#ffffff" strokeWidth="2.5" />
              <text x="85" y="16" textAnchor="middle" fontSize="10" fontWeight="900" fill="#4338ca">
                {isHinglish ? "सुबह 9 AM से पहले = 100" : "Before 9 AM = 100"}
              </text>
              <text x="220" y="98" textAnchor="middle" fontSize="9" fontWeight="800" fill="#64748b">
                {isHinglish ? "दोपहर / शाम = 40-70" : "Late Execution = 40"}
              </text>
            </svg>
            <div className="text-[11.5px] text-slate-700 bg-indigo-50/80 border border-indigo-200/90 rounded-xl p-2.5 flex items-center justify-between">
              <div>
                <strong className="text-indigo-950 font-bold block">Timing Curve</strong>
                <span className="text-[10.5px] text-indigo-800">Morning Sunlight, Wake Up Time</span>
              </div>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 shrink-0">
                {isHinglish ? "सुबह पूरा = मैक्सिमम" : "Early Multiplier"}
              </span>
            </div>
          </div>
        );

      case 'binary':
      default:
        return (
          <div className="space-y-2 animate-in fade-in duration-200">
            <svg viewBox="0 0 280 150" className="w-full h-34 sm:h-38 block overflow-visible">
              <defs>
                <linearGradient id="grad-binary-large" x1="0" y1="20" x2="0" y2="130" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#0f172a" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <line x1="35" y1="25" x2="265" y2="25" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="35" y1="130" x2="265" y2="130" stroke="#cbd5e1" strokeWidth="1.2" />

              <text x="12" y="29" fontSize="10" fontWeight="800" fill="#0f172a">100</text>
              <text x="24" y="133" fontSize="9" fontWeight="700" fill="#64748b">0</text>

              <path 
                d="M35 130 L 140 130 L 140 25 L 265 25 L 265 130 Z" 
                fill="url(#grad-binary-large)" 
              />
              <path 
                d="M35 130 L 140 130 L 140 25 L 265 25" 
                fill="none" 
                stroke="#0f172a" 
                strokeWidth="4" 
                strokeLinecap="round" 
              />
              <circle cx="140" cy="25" r="5.5" fill="#0f172a" stroke="#ffffff" strokeWidth="2.5" />
              <text x="200" y="16" textAnchor="middle" fontSize="10" fontWeight="900" fill="#0f172a">
                {isHinglish ? "Done = 100!" : "Completed = 100"}
              </text>
              <text x="85" y="122" textAnchor="middle" fontSize="9" fontWeight="700" fill="#94a3b8">
                {isHinglish ? "Not done = 0" : "Pending = 0"}
              </text>
            </svg>
            <div className="text-[11.5px] text-slate-700 bg-slate-100 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
              <div>
                <strong className="text-slate-950 font-bold block">Binary Habit Curve</strong>
                <span className="text-[10.5px] text-slate-600">Daily Journaling, Take Vitamins</span>
              </div>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-slate-900 text-white shrink-0">
                {isHinglish ? "हाँ या ना = 0 या 100" : "Strict 0 or 100"}
              </span>
            </div>
          </div>
        );
    }
  };

  // Content for each slide
  const slides = [
    // ── SLIDE 0: TRACKS EVERY SINGLE STEP OF YOUR PROGRESS + COMPARISON + LIVE DASHBOARD ──
    {
      badge: "THE HABIT OPERATING SYSTEM",
      headline: isHinglish ? (
        <>आपकी हर एक Progress को Track करता है</>
      ) : (
        <>Tracks Every Single Step of Your Progress</>
      ),
      subtitle: isHinglish 
        ? "सिर्फ टिक और क्रॉस नहीं — D1 आपके हर छोटे-बड़े प्रयास को रिकॉर्ड करता है, ताकि आपको आपकी Real Progress दिखे।"
        : "Not just checkmarks and crosses — D1 records every minute, count, and effort so you see your true progress.",
      cta: isHinglish ? "पहला नियम: Rule of Top 3" : "Next: Rule of Top 3",
      renderBody: () => {
        const deepWorkScore = calculateDeepWorkScore(slide1Mins);
        const workoutScore = slide1WorkoutDone ? 100 : 0;
        // Weighted overall score: Top 1 (3x) + Top 2 (2x) -> (3*score1 + 2*score2) / 5
        const currentDailyOSScore = Math.round((3 * deepWorkScore + 2 * workoutScore) / 5);

        return (
          <div className="space-y-2.5 max-w-md mx-auto w-full">
            {/* THE D1 DIFFERENCE: Clean, Punchy Differentiator Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-3 sm:p-3.5 shadow-xs text-left flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0 mt-0.5">
                <Sparkle size={16} weight="fill" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-400">
                    {isHinglish ? "The D1 Difference" : "The D1 Difference"}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded">
                    {isHinglish ? "मैथमेटिकल प्रोग्रेस" : "Mathematical Precision"}
                  </span>
                </div>
                <p className="text-xs sm:text-[12.5px] font-bold text-slate-100 leading-snug mt-1">
                  {isHinglish ? (
                    <>साधारण चेकलिस्ट ऐप्स सिर्फ <span className="text-rose-400 font-extrabold">0 या 1</span> देखती हैं — <span className="text-emerald-400 font-black">D1 आपके हर मिनट और रिप का असली प्रोपोर्शनल स्कोर</span> निकालता है।</>
                  ) : (
                    <>Standard checklists only see <span className="text-rose-400 font-extrabold">0 or 1</span> — <span className="text-emerald-400 font-black">D1 calculates true proportional score</span> for every minute & rep.</>
                  )}
                </p>
              </div>
            </div>

            {/* LIVE HABIT CALCULATION PREVIEW */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-xs space-y-2 text-left">
              {/* HABIT 1: Deep Work with Modern Native Fluid Slider (NO thermometer, NO vertical ticks, NO orange tube) */}
              <div className="bg-slate-50/70 border border-amber-300/80 rounded-xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                      ⚡
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-950 truncate">
                          {isHinglish ? "Deep Work (Padhai / Code)" : "Deep Work (Study / Code)"}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[8.5px] font-black bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full border border-amber-300 shrink-0">
                          <Crown size={9} weight="fill" className="text-amber-600" />
                          <span>TOP 1 • 3.0x</span>
                        </span>
                      </div>
                      <span className="text-[9.5px] text-slate-400 font-semibold block">
                        Target: 120 mins
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className={`px-1.5 py-0.5 rounded font-mono text-[11px] font-black ${
                      deepWorkScore >= 80 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : deepWorkScore >= 40 
                          ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {deepWorkScore}%
                    </div>
                    <span className="font-mono text-xs font-black text-slate-900">
                      {slide1Mins}m
                    </span>
                  </div>
                </div>

                {/* Clean Sleek Native Draggable Slider Track */}
                <div 
                  className="flex items-center gap-2 pt-0.5"
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(8);
                      setSlide1Mins(prev => Math.max(0, prev - 15));
                    }}
                    className="w-6 h-6 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-xs font-bold transition-all active:scale-90 shadow-2xs"
                    aria-label="Decrease time"
                  >
                    <Minus size={11} weight="bold" />
                  </button>

                  <div className="flex-1 relative flex items-center">
                    <input
                      type="range"
                      min="0"
                      max="150"
                      step="5"
                      value={slide1Mins}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSlide1Mins(val);
                        if (navigator.vibrate && val % 15 === 0) navigator.vibrate(8);
                      }}
                      className="w-full h-2.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-amber-500"
                      aria-label="Adjust Deep Work minutes"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(8);
                      setSlide1Mins(prev => Math.min(150, prev + 15));
                    }}
                    className="w-6 h-6 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-xs font-bold transition-all active:scale-90 shadow-2xs"
                    aria-label="Increase time"
                  >
                    <Plus size={11} weight="bold" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[9.5px] text-slate-500 font-semibold px-0.5">
                  <span>0m</span>
                  <span className="text-amber-800 font-bold">
                    {slide1Mins >= 120 
                      ? (isHinglish ? "🎉 100% Target पूरा!" : "🎉 100% Target Met!") 
                      : (isHinglish ? `लक्ष्य: 120 मिनट (${120 - slide1Mins}m बाक़ी)` : `Target: 120m (${120 - slide1Mins}m left)`)}
                  </span>
                  <span>150m</span>
                </div>
              </div>

              {/* HABIT 2: Morning Gym with Binary Done Toggle */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                    💪
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-950 truncate">
                        {isHinglish ? "Morning Gym & Workout" : "Morning Gym & Workout"}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[8.5px] font-black bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded-full border border-amber-200 shrink-0">
                        <Crown size={9} weight="fill" className="text-amber-500" />
                        <span>TOP 2 • 2.0x</span>
                      </span>
                    </div>
                    <span className="text-[9.5px] text-slate-400 font-semibold block">Target: 45 mins</span>
                  </div>
                </div>

                {/* Clean Binary Yes/No Buttons */}
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(8);
                      setSlide1WorkoutDone(true);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10.5px] font-black transition-all flex items-center gap-1 ${
                      slide1WorkoutDone
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Check size={11} weight="bold" />
                    <span>{isHinglish ? "Yes (100%)" : "Yes (100%)"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(8);
                      setSlide1WorkoutDone(false);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1 ${
                      !slide1WorkoutDone
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <X size={11} weight="bold" />
                    <span>{isHinglish ? "No (0%)" : "No (0%)"}</span>
                  </button>
                </div>
              </div>

              {/* Bottom micro-banner */}
              <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[10.5px] text-indigo-950 font-bold">
                <div className="flex items-center gap-1.5">
                  <Sparkle size={12} weight="fill" className="text-indigo-600 shrink-0" />
                  <span>{isHinglish ? "Minutes, count या Yes/No — अपने नियम, अपनी प्रोग्रेस।" : "Track by minutes, count, amount or Yes/No — your rules."}</span>
                </div>
                <span className="text-indigo-600 font-black shrink-0 text-[10px]">Real OS</span>
              </div>
            </div>
          </div>
        );
      }
    },

    // ── SLIDE 1: PRIORITY HABITS (RULE OF TOP 3) ──
    {
      badge: "FEATURE 01 • RULE OF TOP 3",
      headline: isHinglish ? (
        <>10 आसान काम टिक करके खुश होना बंद करो。<br /><span className="text-amber-600">The Rule of Top 3.</span></>
      ) : (
        <>Stop ticking 10 easy tasks.<br /><span className="text-amber-600">The Rule of Top 3.</span></>
      ),
      subtitle: isHinglish 
        ? "D1 में तुम अपनी Top 3 non-negotiables को 30 दिन के लिए लॉक करते हो — इनपर मिलता है 3x असली असर।"
        : "Lock your Top 3 non-negotiables for 30 days. They carry higher score weight to keep your focus razor-sharp.",
      cta: isHinglish ? "अगला: 5 स्कोरिंग कर्व्स" : "Next: 5 Scoring Curves",
      renderBody: () => (
        <div className="space-y-2 max-w-md mx-auto w-full">
          {/* Priority Weighting Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-2xs space-y-2 text-left">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span>{isHinglish ? "HABIT" : "HABIT"}</span>
              <span>{isHinglish ? "WEIGHT / असली असर" : "IMPACT WEIGHT"}</span>
            </div>

            {/* Top 1 */}
            <div className="flex items-center justify-between py-1 bg-amber-50/50 rounded-lg px-2 border border-amber-100/70">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-md bg-amber-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                  1
                </span>
                <span className="text-xs font-bold text-slate-900 truncate">
                  {isHinglish ? "Deep Work / Padhai (2 hrs)" : "Deep Work / Study (2 hrs)"}
                </span>
              </div>
              <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 shrink-0">
                3.0x Weight
              </span>
            </div>

            {/* Top 2 */}
            <div className="flex items-center justify-between py-1 bg-amber-50/30 rounded-lg px-2 border border-amber-100/50">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center shrink-0">
                  2
                </span>
                <span className="text-xs font-bold text-slate-900 truncate">
                  {isHinglish ? "Workout & High Protein" : "Workout & High Protein"}
                </span>
              </div>
              <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 shrink-0">
                2.0x Weight
              </span>
            </div>

            {/* Routine */}
            <div className="flex items-center justify-between py-1 px-2 opacity-70">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                  •
                </span>
                <span className="text-xs font-medium text-slate-700 truncate">
                  {isHinglish ? "Drink 2L Water (Routine)" : "Drink 2L Water (Routine)"}
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                1.0x Weight
              </span>
            </div>
          </div>

          {/* Punchy Psychology Card */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 flex items-start gap-2 text-left">
            <Crown size={18} weight="fill" className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] sm:text-xs text-amber-950 leading-snug">
              {isHinglish ? (
                <><strong>साइकोलॉजिकल सच:</strong> 10 छोटी चीज़ें टिक करके #1 प्रायोरिटी छोड़ना सिर्फ छुपा हुआ Procrastination है। D1 तुम्हें सच्चा रखता है।</>
              ) : (
                <><strong>Psychological Truth:</strong> Checking off 10 minor tasks while skipping your #1 priority is hidden procrastination. D1 keeps you honest.</>
              )}
            </p>
          </div>
        </div>
      )
    },

    // ── SLIDE 2: 5 PRECISION SCORING CURVES ──
    {
      badge: "FEATURE 02 • 5 SCORING CURVES",
      headline: isHinglish ? (
        <>30 में से 25 मिनट पढ़ा तो 0% फेल?<br /><span className="text-emerald-600">5 Precision Scoring Curves.</span></>
      ) : (
        <>Did 25 of 30 mins and scored 0%?<br /><span className="text-emerald-600">5 Precision Scoring Curves.</span></>
      ),
      subtitle: isHinglish 
        ? "असली ज़िंदगी 0 या 1 नहीं होती। D1 में हर आदत के लिए अलग मैथमेटिकल कर्व है — नीचे टैप करके कर्व्स देखो:"
        : "Real life isn't black or white. D1 maps each habit to real mathematical curves — tap below to inspect:",
      cta: isHinglish ? "अगला: रेज़िलिएंस & बाउंस-बैक हब" : "Next: Resilience & Comeback Hub",
      renderBody: () => (
        <div className="space-y-2 max-w-md mx-auto w-full">
          {/* Responsive Wrapped Tabs */}
          <div 
            className="grid grid-cols-3 sm:flex sm:items-center gap-1.5"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {[
              { id: 'build', label: isHinglish ? '📈 Build' : '📈 Build' },
              { id: 'break', label: isHinglish ? '📉 Break' : '📉 Break' },
              { id: 'range', label: isHinglish ? '🎯 Range' : '🎯 Range' },
              { id: 'timing', label: isHinglish ? '⏰ Timing' : '⏰ Timing' },
              { id: 'binary', label: isHinglish ? '⚡ Binary' : '⚡ Binary' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(10);
                  setSelectedEngine(tab.id);
                }}
                className={`px-2 py-1.5 text-xs font-bold rounded-xl transition-all text-center ${
                  selectedEngine === tab.id
                    ? 'bg-slate-950 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:text-slate-950 border border-slate-200/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* SVG Chart Container */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs">
            {renderEngineCurve()}
          </div>

          {/* Comparison Punchline */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-rose-700 font-semibold">
              <X size={12} weight="bold" />
              <span>{isHinglish ? "पुरानी Apps: 0% Fail" : "Old Apps: 0% Fail"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
              <Check size={14} weight="bold" />
              <span>{isHinglish ? "D1: 83% Proportional Score" : "D1: 83% Graded Score"}</span>
            </div>
          </div>
        </div>
      )
    },

    // ── SLIDE 3: ACTUAL RESILIENCE HUB & 7-DAY COMEBACK BAR ──
    {
      badge: "FEATURE 03 • RESILIENCE HUB",
      headline: isHinglish ? (
        <>Streak टूटने से कोई नहीं हारता。<br /><span className="text-orange-600">हारते हैं अगले दिन वापस न आने से।</span></>
      ) : (
        <>A missed day doesn't break you.<br /><span className="text-orange-600">Failing to bounce back does.</span></>
      ),
      subtitle: isHinglish 
        ? "Perfectionism ही आदत छोड़ने की वजह है। D1 का असली Resilience Hub तुम्हारे हर कमबैक को ट्रैक करता है:"
        : "Perfectionism kills habits. D1's actual Resilience Hub tracks every bounce-back so you never quit:",
      cta: isHinglish ? "अगला: पूरा सिस्टम बिल्कुल मुफ़्त" : "Next: Everything Free",
      renderBody: () => (
        <div className="space-y-2 max-w-md mx-auto w-full">
          {/* REAL D1 APP RESILIENCE HUB CARD */}
          <div className="bg-gradient-to-b from-[#140b05] via-[#0d0703] to-[#0a0502] text-white rounded-2xl p-3.5 border border-orange-900/50 shadow-md space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold">
                  <ShieldCheck size={18} weight="fill" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 block leading-tight">
                    RESILIENCE SCORE
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    {isHinglish ? "बाउंस-बैक & रिकवरी रेट" : "Bounce-Back Win Rate"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-orange-500 leading-none">86%</div>
                <span className="text-[9.5px] font-extrabold text-orange-200 bg-orange-900/40 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                  High Resilience
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-orange-900/40 text-left">
              <div className="bg-[#170c06] rounded-xl p-2 border border-orange-900/30">
                <span className="text-[9px] font-bold text-orange-300 uppercase tracking-wider block">RECOVERY STREAK</span>
                <span className="text-sm font-black text-white mt-0.5 block">4 Bounces</span>
                <span className="text-[9px] text-orange-400 font-medium">Consecutive Comebacks</span>
              </div>
              <div className="bg-[#170c06] rounded-xl p-2 border border-orange-900/30">
                <span className="text-[9px] font-bold text-orange-300 uppercase tracking-wider block">7-DAY WIN RATE</span>
                <span className="text-sm font-black text-emerald-400 mt-0.5 block">6 of 7 Days</span>
                <span className="text-[9px] text-emerald-400/80 font-medium">≥70% Rebound Target</span>
              </div>
            </div>
          </div>

          {/* REAL 7-DAY COMEBACK BAR */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-2 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-1.5 text-slate-900">
                <CalendarCheck size={15} weight="bold" className="text-orange-600" />
                <span>{isHinglish ? "7-Day Comeback Window" : "7-Day Comeback Window"}</span>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Recovered (+100 Pts)
              </span>
            </div>

            <div className="flex items-center justify-between gap-1 pt-1">
              <div className="flex-1 text-center">
                <div className="w-6 h-6 mx-auto rounded-lg bg-rose-100 text-rose-700 font-black text-[10px] flex items-center justify-center">
                  ✕
                </div>
                <span className="text-[8.5px] text-rose-600 font-bold block mt-0.5">Miss</span>
              </div>
              <div className="w-1.5 h-0.5 bg-slate-200"></div>

              {[
                { d: 'D1', ok: true },
                { d: 'D2', ok: true },
                { d: 'D3', ok: true },
                { d: 'D4', ok: true },
                { d: 'D5', ok: true },
                { d: 'D6', ok: true }
              ].map((step, idx) => (
                <div key={idx} className="flex-1 text-center">
                  <div className="w-6 h-6 mx-auto rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center">
                    ✓
                  </div>
                  <span className="text-[8.5px] text-slate-400 font-medium block mt-0.5">{step.d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },

    // ── SLIDE 4: EVERYTHING YOU NEED (100% FREE FOREVER + AI COACH PRO) ──
    {
      badge: "FEATURE 04 • EVERYTHING YOU NEED",
      headline: isHinglish ? (
        <>पूरा Habit System, बिल्कुल Free.</>
      ) : (
        <>The Entire Habit System, 100% Free.</>
      ),
      subtitle: isHinglish 
        ? "सिर्फ टिक और क्रॉस नहीं — D1 आपको complete tracking, analytics और deep insights देता है, बिना किसी premium के।"
        : "No paywalls on discipline — D1 gives you full tracking, deep analytics, and recovery systems completely free.",
      cta: isHinglish ? "अगला: प्रूवन रूटीन बंडल्स" : "Next: Routine Presets",
      renderBody: () => {
        // 9 items with Phosphor icons and verified green checkmarks
        const freeFeatures = [
          { icon: Lightning, color: "text-amber-500", titleHi: "8 Active Habits", titleEn: "8 Active Habits" },
          { icon: Sliders, color: "text-indigo-500", titleHi: "6 Custom Habits", titleEn: "6 Custom Habits" },
          { icon: CalendarBlank, color: "text-blue-500", titleHi: "180 Days History", titleEn: "180 Days History" },
          { icon: ChartLineUp, color: "text-emerald-500", titleHi: "Analytics & Graphs", titleEn: "Analytics & Graphs" },
          { icon: Flame, color: "text-orange-500", titleHi: "Streak Tracking", titleEn: "Streak Tracking" },
          { icon: ShieldCheck, color: "text-teal-500", titleHi: "Resilience Score", titleEn: "Resilience Score" },
          { icon: Compass, color: "text-purple-500", titleHi: "Daily Compass", titleEn: "Daily Compass" },
          { icon: ChartBar, color: "text-cyan-600", titleHi: "Deep Dive Analytics", titleEn: "Deep Dive Analytics" },
          { icon: Package, color: "text-amber-600", titleHi: "Habit Bundles", titleEn: "Habit Bundles" }
        ];

        return (
          <div className="space-y-2.5 max-w-md mx-auto w-full text-left">
            {/* 100% FREE FOREVER CARD */}
            <div className="bg-white border-2 border-emerald-500 rounded-2xl p-3 shadow-xs space-y-2 relative overflow-hidden">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-1 border-b border-emerald-100">
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={18} weight="fill" className="text-emerald-500 shrink-0" />
                  <span className="text-xs font-black text-emerald-950">
                    {isHinglish ? "100% Free Forever" : "100% Free Forever"}
                  </span>
                </div>
                <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                  {isHinglish ? "लाइफटाइम फ्री" : "Lifetime Free"}
                </span>
              </div>

              {/* 3x3 Grid of 9 Free Features (ICONS + VERIFIED TICK, TITLES ONLY) */}
              <div className="grid grid-cols-3 gap-1.5">
                {freeFeatures.map((item, idx) => {
                  const IconComponent = item.icon;
                  return (
                    <div 
                      key={idx}
                      className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl p-1.5 flex flex-col justify-between text-left min-h-[42px]"
                    >
                      <div className="flex items-center justify-between">
                        <IconComponent size={14} weight="fill" className={item.color} />
                        <CheckCircle size={13} weight="fill" className="text-emerald-500 shrink-0" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-900 leading-tight block mt-1 truncate">
                        {isHinglish ? item.titleHi : item.titleEn}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* D1 AI HABIT COACH (PREMIUM) CARD - ULTRA-COMPACT */}
            <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-white border-2 border-orange-400/80 rounded-2xl p-2.5 sm:p-3 shadow-xs space-y-1.5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-950">
                    Definite AI Coach
                  </span>
                  <ProPill size="xs" />
                </div>
                <span className="text-[9px] font-extrabold text-amber-800 dark:text-amber-300 bg-amber-100/90 border border-amber-300 px-1.5 py-0.2 rounded-md">
                  {isHinglish ? "Upcoming • PRO" : "Upcoming • PRO"}
                </span>
              </div>

              {/* Robot Mascot + Speech Bubble & 4 Bullets */}
              <div className="flex items-center gap-2.5">
                {/* 3D Robot Mascot (Cropped from reference image) */}
                <div className="shrink-0 w-12 h-16 sm:w-14 sm:h-18 rounded-xl bg-orange-100/50 border border-orange-200 flex items-center justify-center p-0.5 shadow-2xs overflow-hidden">
                  <img 
                    src="/d1-ai-robot.png" 
                    alt="D1 AI Habit Coach" 
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Right side: Speech Bubble Quote + 4 Feature Badges */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="bg-white/90 border border-orange-200/80 rounded-xl px-2 py-1 shadow-2xs text-[10.5px] text-slate-800 font-medium leading-tight">
                    {isHinglish 
                      ? "“पैटर्न डिटेक्ट करता है, ड्रॉप्स अलर्ट करता है और 24/7 पर्सनल एडवाइस देता है।”"
                      : "“Audits habit telemetry, catches drop patterns, and delivers 24/7 guidance.”"}
                  </div>

                  {/* 4 Compact Pills in 2x2 grid with Phosphor icons */}
                  <div className="grid grid-cols-2 gap-1 text-[9.5px]">
                    <div className="bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 text-slate-800 font-bold flex items-center gap-1 truncate">
                      <Lightning size={11} weight="fill" className="text-amber-500 shrink-0" />
                      <span className="truncate">{isHinglish ? "पैटर्न डिटेक्शन" : "Pattern Detection"}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 text-slate-800 font-bold flex items-center gap-1 truncate">
                      <Lightbulb size={11} weight="fill" className="text-amber-500 shrink-0" />
                      <span className="truncate">{isHinglish ? "स्मार्ट सुझाव" : "Smart Suggestions"}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 text-slate-800 font-bold flex items-center gap-1 truncate">
                      <Warning size={11} weight="fill" className="text-amber-500 shrink-0" />
                      <span className="truncate">{isHinglish ? "रिस्क अलर्ट्स" : "Risk Alerts"}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 text-slate-800 font-bold flex items-center gap-1 truncate">
                      <Target size={11} weight="fill" className="text-orange-500 shrink-0" />
                      <span className="truncate">{isHinglish ? "24/7 गाइडेंस" : "24/7 Guidance"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
    },

    // ── SLIDE 5: PRE-MADE ROUTINE PRESETS & WHAT HAPPENS NEXT ──
    {
      badge: "GET STARTED • READY SYSTEMS",
      headline: isHinglish ? (
        <>शुरू करने की झिझक खत्म。<br /><span className="text-indigo-600">प्रूवन रूटीन चुनो या खुद बनाओ।</span></>
      ) : (
        <>Zero blank page anxiety.<br /><span className="text-indigo-600">Choose a proven system.</span></>
      ),
      subtitle: isHinglish 
        ? "खाली स्क्रीन से शुरू करने की ज़रूरत नहीं है। प्रूवन रूटीन बंडल चुनो — अगली स्क्रीन पर तुम अपनी पसंद से कोई भी हैबिट रख या हटा सकते हो!"
        : "Don't start from a blank screen. Select a pre-configured bundle—you can customize or remove any habit on the next step!",
      cta: null,
      renderBody: () => (
        <div className="space-y-2 max-w-md mx-auto w-full text-left">
          {/* Bundle 1 */}
          <button 
            type="button"
            onClick={onChooseBundle || onComplete}
            className="w-full text-left bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 sm:p-3 shadow-2xs transition-all active:scale-[0.99] group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🔥</span>
                <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                  {isHinglish ? "Monk Mode / Extreme Discipline" : "Monk Mode / Extreme Focus"}
                </span>
              </div>
              <CaretRight size={14} className="text-slate-400 group-hover:text-slate-900" />
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 pl-6 leading-tight">
              {isHinglish 
                ? "Deep Work (Top 1) • Daily Workout • Digital Sunset"
                : "Deep Work (Top 1) • Daily Workout • Digital Sunset"}
            </p>
          </button>

          {/* Bundle 2 */}
          <button 
            type="button"
            onClick={onChooseBundle || onComplete}
            className="w-full text-left bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 sm:p-3 shadow-2xs transition-all active:scale-[0.99] group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                  {isHinglish ? "High Energy & Peak Health" : "High Energy & Vitality"}
                </span>
              </div>
              <CaretRight size={14} className="text-slate-400 group-hover:text-slate-900" />
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 pl-6 leading-tight">
              {isHinglish 
                ? "8K Steps • 3L Water • 7.5h Sleep Routine"
                : "8K Steps • 3L Water • 7.5h Sleep Routine"}
            </p>
          </button>

          {/* Bundle 3 */}
          <button 
            type="button"
            onClick={onChooseBundle || onComplete}
            className="w-full text-left bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 sm:p-3 shadow-2xs transition-all active:scale-[0.99] group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🧠</span>
                <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                  {isHinglish ? "Mental Clarity & Growth" : "Mental Clarity & Growth"}
                </span>
              </div>
              <CaretRight size={14} className="text-slate-400 group-hover:text-slate-900" />
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 pl-6 leading-tight">
              {isHinglish 
                ? "20 Min Reading • Daily Reflection • Meditation"
                : "20 Min Reading • Daily Reflection • Meditation"}
            </p>
          </button>

          {/* Explanatory note of what happens next */}
          <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-xl p-2.5 flex items-center gap-2">
            <span className="text-indigo-600 font-black text-xs shrink-0">👉</span>
            <p className="text-[10.5px] text-indigo-950 leading-snug">
              {isHinglish 
                ? "बंडल चुनते ही तुम Habit Selector पर पहुंचोगे, जहाँ तुम इनमें से किसी भी हैबिट को बदल या हटा सकोगे!"
                : "Selecting a preset takes you to the Habit Selector, where you can customize or remove any item!"}
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentContent = slides[currentSlide];

  return (
    <div 
      className="fixed inset-0 z-[100] bg-white text-slate-900 flex flex-col justify-between font-sans antialiased overflow-hidden select-none"
      style={{
        height: '100dvh',
        minHeight: '100dvh',
        maxHeight: '100dvh'
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── 00. INITIAL ONBOARDING LANGUAGE SELECTION MODAL ── */}
      {showLangModal && (
        <div className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
              <img 
                src="/icon-d-black.svg?v=8" 
                alt="Definite" 
                className="h-6 w-auto invert" 
              />
            </div>

            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-black text-slate-950">
                Choose Language / भाषा चुनें
              </h2>
              <p className="text-xs text-slate-500 leading-snug">
                Select your preferred language. You can change this anytime from the top bar.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleLanguageModalSelect('hinglish')}
                className="flex items-center justify-between p-3.5 rounded-2xl border-2 border-slate-900 bg-slate-50 hover:bg-slate-100 text-left transition-all active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🇮🇳</span>
                  <div>
                    <span className="text-sm font-black text-slate-950 block">हिंग्लिश (Hinglish)</span>
                    <span className="text-[11px] text-slate-500 font-medium">हिंदी + English (Natural & Recommended)</span>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">
                  ✓
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleLanguageModalSelect('en')}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-left transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🇬🇧</span>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">English</span>
                    <span className="text-[11px] text-slate-500 font-medium">Standard English</span>
                  </div>
                </div>
                <CaretRight size={16} className="text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 01. LIQUID TOP BAR: OFFICIAL LOGO, PROGRESS DOTS & LANGUAGE TOGGLE ── */}
      <header 
        className="w-full max-w-lg mx-auto shrink-0 flex items-center justify-between px-4 sm:px-6 pb-1"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)'
        }}
      >
        {/* Official Definite Brand Logo */}
        <div className="flex items-center gap-2">
          <img 
            src="/icon-d-black.svg?v=8" 
            alt="Definite" 
            className="h-6 sm:h-7 w-auto object-contain shrink-0" 
          />
          <span className="text-sm font-black tracking-tight text-slate-950">
            D1
          </span>
        </div>

        {/* Center: Progress Indicators */}
        <div className="flex items-center gap-1.5 px-2">
          {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentSlide === idx 
                  ? 'w-6 bg-slate-950' 
                  : 'w-1.5 bg-slate-200 hover:bg-slate-300'
              }`}
            />
          ))}
        </div>

        {/* Right: Language Pill & Skip */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200">
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-all ${
                !isHinglish
                  ? 'bg-white text-slate-950 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('hinglish')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-all ${
                isHinglish
                  ? 'bg-white text-slate-950 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              हिं
            </button>
          </div>

          {currentSlide < TOTAL_SLIDES - 1 && (
            <button
              type="button"
              onClick={onComplete}
              className="text-xs font-semibold text-slate-400 hover:text-slate-800 transition-colors"
            >
              {isHinglish ? "Skip" : "Skip"}
            </button>
          )}
        </div>
      </header>

      {/* ── 02. LIQUID SCROLL-SAFE CONTENT BODY (TIGHT, COMPACT, ZERO DEAD SPACE) ── */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-1 flex flex-col justify-center max-w-lg mx-auto w-full">
        {/* Top: Hook Headline Section */}
        <div className="shrink-0 text-center mb-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[9.5px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
            <Sparkle size={10} weight="fill" className="text-amber-500" />
            <span>{currentContent.badge}</span>
          </div>

          <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight leading-snug">
            {currentContent.headline}
          </h1>

          <p className="text-xs sm:text-[13px] font-semibold text-slate-700 max-w-sm mx-auto mt-1 leading-normal">
            {currentContent.subtitle}
          </p>
        </div>

        {/* Center: Slide Visual Component */}
        <div className="shrink-0 my-1">
          {currentContent.renderBody()}
        </div>

        {/* Bottom Context Footnote */}
        <div className="shrink-0 text-center text-[10px] text-slate-400 mt-1">
          {isHinglish 
            ? `Slide ${currentSlide + 1} of ${TOTAL_SLIDES} • Swipe karke aage badhein`
            : `Slide ${currentSlide + 1} of ${TOTAL_SLIDES} • Swipe left or right to explore`}
        </div>
      </main>

      {/* ── 03. LIQUID SAFE-AREA BOTTOM CONTROLS ── */}
      <footer 
        className="w-full max-w-lg mx-auto shrink-0 px-4 sm:px-6 pt-1 pb-3"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 14px)'
        }}
      >
        {currentSlide < TOTAL_SLIDES - 1 ? (
          <div className="flex items-center gap-2">
            {currentSlide > 0 && (
              <button
                type="button"
                onClick={prevSlide}
                className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 transition-all active:scale-95"
                aria-label="Previous Slide"
              >
                <ArrowLeft size={16} weight="bold" />
              </button>
            )}

            <button
              type="button"
              onClick={nextSlide}
              className="flex-1 h-11 rounded-2xl bg-slate-950 hover:bg-slate-900 active:scale-[0.99] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>{currentContent.cta}</span>
              <ArrowRight size={15} weight="bold" />
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={onChooseBundle || onComplete}
              className="w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span>{isHinglish ? "प्रूवन रूटीन चुनो (आगे बढ़ें)" : "Choose a Pre-made Routine"}</span>
              <ArrowRight size={15} weight="bold" />
            </button>

            <button
              type="button"
              onClick={onAddHabit || onComplete}
              className="w-full h-9 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-[0.99] text-slate-800 font-semibold text-xs tracking-wide transition-all flex items-center justify-center"
            >
              {isHinglish ? "या ज़ीरो से अपनी आदतें बनाओ" : "Or Build Custom from Scratch"}
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}
