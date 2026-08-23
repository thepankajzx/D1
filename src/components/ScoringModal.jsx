import React, { useState, useEffect } from 'react';
import { 
  TrendUp, 
  TrendDown, 
  Target, 
  Clock, 
  CheckCircle, 
  Info, 
  X, 
  BookOpen, 
  DeviceMobile, 
  MoonStars, 
  Alarm, 
  PottedPlant,
  Lightbulb
} from '@phosphor-icons/react';

export default function ScoringModal({ type, onClose }) {
  const [activeTab, setActiveTab] = useState('build');
  const [tooltipText, setTooltipText] = useState(null);

  useEffect(() => {
    if (!type) return;
    if (type === 'all' || type === true) {
      setActiveTab('build');
    } else if (type === 'higher' || type === 'duration' || type === 'numeric' || type === 'build') {
      setActiveTab('build');
    } else if (type === 'lower' || type === 'break') {
      setActiveTab('break');
    } else if (type === 'optimal' || type === 'optimal_range' || type === 'balance') {
      setActiveTab('balance');
    } else if (type === 'target_time' || type === 'time' || type === 'sustain') {
      setActiveTab('sustain');
    } else if (type === 'yes_no' || type === 'binary' || type === 'track') {
      setActiveTab('track');
    } else {
      setActiveTab('build');
    }
  }, [type]);

  if (!type) return null;

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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-[700px] max-h-[92vh] bg-[#f7f7fa] rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-slate-200/80 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Not just done. But how well?
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Choose how your habit is measured — from simple consistency to precision timing.
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
            title="Close"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Quick Nav (Tab System) */}
          <nav className="grid grid-cols-5 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden max-w-full">
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
                  className={`flex flex-col items-center justify-center py-2.5 sm:py-3 px-1 relative transition-all cursor-pointer border-r border-slate-100 last:border-r-0 ${
                    isActive ? 'font-black' : 'font-bold text-slate-600 hover:bg-slate-50'
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
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
            
            {/* =====================================================
                 01 — BUILD (MORE = BETTER)
            ====================================================== */}
            {activeTab === 'build' && (
              <div>
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        01
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                          More = Better
                        </h2>
                        <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">
                          The more you do, the higher you score!
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => toggleTooltip("The more you do, the higher your score. Your score keeps going up until you hit your target. After that, it stays at a perfect 100. Great for reading, walking, or drinking water.", e)}
                      className="w-8 h-8 rounded-full border border-blue-200 bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
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
                        <linearGradient id="grad-build" x1="0" y1="70" x2="0" y2="325" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#12a66a"/>
                          <stop offset="66.66%" stopColor="#12a66a"/>
                          <stop offset="66.66%" stopColor="#e5484d"/>
                          <stop offset="100%" stopColor="#e5484d"/>
                        </linearGradient>
                      </defs>

                      <line x1="105" y1="70" x2="820" y2="70" stroke="#e9ebef" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="155" x2="820" y2="155" stroke="#e9ebef" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="240" x2="820" y2="240" stroke="#e9ebef" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="315" x2="820" y2="315" stroke="#e9ebef" strokeWidth="1" strokeDasharray="4 5" />

                      <line x1="105" y1="55" x2="105" y2="325" stroke="#b8bec8" strokeWidth="1.2" />
                      <line x1="105" y1="325" x2="820" y2="325" stroke="#b8bec8" strokeWidth="1.2" />

                      <text x="55" y="76" fill="#12a66a" fontSize="18" fontWeight="900">100</text>
                      <text x="72" y="161" fill="#667085" fontSize="14" fontWeight="750">75</text>
                      <text x="72" y="246" fill="#667085" fontSize="14" fontWeight="750">50</text>
                      <text x="72" y="321" fill="#667085" fontSize="14" fontWeight="750">0</text>

                      <path d="M105 315 L220 270 L335 220 L450 165 L560 105 L640 70 L820 70 L820 325 L105 325 Z" fill="rgba(18,166,106,.09)" />
                      <path stroke="url(#grad-build)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" d="M105 315 C155 295, 190 282, 220 270 C265 250, 300 236, 335 220 C380 198, 420 181, 450 165 C500 138, 535 119, 560 105 C595 85, 620 70, 640 70 L820 70" />

                      <circle cx="640" cy="70" r="12" fill="#12a66a" stroke="#fff" strokeWidth="4" />

                      <text x="640" y="40" textAnchor="middle" fill="#12a66a" fontSize="18" fontWeight="900">100</text>
                      <text x="220" y="252" textAnchor="middle" fill="#111318" fontSize="18" fontWeight="900">25</text>
                      <text x="335" y="202" textAnchor="middle" fill="#111318" fontSize="18" fontWeight="900">40</text>
                      <text x="450" y="147" textAnchor="middle" fill="#111318" fontSize="18" fontWeight="900">60</text>
                      <text x="560" y="87" textAnchor="middle" fill="#111318" fontSize="18" fontWeight="900">80</text>

                      <line x1="640" y1="70" x2="640" y2="325" stroke="#12a66a" strokeWidth="2" strokeDasharray="6 7" />

                      <text x="640" y="355" textAnchor="middle" fill="#111318" fontSize="13" fontWeight="900">REACH HERE = 100!</text>
                      <text transform="translate(24 190) rotate(-90)" textAnchor="middle" fill="#667085" fontSize="14" fontWeight="750">Your score</text>
                      <text x="460" y="347" textAnchor="middle" fill="#667085" fontSize="14" fontWeight="750">How much you did →</text>
                    </svg>
                  </div>
                  <p className="text-center text-xs font-bold text-slate-600 mt-3">
                    Keep pushing! Once you hit your goal, you get a perfect score.
                  </p>
                </div>

                <div className="border-t border-dashed border-slate-200" />

                {/* Score Strip */}
                <div className="grid grid-cols-3 gap-2 p-3 sm:p-4 bg-slate-50/50">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">LOWER RESULT</span>
                    <strong className="text-xs text-slate-900 font-bold mt-0.5">Just a little (40)</strong>
                  </div>
                  <div className="flex flex-col text-emerald-700">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">TARGET</span>
                    <strong className="text-xs text-emerald-600 font-bold mt-0.5">Hit the target! (100)</strong>
                  </div>
                  <div className="flex flex-col text-emerald-700">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">ABOVE TARGET</span>
                    <strong className="text-xs text-emerald-600 font-bold mt-0.5">Went above (100)</strong>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-200" />

                {/* Example Section */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-500 tracking-wider uppercase">Real-life example</span>
                      <h3 className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                        <BookOpen size={18} weight="fill" className="text-blue-500" /> Daily Reading
                      </h3>
                      <span className="text-xs text-slate-500">Goal: Read for 60 minutes</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="border border-slate-200 rounded-xl p-2.5 text-center bg-white shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 font-bold">20 min</strong>
                      <span className="block text-[11px] font-bold text-slate-500 mt-0.5">40 pts</span>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-2.5 text-center bg-white shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 font-bold">40 min</strong>
                      <span className="block text-[11px] font-bold text-slate-500 mt-0.5">70 pts</span>
                    </div>
                    <div className="border border-emerald-200 rounded-xl p-2.5 text-center bg-emerald-50 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 font-bold">60 min</strong>
                      <span className="block text-[11px] font-bold text-emerald-600 mt-0.5">100 pts</span>
                    </div>
                    <div className="border border-emerald-200 rounded-xl p-2.5 text-center bg-emerald-50 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 font-bold">90 min</strong>
                      <span className="block text-[11px] font-bold text-emerald-600 mt-0.5">100 pts</span>
                    </div>
                  </div>

                  <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                    <Lightbulb size={16} weight="fill" className="text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Pro Tip:</strong> Even if you don't hit the full 60 minutes, reading for 20 minutes still earns you points! Every bit counts.
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
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        02
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                          Less = Better
                        </h2>
                        <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">
                          Keep it low to keep your score high!
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => toggleTooltip("Use this when you want to reduce a bad habit. If you stay under your target (like 15 mins of phone time), you get 100 points. If you do too much, your score drops.", e)}
                      className="w-8 h-8 rounded-full border border-red-200 bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
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
                        <linearGradient id="grad-break" x1="0" y1="70" x2="0" y2="340" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#12a66a"/>
                          <stop offset="66.66%" stopColor="#12a66a"/>
                          <stop offset="66.66%" stopColor="#e5484d"/>
                          <stop offset="100%" stopColor="#e5484d"/>
                        </linearGradient>
                      </defs>

                      <line x1="105" y1="70" x2="820" y2="70" stroke="#e9ebef" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="160" x2="820" y2="160" stroke="#e9ebef" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="250" x2="820" y2="250" stroke="#e9ebef" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="340" x2="820" y2="340" stroke="#e9ebef" strokeWidth="1" strokeDasharray="4 5" />

                      <line x1="105" y1="55" x2="105" y2="340" stroke="#b8bec8" strokeWidth="1.2" />
                      <line x1="105" y1="340" x2="820" y2="340" stroke="#b8bec8" strokeWidth="1.2" />

                      <text x="48" y="76" fill="#12a66a" fontSize="18" fontWeight="900">100</text>
                      <text x="72" y="166" fill="#667085" fontSize="14" fontWeight="750">75</text>
                      <text x="72" y="256" fill="#667085" fontSize="14" fontWeight="750">50</text>
                      <text x="58" y="346" fill="#e5484d" fontSize="18" fontWeight="900">0</text>

                      <rect x="105" y="70" width="415" height="270" fill="#e9f8f1" opacity=".9"/>
                      <rect x="760" y="70" width="60" height="270" fill="#fff0f1" opacity=".75"/>

                      <path stroke="url(#grad-break)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" d="M105 70 L520 70 C 620 70, 700 160, 760 340 L820 340" />

                      <circle cx="520" cy="70" r="12" fill="#12a66a" stroke="#fff" strokeWidth="4" />
                      <circle cx="760" cy="340" r="12" fill="#e5484d" stroke="#fff" strokeWidth="4" />

                      <text x="520" y="40" textAnchor="middle" fill="#12a66a" fontSize="18" fontWeight="900">100</text>
                      <text x="760" y="385" textAnchor="middle" fill="#e5484d" fontSize="18" fontWeight="900">0</text>

                      <text x="310" y="120" textAnchor="middle" fill="#12a66a" fontSize="13" fontWeight="900">LESS = BETTER</text>

                      <line x1="520" y1="70" x2="520" y2="340" stroke="#12a66a" strokeWidth="2" strokeDasharray="7 7"/>
                      <text x="520" y="365" textAnchor="middle" fill="#12a66a" fontSize="13" fontWeight="900">15 MIN OR LESS = 100</text>

                      <line x1="760" y1="340" x2="760" y2="150" stroke="#e5484d" strokeWidth="2" strokeDasharray="7 7"/>
                      <text x="760" y="125" textAnchor="middle" fill="#e5484d" fontSize="13" fontWeight="900">30 MIN OR MORE = 0</text>

                      <text x="580" y="150" textAnchor="middle" fill="#12a66a" fontSize="18" fontWeight="900">75</text>
                      <text x="650" y="230" textAnchor="middle" fill="#12a66a" fontSize="18" fontWeight="900">50</text>
                      <text x="705" y="295" textAnchor="middle" fill="#111318" fontSize="18" fontWeight="900">25</text>

                      <text transform="translate(24 205) rotate(-90)" textAnchor="middle" fill="#667085" fontSize="14" fontWeight="750">Your score</text>
                      <text x="480" y="335" textAnchor="middle" fill="#667085" fontSize="14" fontWeight="750">How much you did →</text>
                    </svg>
                  </div>
                  <p className="text-center text-xs font-bold text-slate-600 mt-3">
                    The less you do this, the better your score will be. Resist the urge!
                  </p>
                </div>

                <div className="border-t border-dashed border-slate-200" />

                {/* Score Strip */}
                <div className="grid grid-cols-3 gap-2 p-3 sm:p-4 bg-slate-50/50">
                  <div className="flex flex-col text-emerald-700">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">0–15 MIN</span>
                    <strong className="text-xs text-emerald-600 font-bold mt-0.5">Kept it low (100)</strong>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">15–30 MIN</span>
                    <strong className="text-xs text-slate-900 font-bold mt-0.5">Score drops slowly</strong>
                  </div>
                  <div className="flex flex-col text-rose-700">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">30+ MIN</span>
                    <strong className="text-xs text-rose-600 font-bold mt-0.5">Way too much (0)</strong>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-200" />

                {/* Example Section */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-500 tracking-wider uppercase">Real-life example</span>
                      <h3 className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                        <DeviceMobile size={18} weight="fill" className="text-rose-500" /> Phone Screen Time
                      </h3>
                      <span className="text-xs text-slate-500">Goal: Under 15 mins (Hits 0 points at 30 mins)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="border border-emerald-200 rounded-xl p-2.5 text-center bg-emerald-50 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 font-bold">0 min</strong>
                      <span className="block text-[11px] font-bold text-emerald-600 mt-0.5">100 pts</span>
                    </div>
                    <div className="border border-emerald-200 rounded-xl p-2.5 text-center bg-emerald-50 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 font-bold">10 min</strong>
                      <span className="block text-[11px] font-bold text-emerald-600 mt-0.5">100 pts</span>
                    </div>
                    <div className="border border-emerald-200 rounded-xl p-2.5 text-center bg-emerald-50 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 font-bold">15 min</strong>
                      <span className="block text-[11px] font-bold text-emerald-600 mt-0.5">100 pts</span>
                    </div>
                    <div className="border border-rose-200 rounded-xl p-2.5 text-center bg-rose-50 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 font-bold">30 min+</strong>
                      <span className="block text-[11px] font-bold text-rose-600 mt-0.5">0 pts</span>
                    </div>
                  </div>

                  <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                    <Lightbulb size={16} weight="fill" className="text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Pro Tip:</strong> If you use your phone for 20 minutes, you won't lose all your points. The score gently goes down between 15 and 30 minutes!
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
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        03
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                          Sweet Spot
                        </h2>
                        <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">
                          Not too little, not too much — right in the middle.
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => toggleTooltip("Some things need balance! You get 100 points only if you stay inside your ideal range (like sleeping 7-8 hours). Too little or too much will lower your score.", e)}
                      className="w-8 h-8 rounded-full border border-purple-200 bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
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
                        <linearGradient id="grad-balance" x1="0" y1="70" x2="0" y2="325" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#12a66a"/>
                          <stop offset="66.66%" stopColor="#12a66a"/>
                          <stop offset="66.66%" stopColor="#e5484d"/>
                          <stop offset="100%" stopColor="#e5484d"/>
                        </linearGradient>
                      </defs>

                      <line x1="105" y1="70" x2="820" y2="70" stroke="#e9ebef" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="155" x2="820" y2="155" stroke="#e9ebef" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="240" x2="820" y2="240" stroke="#e9ebef" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="325" x2="820" y2="325" stroke="#e9ebef" strokeWidth="1" strokeDasharray="4 5" />

                      <line x1="105" y1="55" x2="105" y2="340" stroke="#b8bec8" strokeWidth="1.2" />
                      <line x1="105" y1="340" x2="820" y2="340" stroke="#b8bec8" strokeWidth="1.2" />

                      <text x="50" y="76" fill="#12a66a" fontSize="18" fontWeight="900">100</text>
                      <text x="72" y="161" fill="#667085" fontSize="14" fontWeight="750">75</text>
                      <text x="72" y="246" fill="#667085" fontSize="14" fontWeight="750">50</text>
                      <text x="58" y="331" fill="#e5484d" fontSize="18" fontWeight="900">0</text>

                      <path d="M105 325 C170 305, 220 265, 280 210 C325 170, 350 115, 390 70 L600 70 C640 115, 665 170, 710 210 C770 265, 800 305, 820 325 L820 340 L105 340 Z" fill="rgba(18,166,106,.09)" />
                      <path stroke="url(#grad-balance)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" d="M105 325 C170 305, 220 265, 280 210 C325 170, 350 115, 390 70 L600 70 C640 115, 665 170, 710 210 C770 265, 800 305, 820 325" />

                      <circle cx="390" cy="70" r="12" fill="#12a66a" stroke="#fff" strokeWidth="4" />
                      <circle cx="600" cy="70" r="12" fill="#12a66a" stroke="#fff" strokeWidth="4" />

                      <text x="495" y="42" textAnchor="middle" fill="#12a66a" fontSize="18" fontWeight="900">100</text>
                      <text x="495" y="105" textAnchor="middle" fill="#12a66a" fontSize="13" fontWeight="900">PERFECT RANGE</text>
                      <text x="495" y="130" textAnchor="middle" fill="#667085" fontSize="14" fontWeight="750">7–8 HOURS</text>

                      <line x1="390" y1="70" x2="390" y2="340" stroke="#12a66a" strokeWidth="2" strokeDasharray="7 7"/>
                      <line x1="600" y1="70" x2="600" y2="340" stroke="#12a66a" strokeWidth="2" strokeDasharray="7 7"/>

                      <text x="250" y="140" textAnchor="middle" fill="#e5484d" fontSize="13" fontWeight="900">NOT ENOUGH</text>
                      <text x="750" y="140" textAnchor="middle" fill="#e5484d" fontSize="13" fontWeight="900">WAY TOO MUCH</text> 

                      <text x="145" y="315" textAnchor="middle" fill="#111318" fontSize="18" fontWeight="900">0</text>
                      <text x="790" y="315" textAnchor="middle" fill="#111318" fontSize="18" fontWeight="900">0</text>

                      <text transform="translate(24 205) rotate(-90)" textAnchor="middle" fill="#667085" fontSize="14" fontWeight="750">Your score</text>
                      <text x="490" y="370" textAnchor="middle" fill="#667085" fontSize="14" fontWeight="750">How much you did →</text>
                    </svg>
                  </div>
                  <p className="text-center text-xs font-bold text-slate-600 mt-3">
                    Find the perfect middle ground. Balance is key!
                  </p>
                </div>

                <div className="border-t border-dashed border-slate-200" />

                {/* Score Strip */}
                <div className="grid grid-cols-3 gap-2 p-3 sm:p-4 bg-slate-50/50">
                  <div className="flex flex-col text-rose-700">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">TOO LITTLE</span>
                    <strong className="text-xs text-rose-600 font-bold mt-0.5">Not enough (↓)</strong>
                  </div>
                  <div className="flex flex-col text-emerald-700">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">OPTIMAL</span>
                    <strong className="text-xs text-emerald-600 font-bold mt-0.5">Just right! (100)</strong>
                  </div>
                  <div className="flex flex-col text-rose-700">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">TOO MUCH</span>
                    <strong className="text-xs text-rose-600 font-bold mt-0.5">Way too much (↓)</strong>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-200" />

                {/* Example Section */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-500 tracking-wider uppercase">Real-life example</span>
                      <h3 className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                        <MoonStars size={18} weight="fill" className="text-purple-500" /> Sleep Duration
                      </h3>
                      <span className="text-xs text-slate-500">Goal: Sleep between 7 and 8 hours</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="border border-rose-200 rounded-xl p-2.5 text-center bg-rose-50 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 font-bold">5 hrs</strong>
                      <span className="block text-[11px] font-bold text-rose-600 mt-0.5">Low score</span>
                      <span className="block text-[9px] text-slate-400 font-medium">(Too little sleep)</span>
                    </div>
                    <div className="border border-emerald-200 rounded-xl p-2.5 text-center bg-emerald-50 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 font-bold">7 hrs</strong>
                      <span className="block text-[11px] font-bold text-emerald-600 mt-0.5">100 pts</span>
                    </div>
                    <div className="border border-emerald-200 rounded-xl p-2.5 text-center bg-emerald-50 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 font-bold">8 hrs</strong>
                      <span className="block text-[11px] font-bold text-emerald-600 mt-0.5">100 pts</span>
                    </div>
                    <div className="border border-rose-200 rounded-xl p-2.5 text-center bg-rose-50 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 font-bold">10 hrs</strong>
                      <span className="block text-[11px] font-bold text-rose-600 mt-0.5">Low score</span>
                      <span className="block text-[9px] text-slate-400 font-medium">(Too much sleep)</span>
                    </div>
                  </div>

                  <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                    <Lightbulb size={16} weight="fill" className="text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Pro Tip:</strong> More isn't always better! Sleeping 12 hours might leave you groggy, just like sleeping 4 hours. Hit that sweet spot!
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
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        04
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                          On Time
                        </h2>
                        <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">
                          Do it right on time for a perfect 100.
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => toggleTooltip("Timing is everything! You get 100 points for hitting the exact time (like waking up at 8 AM). We give you a small grace period, but being too early or too late lowers your score.", e)}
                      className="w-8 h-8 rounded-full border border-orange-200 bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
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
                        <linearGradient id="grad-sustain" x1="0" y1="70" x2="0" y2="280" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#12a66a"/>
                          <stop offset="66.66%" stopColor="#12a66a"/>
                          <stop offset="66.66%" stopColor="#e5484d"/>
                          <stop offset="100%" stopColor="#e5484d"/>
                        </linearGradient>
                      </defs>

                      <line x1="105" y1="70" x2="820" y2="70" stroke="#e9ebef" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="140" x2="820" y2="140" stroke="#e9ebef" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="210" x2="820" y2="210" stroke="#e9ebef" strokeWidth="1" strokeDasharray="4 5" />
                      <line x1="105" y1="280" x2="820" y2="280" stroke="#e9ebef" strokeWidth="1" strokeDasharray="4 5" />

                      <line x1="105" y1="55" x2="105" y2="280" stroke="#b8bec8" strokeWidth="1.2" />
                      <line x1="105" y1="280" x2="820" y2="280" stroke="#b8bec8" strokeWidth="1.2" />

                      <text x="55" y="76" fill="#12a66a" fontSize="18" fontWeight="900">100</text>
                      <text x="72" y="146" fill="#667085" fontSize="14" fontWeight="750">75</text>
                      <text x="72" y="216" fill="#667085" fontSize="14" fontWeight="750">50</text>
                      <text x="72" y="286" fill="#667085" fontSize="14" fontWeight="750">0</text>

                      <path stroke="url(#grad-sustain)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" d="M140 280 C 260 280, 380 70, 480 70 C 580 70, 700 280, 820 280" />

                      <circle cx="480" cy="70" r="12" fill="#12a66a" stroke="#fff" strokeWidth="4" />

                      <text x="480" y="42" textAnchor="middle" fill="#12a66a" fontSize="18" fontWeight="900">100% Score</text>

                      <line x1="480" y1="70" x2="480" y2="280" stroke="#12a66a" strokeWidth="2" strokeDasharray="7 7" />

                      <text x="480" y="310" textAnchor="middle" fill="#111318" fontSize="13" fontWeight="900">EXACTLY 8:00 AM</text>

                      <text x="240" y="150" textAnchor="middle" fill="#e5484d" fontSize="13" fontWeight="900">TOO EARLY</text>
                      <text x="240" y="175" textAnchor="middle" fill="#667085" fontSize="14" fontWeight="750">7:00 AM</text>

                      <text x="720" y="150" textAnchor="middle" fill="#e5484d" fontSize="13" fontWeight="900">TOO LATE</text>
                      <text x="720" y="175" textAnchor="middle" fill="#667085" fontSize="14" fontWeight="750">9:00 AM</text>

                      <text transform="translate(24 175) rotate(-90)" textAnchor="middle" fill="#667085" fontSize="14" fontWeight="750">Your score</text>
                      <text x="480" y="365" textAnchor="middle" fill="#667085" fontSize="14" fontWeight="750">Time you did it →</text>
                    </svg>
                  </div>
                  <p className="text-center text-xs font-bold text-slate-600 mt-3">
                    Punctuality pays off. Try to hit your exact target time!
                  </p>
                </div>

                <div className="border-t border-dashed border-slate-200" />

                {/* Score Strip */}
                <div className="grid grid-cols-3 gap-2 p-3 sm:p-4 bg-slate-50/50">
                  <div className="flex flex-col text-emerald-700">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">TARGET</span>
                    <strong className="text-xs text-emerald-600 font-bold mt-0.5">Exactly on time (100)</strong>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">TOLERANCE</span>
                    <strong className="text-xs text-slate-900 font-bold mt-0.5">Half hour early/late fine</strong>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">EXAMPLE</span>
                    <strong className="text-xs text-slate-900 font-bold mt-0.5">Target is 8:00 AM</strong>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-200" />

                {/* Example Section */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-500 tracking-wider uppercase">Real-life example</span>
                      <h3 className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                        <Alarm size={18} weight="fill" className="text-orange-500" /> Wake-Up Time
                      </h3>
                      <span className="text-xs text-slate-500">Goal: Wake up at 8:00 AM (with a 30-min window)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="border border-emerald-200 rounded-xl p-2.5 text-center bg-emerald-50 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 font-bold">7:30 AM</strong>
                      <span className="block text-[11px] font-bold text-emerald-600 mt-0.5">100 pts</span>
                    </div>
                    <div className="border border-emerald-200 rounded-xl p-2.5 text-center bg-emerald-50 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 font-bold">8:00 AM</strong>
                      <span className="block text-[11px] font-bold text-emerald-600 mt-0.5">100 pts</span>
                    </div>
                    <div className="border border-emerald-200 rounded-xl p-2.5 text-center bg-emerald-50 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 font-bold">8:30 AM</strong>
                      <span className="block text-[11px] font-bold text-emerald-600 mt-0.5">100 pts</span>
                    </div>
                    <div className="border border-rose-200 rounded-xl p-2.5 text-center bg-rose-50 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 font-bold">10:00 AM</strong>
                      <span className="block text-[11px] font-bold text-rose-600 mt-0.5">Low score</span>
                      <span className="block text-[9px] text-slate-400 font-medium">(Too late = score drops)</span>
                    </div>
                  </div>

                  <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                    <Lightbulb size={16} weight="fill" className="text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Pro Tip:</strong> Waking up at 5:00 AM isn't necessarily "better" if your body needs sleep until 8:00 AM! This rule helps you stick to a consistent schedule.
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
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        05
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                          Done or Not Done
                        </h2>
                        <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">
                          Did you do it? Yes = 100, No = 0. Simple!
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => toggleTooltip("Did you finish the habit? Yes gives you 100 points, No gives you 0 points. Use this for simple daily tasks like taking vitamins or watering plants.", e)}
                      className="w-8 h-8 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
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
                      <rect x="200" y="50" width="220" height="180" rx="20" fill="#e9f8f1"/>
                      <rect x="480" y="50" width="220" height="180" rx="20" fill="#fff0f1"/>

                      <text x="310" y="25" textAnchor="middle" fill="#12a66a" fontSize="18" fontWeight="900">100% Score</text>
                      <text x="590" y="25" textAnchor="middle" fill="#e5484d" fontSize="18" fontWeight="900">0% Score</text>

                      <circle cx="310" cy="140" r="45" fill="#12a66a"/>
                      <path d="M 292 140 L 304 152 L 328 126" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

                      <circle cx="590" cy="140" r="45" fill="#e5484d"/>
                      <path d="M 572 122 L 608 158 M 608 122 L 572 158" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-center text-xs font-bold text-slate-600 mt-3 flex items-center justify-center gap-1.5">
                    <CheckCircle size={16} weight="fill" className="text-emerald-600" /> Just check it off your list to get full points!
                  </p>
                </div>

                <div className="border-t border-dashed border-slate-200" />

                {/* Score Strip */}
                <div className="grid grid-cols-3 gap-2 p-3 sm:p-4 bg-slate-50/50">
                  <div className="flex flex-col text-emerald-700">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">YES</span>
                    <strong className="text-xs text-emerald-600 font-bold mt-0.5">Yes, did it! (+100)</strong>
                  </div>
                  <div className="flex flex-col text-rose-700">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">NO</span>
                    <strong className="text-xs text-rose-600 font-bold mt-0.5">Nope, missed it (0)</strong>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">LOGIC</span>
                    <strong className="text-xs text-slate-900 font-bold mt-0.5">Simple Checkbox</strong>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-200" />

                {/* Example Section */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-500 tracking-wider uppercase">Real-life example</span>
                      <h3 className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                        <PottedPlant size={18} weight="fill" className="text-purple-500" /> Daily Vitamins
                      </h3>
                      <span className="text-xs text-slate-500">Goal: Take vitamins today</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="border border-emerald-200 rounded-xl p-2.5 text-center bg-emerald-50 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 font-bold">Did it</strong>
                      <span className="block text-[11px] font-bold text-emerald-600 mt-0.5">100 pts</span>
                    </div>
                    <div className="border border-rose-200 rounded-xl p-2.5 text-center bg-rose-50 shadow-2xs">
                      <strong className="block text-xs sm:text-sm text-slate-900 font-bold">Missed it</strong>
                      <span className="block text-[11px] font-bold text-rose-600 mt-0.5">0 pts</span>
                    </div>
                  </div>

                  <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                    <Lightbulb size={16} weight="fill" className="text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Pro Tip:</strong> This is perfect for daily tasks like taking a vitamin, calling mom, or making the bed!
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer Action */}
          <div className="pt-1 flex justify-center">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-all shadow-sm"
            >
              Got it, close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
