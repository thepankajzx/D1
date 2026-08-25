import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendUp, 
  TrendDown, 
  Target, 
  Clock, 
  CheckCircle, 
  Info, 
  BookOpen, 
  DeviceMobile, 
  MoonStars, 
  Alarm, 
  PottedPlant,
  Lightbulb,
  ArrowLeft,
  Sparkle
} from '@phosphor-icons/react';

export default function ScoringGuide() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('build');
  const [tooltipText, setTooltipText] = useState(null);

  const tabs = [
    { id: 'build', label: 'Build', icon: TrendUp, themeColor: '#3f7cff', themeBg: '#f0f5ff' },
    { id: 'break', label: 'Break', icon: TrendDown, themeColor: '#e5484d', themeBg: '#fff0f1' },
    { id: 'balance', label: 'Balance', icon: Target, themeColor: '#7656e8', themeBg: '#f4f0ff' },
    { id: 'sustain', label: 'Sustain', icon: Clock, themeColor: '#f88f22', themeBg: '#fff6ed' },
    { id: 'track', label: 'Track', icon: CheckCircle, themeColor: '#12a66a', themeBg: '#f0fbf5' }
  ];

  const handleTabClick = (id) => {
    if (navigator.vibrate) navigator.vibrate(25);
    setActiveTab(id);
    setTooltipText(null);
  };

  const toggleTooltip = (text, e) => {
    e.stopPropagation();
    if (navigator.vibrate) navigator.vibrate(20);
    setTooltipText(prev => prev === text ? null : text);
  };

  return (
    <div className="w-full max-w-2xl sm:max-w-3xl mx-auto pb-28 pt-2 px-3 sm:px-6 font-sans">
      
      {/* ── Top Navigation Bar ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors rounded-2xl bg-slate-100 dark:bg-[#1c1e26] hover:bg-slate-200 dark:hover:bg-[#2a2d37] px-3.5 py-2 text-xs sm:text-sm cursor-pointer border border-transparent dark:border-[#2a2d37]"
        >
          <ArrowLeft size={16} weight="bold" />
          <span>Back</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-slate-200 dark:border-[#2a2d37] bg-white dark:bg-[#1c1e26] rounded-full text-xs font-bold text-slate-600 dark:text-slate-400 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#12a66a]" />
          <span>SCORING INTELLIGENCE</span>
        </div>
      </div>

      {/* ── Main Scoring Card Container (Identical to Habit Selector Modal) ── */}
      <div className="bg-[#f8fafc] dark:bg-[#131722] rounded-3xl shadow-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col">
        
        {/* Card Header */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 bg-white dark:bg-[#151a26] border-b border-slate-200/80 dark:border-slate-800">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Not just done. But how well?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal mt-0.5">
            Choose how your habit is measured — consistency to precision.
          </p>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-6 space-y-4">
          
          {/* Quick Nav (5 Tactile Segmented Tabs) */}
          <nav className="grid grid-cols-5 bg-white dark:bg-[#1c1e26] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden max-w-full">
            {tabs.map(tab => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  style={{
                    backgroundColor: isActive ? tab.themeBg : 'transparent'
                  }}
                  className={`flex flex-col items-center justify-center py-2.5 sm:py-3.5 px-1 relative transition-all cursor-pointer border-r border-slate-100 dark:border-slate-800 last:border-r-0 ${
                    isActive ? 'font-bold' : 'font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <IconComp 
                    size={20} 
                    weight="fill" 
                    style={{ color: tab.themeColor }}
                    className={`transition-transform duration-200 mb-1 ${isActive ? 'scale-110' : ''}`}
                  />
                  <span className="text-[10px] sm:text-xs tracking-tight" style={{ color: isActive ? '#111318' : '#64748b' }}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <div 
                      className="absolute bottom-0 left-[15%] right-[15%] h-[3px] rounded-t-full"
                      style={{ backgroundColor: tab.themeColor }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Active Card Content */}
          <div className="bg-white dark:bg-[#1c1e26] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden flex flex-col">
            
            {/* =====================================================
                 01 — BUILD (MORE = BETTER)
            ====================================================== */}
            {activeTab === 'build' && (
              <div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        01
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                          More = Better
                        </h2>
                        <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
                          The more you do, the higher you score!
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => toggleTooltip("The more you do, the higher your score. Your score keeps going up until you hit your target. After that, it stays at a perfect 100. Great for reading, walking, or drinking water.", e)}
                      className="w-8 h-8 rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                      title="More information"
                    >
                      <Info size={18} weight="fill" />
                    </button>
                  </div>

                  {tooltipText && (
                    <div className="bg-slate-900 text-white text-xs p-3 rounded-xl mb-3 shadow-lg leading-relaxed animate-in fade-in">
                      {tooltipText}
                    </div>
                  )}

                  {/* SVG Chart */}
                  <div className="w-full relative mt-3">
                    <svg className="w-full h-auto block overflow-visible" viewBox="0 20 900 365" role="img">
                      <defs>
                        <linearGradient id="grad-build-page" x1="0" y1="70" x2="0" y2="325" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#12a66a"/>
                          <stop offset="66.66%" stopColor="#12a66a"/>
                          <stop offset="66.66%" stopColor="#e5484d"/>
                          <stop offset="100%" stopColor="#e5484d"/>
                        </linearGradient>
                      </defs>

                      <line x1="105" y1="70" x2="820" y2="70" className="stroke-slate-200 dark:stroke-slate-700/50" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="155" x2="820" y2="155" className="stroke-slate-200 dark:stroke-slate-700/50" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="240" x2="820" y2="240" className="stroke-slate-200 dark:stroke-slate-700/50" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="315" x2="820" y2="315" className="stroke-slate-200 dark:stroke-slate-700/50" strokeWidth="1" strokeDasharray="4 5" />

                      <line x1="105" y1="55" x2="105" y2="325" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="1.2" />
                      <line x1="105" y1="325" x2="820" y2="325" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="1.2" />

                      <text x="55" y="76" fill="#12a66a" fontSize="18" fontWeight="800">100</text>
                      <text x="72" y="161" className="fill-slate-500 dark:fill-slate-400" fontSize="14" fontWeight="600">75</text>
                      <text x="72" y="246" className="fill-slate-500 dark:fill-slate-400" fontSize="14" fontWeight="600">50</text>
                      <text x="72" y="321" className="fill-slate-500 dark:fill-slate-400" fontSize="14" fontWeight="600">0</text>

                      {/* Area */}
                      <path d="M105 315 L220 270 L335 220 L450 165 L560 105 L640 70 L820 70 L820 325 L105 325 Z" fill="rgba(18,166,106,.09)" />
                      {/* Gradient Line */}
                      <path stroke="url(#grad-build-page)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" d="M105 315 C155 295, 190 282, 220 270 C265 250, 300 236, 335 220 C380 198, 420 181, 450 165 C500 138, 535 119, 560 105 C595 85, 620 70, 640 70 L820 70" />

                      <circle cx="640" cy="70" r="12" fill="#12a66a" className="stroke-white dark:stroke-[#1c1e26]" strokeWidth="4" />

                      <text x="640" y="40" textAnchor="middle" fill="#12a66a" fontSize="18" fontWeight="800">100</text>
                      <text x="220" y="252" textAnchor="middle" className="fill-slate-900 dark:fill-slate-200" fontSize="18" fontWeight="800">25</text>
                      <text x="335" y="202" textAnchor="middle" className="fill-slate-900 dark:fill-slate-200" fontSize="18" fontWeight="800">40</text>
                      <text x="450" y="147" textAnchor="middle" className="fill-slate-900 dark:fill-slate-200" fontSize="18" fontWeight="800">60</text>
                      <text x="560" y="87" textAnchor="middle" className="fill-slate-900 dark:fill-slate-200" fontSize="18" fontWeight="800">80</text>

                      <line x1="640" y1="70" x2="640" y2="325" stroke="#12a66a" strokeWidth="2" strokeDasharray="6 7" />

                      <text x="640" y="355" textAnchor="middle" className="fill-slate-900 dark:fill-slate-200" fontSize="13" fontWeight="800">REACH HERE = 100!</text>
                      <text transform="translate(24 190) rotate(-90)" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="14" fontWeight="600">Your score</text>
                      <text x="460" y="347" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="14" fontWeight="600">How much you did →</text>
                    </svg>
                  </div>
                  <p className="text-center text-xs font-semibold text-slate-600 dark:text-slate-400 mt-3">
                    Keep pushing! Once you hit your goal, you get a perfect score.
                  </p>
                </div>

                <div className="border-t border-dashed border-slate-200 dark:border-slate-800" />

                {/* Score Strip */}
                <div className="grid grid-cols-3 gap-2 p-3.5 sm:p-4 bg-slate-50/70 dark:bg-[#181a20]/70">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">LOWER RESULT</span>
                    <strong className="text-xs text-slate-900 dark:text-slate-100 font-bold mt-0.5">Just a little (40)</strong>
                  </div>
                  <div className="flex flex-col text-emerald-700 dark:text-emerald-400">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">TARGET</span>
                    <strong className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Hit the target! (100)</strong>
                  </div>
                  <div className="flex flex-col text-emerald-700 dark:text-emerald-400">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">ABOVE TARGET</span>
                    <strong className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Went above (100)</strong>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-200 dark:border-slate-800" />

                {/* Example Section */}
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase">Real-life example</span>
                      <h3 className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        <BookOpen size={18} weight="fill" className="text-blue-500" /> Daily Reading
                      </h3>
                      <span className="text-xs text-slate-500">Goal: Read for 60 minutes</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-center bg-white dark:bg-[#16181f] shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold">20 min</strong>
                      <span className="block text-[11px] font-bold text-slate-500 mt-0.5">40 pts</span>
                    </div>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-center bg-white dark:bg-[#16181f] shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold">40 min</strong>
                      <span className="block text-[11px] font-bold text-slate-500 mt-0.5">70 pts</span>
                    </div>
                    <div className="border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-2.5 text-center bg-emerald-50 dark:bg-emerald-950/30 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold">60 min</strong>
                      <span className="block text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">100 pts</span>
                    </div>
                    <div className="border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-2.5 text-center bg-emerald-50 dark:bg-emerald-950/30 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold">90 min</strong>
                      <span className="block text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">100 pts</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
                    <Lightbulb size={18} weight="fill" className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Pro Tip:</strong> Even if you don't hit the full 60 minutes, reading for 20 minutes still earns you points! Every bit counts.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =====================================================
                 02 — BREAK (LESS = BETTER)
            ====================================================== */}
            {activeTab === 'break' && (
              <div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        02
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                          Less = Better
                        </h2>
                        <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
                          Keep it low to keep your score high!
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => toggleTooltip("Use this when you want to reduce a bad habit. If you stay under your target (like 15 mins of phone time), you get 100 points. If you do too much, your score drops.", e)}
                      className="w-8 h-8 rounded-full border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                      title="More information"
                    >
                      <Info size={18} weight="fill" />
                    </button>
                  </div>

                  {tooltipText && (
                    <div className="bg-slate-900 text-white text-xs p-3 rounded-xl mb-3 shadow-lg leading-relaxed animate-in fade-in">
                      {tooltipText}
                    </div>
                  )}

                  {/* SVG Chart */}
                  <div className="w-full relative mt-3">
                    <svg className="w-full h-auto block overflow-visible" viewBox="0 20 900 395" role="img">
                      <defs>
                        <linearGradient id="grad-break-page" x1="0" y1="70" x2="0" y2="340" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#12a66a"/>
                          <stop offset="66.66%" stopColor="#12a66a"/>
                          <stop offset="66.66%" stopColor="#e5484d"/>
                          <stop offset="100%" stopColor="#e5484d"/>
                        </linearGradient>
                      </defs>

                      <line x1="105" y1="70" x2="820" y2="70" className="stroke-slate-200 dark:stroke-slate-700/50" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="160" x2="820" y2="160" className="stroke-slate-200 dark:stroke-slate-700/50" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="250" x2="820" y2="250" className="stroke-slate-200 dark:stroke-slate-700/50" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="340" x2="820" y2="340" className="stroke-slate-200 dark:stroke-slate-700/50" strokeWidth="1" strokeDasharray="4 5" />

                      <line x1="105" y1="55" x2="105" y2="340" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="1.2" />
                      <line x1="105" y1="340" x2="820" y2="340" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="1.2" />

                      <text x="48" y="76" fill="#12a66a" fontSize="18" fontWeight="800">100</text>
                      <text x="72" y="166" className="fill-slate-500 dark:fill-slate-400" fontSize="14" fontWeight="600">75</text>
                      <text x="72" y="256" className="fill-slate-500 dark:fill-slate-400" fontSize="14" fontWeight="600">50</text>
                      <text x="58" y="346" fill="#e5484d" fontSize="18" fontWeight="800">0</text>

                      <rect x="105" y="70" width="415" height="270" fill="rgba(18,166,106,.12)" rx="8"/>
                      <rect x="760" y="70" width="60" height="270" fill="rgba(229,72,77,.12)" rx="8"/>

                      <path stroke="url(#grad-break-page)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" d="M105 70 L520 70 C 620 70, 700 160, 760 340 L820 340" />

                      <circle cx="520" cy="70" r="12" fill="#12a66a" className="stroke-white dark:stroke-[#1c1e26]" strokeWidth="4" />
                      <circle cx="760" cy="340" r="12" fill="#e5484d" className="stroke-white dark:stroke-[#1c1e26]" strokeWidth="4" />

                      <text x="520" y="40" textAnchor="middle" fill="#12a66a" fontSize="18" fontWeight="800">100</text>
                      <text x="760" y="385" textAnchor="middle" fill="#e5484d" fontSize="18" fontWeight="800">0</text>

                      <text x="310" y="120" textAnchor="middle" fill="#12a66a" fontSize="13" fontWeight="800">LESS = BETTER</text>

                      <line x1="520" y1="70" x2="520" y2="340" stroke="#12a66a" strokeWidth="2" strokeDasharray="7 7"/>
                      <text x="520" y="365" textAnchor="middle" fill="#12a66a" fontSize="13" fontWeight="800">15 MIN OR LESS = 100</text>

                      <line x1="760" y1="340" x2="760" y2="150" stroke="#e5484d" strokeWidth="2" strokeDasharray="7 7"/>
                      <text x="760" y="125" textAnchor="middle" fill="#e5484d" fontSize="13" fontWeight="800">30 MIN OR MORE = 0</text>

                      <text x="580" y="150" textAnchor="middle" fill="#12a66a" fontSize="18" fontWeight="800">75</text>
                      <text x="650" y="230" textAnchor="middle" fill="#12a66a" fontSize="18" fontWeight="800">50</text>
                      <text x="705" y="295" textAnchor="middle" className="fill-slate-900 dark:fill-slate-200" fontSize="18" fontWeight="800">25</text>

                      <text transform="translate(24 205) rotate(-90)" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="14" fontWeight="600">Your score</text>
                      <text x="480" y="335" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="14" fontWeight="600">How much you did →</text>
                    </svg>
                  </div>
                  <p className="text-center text-xs font-semibold text-slate-600 dark:text-slate-400 mt-3">
                    The less you do this, the better your score will be. Resist the urge!
                  </p>
                </div>

                <div className="border-t border-dashed border-slate-200 dark:border-slate-800" />

                {/* Score Strip */}
                <div className="grid grid-cols-3 gap-2 p-3.5 sm:p-4 bg-slate-50/70 dark:bg-[#181a20]/70">
                  <div className="flex flex-col text-emerald-700 dark:text-emerald-400">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">0–15 MIN</span>
                    <strong className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Kept it low (100)</strong>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">15–30 MIN</span>
                    <strong className="text-xs text-slate-900 dark:text-slate-100 font-bold mt-0.5">Score drops slowly</strong>
                  </div>
                  <div className="flex flex-col text-rose-700 dark:text-rose-400">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">30+ MIN</span>
                    <strong className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-0.5">Way too much (0)</strong>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-200 dark:border-slate-800" />

                {/* Example Section */}
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase">Real-life example</span>
                      <h3 className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        <DeviceMobile size={18} weight="fill" className="text-rose-500" /> Phone Screen Time
                      </h3>
                      <span className="text-xs text-slate-500">Goal: Under 15 mins (Hits 0 points at 30 mins)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-2.5 text-center bg-emerald-50 dark:bg-emerald-950/30 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold">0 min</strong>
                      <span className="block text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">100 pts</span>
                    </div>
                    <div className="border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-2.5 text-center bg-emerald-50 dark:bg-emerald-950/30 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold">10 min</strong>
                      <span className="block text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">100 pts</span>
                    </div>
                    <div className="border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-2.5 text-center bg-emerald-50 dark:bg-emerald-950/30 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold">15 min</strong>
                      <span className="block text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">100 pts</span>
                    </div>
                    <div className="border border-rose-200 dark:border-rose-800/60 rounded-xl p-2.5 text-center bg-rose-50 dark:bg-rose-950/30 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold">30 min+</strong>
                      <span className="block text-[11px] font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">0 pts</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
                    <Lightbulb size={18} weight="fill" className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Pro Tip:</strong> If you use your phone for 20 minutes, you won't lose all your points. The score gently goes down between 15 and 30 minutes!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =====================================================
                 03 — BALANCE (SWEET SPOT)
            ====================================================== */}
            {activeTab === 'balance' && (
              <div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        03
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                          Sweet Spot
                        </h2>
                        <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
                          Not too little, not too much — right in the middle.
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => toggleTooltip("Some things need balance! You get 100 points only if you stay inside your ideal range (like sleeping 7-8 hours). Too little or too much will lower your score.", e)}
                      className="w-8 h-8 rounded-full border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                      title="More information"
                    >
                      <Info size={18} weight="fill" />
                    </button>
                  </div>

                  {tooltipText && (
                    <div className="bg-slate-900 text-white text-xs p-3 rounded-xl mb-3 shadow-lg leading-relaxed animate-in fade-in">
                      {tooltipText}
                    </div>
                  )}

                  {/* SVG Chart */}
                  <div className="w-full relative mt-3">
                    <svg className="w-full h-auto block overflow-visible" viewBox="0 20 900 360" role="img">
                      <defs>
                        <linearGradient id="grad-balance-page" x1="0" y1="70" x2="0" y2="325" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#12a66a"/>
                          <stop offset="66.66%" stopColor="#12a66a"/>
                          <stop offset="66.66%" stopColor="#e5484d"/>
                          <stop offset="100%" stopColor="#e5484d"/>
                        </linearGradient>
                      </defs>

                      <line x1="105" y1="70" x2="820" y2="70" className="stroke-slate-200 dark:stroke-slate-700/50" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="155" x2="820" y2="155" className="stroke-slate-200 dark:stroke-slate-700/50" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="240" x2="820" y2="240" className="stroke-slate-200 dark:stroke-slate-700/50" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="325" x2="820" y2="325" className="stroke-slate-200 dark:stroke-slate-700/50" strokeWidth="1" strokeDasharray="4 5" />

                      <line x1="105" y1="55" x2="105" y2="340" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="1.2" />
                      <line x1="105" y1="340" x2="820" y2="340" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="1.2" />

                      <text x="50" y="76" fill="#12a66a" fontSize="18" fontWeight="800">100</text>
                      <text x="72" y="161" className="fill-slate-500 dark:fill-slate-400" fontSize="14" fontWeight="600">75</text>
                      <text x="72" y="246" className="fill-slate-500 dark:fill-slate-400" fontSize="14" fontWeight="600">50</text>
                      <text x="58" y="331" fill="#e5484d" fontSize="18" fontWeight="800">0</text>

                      {/* Area */}
                      <path d="M105 325 C170 305, 220 265, 280 210 C325 170, 350 115, 390 70 L600 70 C640 115, 665 170, 710 210 C770 265, 800 305, 820 325 L820 340 L105 340 Z" fill="rgba(18,166,106,.09)" />
                      {/* Curve */}
                      <path stroke="url(#grad-balance-page)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" d="M105 325 C170 305, 220 265, 280 210 C325 170, 350 115, 390 70 L600 70 C640 115, 665 170, 710 210 C770 265, 800 305, 820 325" />

                      <circle cx="390" cy="70" r="12" fill="#12a66a" className="stroke-white dark:stroke-[#1c1e26]" strokeWidth="4" />
                      <circle cx="600" cy="70" r="12" fill="#12a66a" className="stroke-white dark:stroke-[#1c1e26]" strokeWidth="4" />

                      <text x="495" y="42" textAnchor="middle" fill="#12a66a" fontSize="18" fontWeight="800">100</text>
                      <text x="495" y="105" textAnchor="middle" fill="#12a66a" fontSize="13" fontWeight="800">PERFECT RANGE</text>
                      <text x="495" y="130" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="14" fontWeight="600">7–8 HOURS</text>

                      <line x1="390" y1="70" x2="390" y2="340" stroke="#12a66a" strokeWidth="2" strokeDasharray="7 7"/>
                      <line x1="600" y1="70" x2="600" y2="340" stroke="#12a66a" strokeWidth="2" strokeDasharray="7 7"/>

                      <text x="250" y="140" textAnchor="middle" fill="#e5484d" fontSize="13" fontWeight="800">NOT ENOUGH</text>
                      <text x="750" y="140" textAnchor="middle" fill="#e5484d" fontSize="13" fontWeight="800">WAY TOO MUCH</text> 

                      <text x="145" y="315" textAnchor="middle" className="fill-slate-900 dark:fill-slate-200" fontSize="18" fontWeight="800">0</text>
                      <text x="790" y="315" textAnchor="middle" className="fill-slate-900 dark:fill-slate-200" fontSize="18" fontWeight="800">0</text>

                      <text transform="translate(24 205) rotate(-90)" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="14" fontWeight="600">Your score</text>
                      <text x="490" y="370" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="14" fontWeight="600">How much you did →</text>
                    </svg>
                  </div>
                  <p className="text-center text-xs font-semibold text-slate-600 dark:text-slate-400 mt-3">
                    Find the perfect middle ground. Balance is key!
                  </p>
                </div>

                <div className="border-t border-dashed border-slate-200 dark:border-slate-800" />

                {/* Score Strip */}
                <div className="grid grid-cols-3 gap-2 p-3.5 sm:p-4 bg-slate-50/70 dark:bg-[#181a20]/70">
                  <div className="flex flex-col text-rose-700 dark:text-rose-400">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">TOO LITTLE</span>
                    <strong className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-0.5">Not enough (↓)</strong>
                  </div>
                  <div className="flex flex-col text-emerald-700 dark:text-emerald-400">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">OPTIMAL</span>
                    <strong className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Just right! (100)</strong>
                  </div>
                  <div className="flex flex-col text-rose-700 dark:text-rose-400">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">TOO MUCH</span>
                    <strong className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-0.5">Way too much (↓)</strong>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-200 dark:border-slate-800" />

                {/* Example Section */}
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase">Real-life example</span>
                      <h3 className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        <MoonStars size={18} weight="fill" className="text-purple-500" /> Sleep Duration
                      </h3>
                      <span className="text-xs text-slate-500">Goal: Sleep between 7 and 8 hours</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="border border-rose-200 dark:border-rose-800/60 rounded-xl p-2.5 text-center bg-rose-50 dark:bg-rose-950/30 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold">5 hrs</strong>
                      <span className="block text-[11px] font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">Low score</span>
                      <span className="block text-[9px] text-slate-400 font-medium">(Too little sleep)</span>
                    </div>
                    <div className="border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-2.5 text-center bg-emerald-50 dark:bg-emerald-950/30 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold">7 hrs</strong>
                      <span className="block text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">100 pts</span>
                    </div>
                    <div className="border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-2.5 text-center bg-emerald-50 dark:bg-emerald-950/30 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold">8 hrs</strong>
                      <span className="block text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">100 pts</span>
                    </div>
                    <div className="border border-rose-200 dark:border-rose-800/60 rounded-xl p-2.5 text-center bg-rose-50 dark:bg-rose-950/30 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold">10 hrs</strong>
                      <span className="block text-[11px] font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">Low score</span>
                      <span className="block text-[9px] text-slate-400 font-medium">(Too much sleep)</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
                    <Lightbulb size={18} weight="fill" className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Pro Tip:</strong> More isn't always better! Sleeping 12 hours might leave you groggy, just like sleeping 4 hours. Hit that sweet spot!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =====================================================
                 04 — SUSTAIN (ON TIME)
            ====================================================== */}
            {activeTab === 'sustain' && (
              <div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        04
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                          On Time
                        </h2>
                        <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
                          Do it right on time for a perfect 100.
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => toggleTooltip("Timing is everything! You get 100 points for hitting the exact time (like waking up at 8 AM). We give you a small grace period, but being too early or too late lowers your score.", e)}
                      className="w-8 h-8 rounded-full border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                      title="More information"
                    >
                      <Info size={18} weight="fill" />
                    </button>
                  </div>

                  {tooltipText && (
                    <div className="bg-slate-900 text-white text-xs p-3 rounded-xl mb-3 shadow-lg leading-relaxed animate-in fade-in">
                      {tooltipText}
                    </div>
                  )}

                  {/* SVG Chart */}
                  <div className="w-full relative mt-3">
                    <svg className="w-full h-auto block overflow-visible" viewBox="0 20 900 365" role="img">
                      <defs>
                        <linearGradient id="grad-sustain-page" x1="0" y1="70" x2="0" y2="280" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#12a66a"/>
                          <stop offset="66.66%" stopColor="#12a66a"/>
                          <stop offset="66.66%" stopColor="#e5484d"/>
                          <stop offset="100%" stopColor="#e5484d"/>
                        </linearGradient>
                      </defs>

                      <line x1="105" y1="70" x2="820" y2="70" className="stroke-slate-200 dark:stroke-slate-700/50" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="140" x2="820" y2="140" className="stroke-slate-200 dark:stroke-slate-700/50" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="210" x2="820" y2="210" className="stroke-slate-200 dark:stroke-slate-700/50" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="280" x2="820" y2="280" className="stroke-slate-200 dark:stroke-slate-700/50" strokeWidth="1" strokeDasharray="4 5" />

                      <line x1="105" y1="55" x2="105" y2="280" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="1.2" />
                      <line x1="105" y1="280" x2="820" y2="280" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="1.2" />

                      <text x="55" y="76" fill="#12a66a" fontSize="18" fontWeight="800">100</text>
                      <text x="72" y="146" className="fill-slate-500 dark:fill-slate-400" fontSize="14" fontWeight="600">75</text>
                      <text x="72" y="216" className="fill-slate-500 dark:fill-slate-400" fontSize="14" fontWeight="600">50</text>
                      <text x="72" y="286" className="fill-slate-500 dark:fill-slate-400" fontSize="14" fontWeight="600">0</text>

                      {/* Curve */}
                      <path stroke="url(#grad-sustain-page)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" d="M140 280 C 260 280, 380 70, 480 70 C 580 70, 700 280, 820 280" />

                      <circle cx="480" cy="70" r="12" fill="#12a66a" className="stroke-white dark:stroke-[#1c1e26]" strokeWidth="4" />

                      <text x="480" y="42" textAnchor="middle" fill="#12a66a" fontSize="18" fontWeight="800">100% Score</text>

                      <line x1="480" y1="70" x2="480" y2="280" stroke="#12a66a" strokeWidth="2" strokeDasharray="7 7" />

                      <text x="480" y="310" textAnchor="middle" className="fill-slate-900 dark:fill-slate-200" fontSize="13" fontWeight="800">EXACTLY 8:00 AM</text>

                      <text x="240" y="150" textAnchor="middle" fill="#e5484d" fontSize="13" fontWeight="800">TOO EARLY</text>
                      <text x="240" y="175" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="14" fontWeight="600">7:00 AM</text>

                      <text x="720" y="150" textAnchor="middle" fill="#e5484d" fontSize="13" fontWeight="800">TOO LATE</text>
                      <text x="720" y="175" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="14" fontWeight="600">9:00 AM</text>

                      <text transform="translate(24 175) rotate(-90)" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="14" fontWeight="600">Your score</text>
                      <text x="480" y="365" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="14" fontWeight="600">Time you did it →</text>
                    </svg>
                  </div>
                  <p className="text-center text-xs font-semibold text-slate-600 dark:text-slate-400 mt-3">
                    Punctuality pays off. Try to hit your exact target time!
                  </p>
                </div>

                <div className="border-t border-dashed border-slate-200 dark:border-slate-800" />

                {/* Score Strip */}
                <div className="grid grid-cols-3 gap-2 p-3.5 sm:p-4 bg-slate-50/70 dark:bg-[#181a20]/70">
                  <div className="flex flex-col text-emerald-700 dark:text-emerald-400">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">TARGET</span>
                    <strong className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Exactly on time (100)</strong>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">TOLERANCE</span>
                    <strong className="text-xs text-slate-900 dark:text-slate-100 font-bold mt-0.5">Half hour window</strong>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">EXAMPLE</span>
                    <strong className="text-xs text-slate-900 dark:text-slate-100 font-bold mt-0.5">Target is 8:00 AM</strong>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-200 dark:border-slate-800" />

                {/* Example Section */}
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase">Real-life example</span>
                      <h3 className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        <Alarm size={18} weight="fill" className="text-orange-500" /> Wake-Up Time
                      </h3>
                      <span className="text-xs text-slate-500">Goal: Wake up at 8:00 AM (with a 30-min window)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-2.5 text-center bg-emerald-50 dark:bg-emerald-950/30 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold">7:30 AM</strong>
                      <span className="block text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">100 pts</span>
                    </div>
                    <div className="border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-2.5 text-center bg-emerald-50 dark:bg-emerald-950/30 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold">8:00 AM</strong>
                      <span className="block text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">100 pts</span>
                    </div>
                    <div className="border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-2.5 text-center bg-emerald-50 dark:bg-emerald-950/30 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold">8:30 AM</strong>
                      <span className="block text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">100 pts</span>
                    </div>
                    <div className="border border-rose-200 dark:border-rose-800/60 rounded-xl p-2.5 text-center bg-rose-50 dark:bg-rose-950/30 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold">10:00 AM</strong>
                      <span className="block text-[11px] font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">Low score</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
                    <Lightbulb size={18} weight="fill" className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Pro Tip:</strong> Waking up at 5:00 AM isn't necessarily "better" if your body needs sleep until 8:00 AM! This rule helps you stick to a consistent schedule.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =====================================================
                 05 — TRACK (DONE OR NOT DONE)
            ====================================================== */}
            {activeTab === 'track' && (
              <div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        05
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                          Done or Not Done
                        </h2>
                        <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
                          Did you do it? Yes = 100, No = 0. Simple!
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => toggleTooltip("Did you finish the habit? Yes gives you 100 points, No gives you 0 points. Use this for simple daily tasks like taking vitamins or watering plants.", e)}
                      className="w-8 h-8 rounded-full border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                      title="More information"
                    >
                      <Info size={18} weight="fill" />
                    </button>
                  </div>

                  {tooltipText && (
                    <div className="bg-slate-900 text-white text-xs p-3 rounded-xl mb-3 shadow-lg leading-relaxed animate-in fade-in">
                      {tooltipText}
                    </div>
                  )}

                  {/* SVG Chart */}
                  <div className="w-full relative mt-3">
                    <svg className="w-full h-auto block overflow-visible" viewBox="0 0 900 280" role="img">
                      <rect x="200" y="50" width="220" height="180" rx="20" fill="rgba(18,166,106,.12)"/>
                      <rect x="480" y="50" width="220" height="180" rx="20" fill="rgba(229,72,77,.12)"/>

                      <text x="310" y="25" textAnchor="middle" fill="#12a66a" fontSize="18" fontWeight="800">100% Score</text>
                      <text x="590" y="25" textAnchor="middle" fill="#e5484d" fontSize="18" fontWeight="800">0% Score</text>

                      <circle cx="310" cy="140" r="45" fill="#12a66a"/>
                      <path d="M 292 140 L 304 152 L 328 126" className="stroke-white dark:stroke-[#1c1e26]" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

                      <circle cx="590" cy="140" r="45" fill="#e5484d"/>
                      <path d="M 572 122 L 608 158 M 608 122 L 572 158" className="stroke-white dark:stroke-[#1c1e26]" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-center text-xs font-semibold text-slate-600 dark:text-slate-400 mt-3 flex items-center justify-center gap-1.5">
                    <CheckCircle size={16} weight="fill" className="text-emerald-600 dark:text-emerald-400" /> Just check it off your list to get full points!
                  </p>
                </div>

                <div className="border-t border-dashed border-slate-200 dark:border-slate-800" />

                {/* Score Strip */}
                <div className="grid grid-cols-3 gap-2 p-3.5 sm:p-4 bg-slate-50/70 dark:bg-[#181a20]/70">
                  <div className="flex flex-col text-emerald-700 dark:text-emerald-400">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">YES</span>
                    <strong className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Yes, did it! (+100)</strong>
                  </div>
                  <div className="flex flex-col text-rose-700 dark:text-rose-400">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">NO</span>
                    <strong className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-0.5">Nope, missed it (0)</strong>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">LOGIC</span>
                    <strong className="text-xs text-slate-900 dark:text-slate-100 font-bold mt-0.5">Simple Checkbox</strong>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-200 dark:border-slate-800" />

                {/* Example Section */}
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase">Real-life example</span>
                      <h3 className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        <PottedPlant size={18} weight="fill" className="text-purple-500" /> Daily Vitamins
                      </h3>
                      <span className="text-xs text-slate-500">Goal: Take vitamins today</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-2.5 text-center bg-emerald-50 dark:bg-emerald-950/30 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold">Did it</strong>
                      <span className="block text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">100 pts</span>
                    </div>
                    <div className="border border-rose-200 dark:border-rose-800/60 rounded-xl p-2.5 text-center bg-rose-50 dark:bg-rose-950/30 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold">Missed it</strong>
                      <span className="block text-[11px] font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">0 pts</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
                    <Lightbulb size={18} weight="fill" className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Pro Tip:</strong> This is perfect for daily tasks like taking a vitamin, calling mom, or making the bed!
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Pinned Bottom Action Bar */}
        <div className="p-4 sm:p-5 bg-white dark:bg-[#151a26] border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <Sparkle size={15} weight="fill" className="text-blue-500" />
            <span>Mathematical scoring built into every habit.</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/select-habits')}
            className="w-full sm:w-auto py-3 px-7 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 active:scale-98 text-white rounded-full text-xs sm:text-sm font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>Got it, let's choose habits →</span>
          </button>
        </div>

      </div>

    </div>
  );
}
