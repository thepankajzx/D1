import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';

export default function ScoringGuide() {
  const navigate = useNavigate();
  const [activeEngine, setActiveEngine] = useState('done');
  const [tooltip, setTooltip] = useState(null);

  const toggleTooltip = (text, e) => {
    e.stopPropagation();
    setTooltip(prev => prev === text ? null : text);
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-24 pt-2 font-sans">
      
      {/* ── Top Navigation Bar ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors rounded-xl bg-slate-100 dark:bg-[#1c1e26] hover:bg-slate-200 dark:hover:bg-[#2a2d37] px-3.5 py-2 text-xs sm:text-sm cursor-pointer border border-transparent dark:border-[#2a2d37]"
        >
          <Icon name="arrow_back" className="text-[17px]" />
          <span>Back</span>
        </button>

        <div className="hero-badge inline-flex items-center gap-1.5 px-3 py-1 border border-slate-200 dark:border-[#2a2d37] bg-white dark:bg-[#1c1e26] rounded-full text-xs font-bold text-slate-600 dark:text-slate-400 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#12a66a]" />
          YOUR SCORING SYSTEM
        </div>
      </div>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <div className="mb-6 text-left sm:text-center">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          Five Scoring <span className="text-[#12a66a] dark:text-[#4ade80]">Engines</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium mt-1.5 max-w-md sm:mx-auto">
          Not just done. But <strong>how well?</strong> Choose how you measure your progress.
        </p>
      </div>

      {/* ── Pill Navigation (Tactile Tabs) ────────────────────────────────── */}
      <nav className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar sm:justify-center">
        {[
          { id: 'done', label: 'Done', icon: 'ph-check-circle' },
          { id: 'more', label: 'More', icon: 'ph-trend-up' },
          { id: 'less', label: 'Less', icon: 'ph-trend-down' },
          { id: 'on-time', label: 'On Time', icon: 'ph-clock' },
          { id: 'sweet-spot', label: 'Sweet Spot', icon: 'ph-target' }
        ].map(pill => {
          const isActive = activeEngine === pill.id;
          return (
            <button
              key={pill.id}
              onClick={() => setActiveEngine(pill.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 dark:bg-[#4ade80] text-white dark:text-[#111318] border-slate-900 dark:border-[#4ade80] shadow-sm scale-102'
                  : 'bg-white dark:bg-[#1c1e26] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#2a2d37] hover:bg-slate-50 dark:hover:bg-[#252833]'
              }`}
            >
              <i className={`ph ${pill.icon} text-base`} />
              <span>{pill.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Active Scoring Engine Card ────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1c1e26] border border-slate-200 dark:border-[#2a2d37] rounded-3xl shadow-sm overflow-hidden animate-in fade-in zoom-in-98 duration-200">
        
        {/* 01 DONE OR NOT DONE */}
        {activeEngine === 'done' && (
          <div>
            <div className="p-5 sm:p-7">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-[#4ade80] text-white dark:text-[#111318] flex items-center justify-center text-xs font-black shrink-0">
                    01
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Done or Not Done</h2>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">Did you do it? Yes = 100, No = 0.</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">(Yes/No / Binary)</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => toggleTooltip('Did you finish the habit? Yes = 100 points, No = 0.', e)}
                  className="w-8 h-8 rounded-full border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-[#3f7cff] flex items-center justify-center cursor-pointer shrink-0"
                >
                  <i className="ph ph-info text-base" />
                </button>
              </div>

              {/* Chart Wrap */}
              <div className="w-full my-4">
                <svg className="chart-svg w-full h-auto" viewBox="0 0 900 220">
                  <rect x="200" y="10" width="220" height="180" rx="20" fill="#e9f8f1" />
                  <rect x="480" y="10" width="220" height="180" rx="20" fill="#fff0f1" />
                  <text className="score-number green" x="310" y="32" textAnchor="middle" fontSize="18" fontWeight="bold">100% Score</text>
                  <text className="score-number red" x="590" y="32" textAnchor="middle" fontSize="18" fontWeight="bold">0% Score</text>
                  <circle cx="310" cy="110" r="42" fill="#12a66a" />
                  <path d="M 292 110 L 304 122 L 328 96" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="590" cy="110" r="42" fill="#e5484d" />
                  <path d="M 572 92 L 608 128 M 608 92 L 572 128" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <p className="text-center text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 mt-3 flex items-center justify-center gap-1.5">
                <i className="ph-fill ph-check-circle text-[#12a66a]" />
                <span>Just check it off to get full points!</span>
              </p>
            </div>

            {/* Score Strip */}
            <div className="grid grid-cols-3 gap-2 px-5 py-3.5 bg-slate-50 dark:bg-[#181a20] border-y border-slate-200 dark:border-[#2a2d37]">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#12a66a]">YES</span>
                <strong className="text-xs text-[#12a66a] font-bold mt-0.5">Yes, did it! (+100)</strong>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#e5484d]">NO</span>
                <strong className="text-xs text-[#e5484d] font-bold mt-0.5">Nope, missed it (0)</strong>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">LOGIC</span>
                <strong className="text-xs text-slate-800 dark:text-slate-200 font-bold mt-0.5">Simple Checkbox</strong>
              </div>
            </div>

            {/* Example */}
            <div className="p-5 sm:p-7">
              <div className="mb-3">
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Real-life example</div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                  <i className="ph-fill ph-flower-lotus text-purple-500" />
                  <span>Morning Meditation</span>
                </h3>
                <div className="text-xs text-slate-500">Did you meditate today?</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl border border-[#c6efd9] dark:border-emerald-800/60 bg-[#f0fbf5] dark:bg-[#1a2a1f] text-center">
                  <strong className="text-xs text-slate-900 dark:text-slate-100">Did it</strong>
                  <span className="block text-[11px] font-extrabold text-[#12a66a] dark:text-[#4ade80] mt-0.5">100 pts</span>
                </div>
                <div className="p-2.5 rounded-xl border border-[#f4c7ca] dark:border-red-800/60 bg-[#fff0f1] dark:bg-[#2a1a1a] text-center">
                  <strong className="text-xs text-slate-900 dark:text-slate-100">Missed it</strong>
                  <span className="block text-[11px] font-extrabold text-[#e5484d] dark:text-[#f87171] mt-0.5">0 pts</span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-[#181a20] border border-slate-200 dark:border-[#2a2d37] flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <i className="ph-fill ph-lightbulb text-amber-500 text-base shrink-0 mt-0.5" />
                <div><strong>Pro Tip:</strong> Great for daily must-dos like taking vitamins or journaling.</div>
              </div>
            </div>
          </div>
        )}

        {/* 02 MORE = BETTER */}
        {activeEngine === 'more' && (
          <div>
            <div className="p-5 sm:p-7">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-[#4ade80] text-white dark:text-[#111318] flex items-center justify-center text-xs font-black shrink-0">
                    02
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">More = Better</h2>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">The more you do, the higher your score!</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">(Higher Is Better)</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => toggleTooltip('Your score rises as you do more, reaching 100 when you hit your target.', e)}
                  className="w-8 h-8 rounded-full border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-[#3f7cff] flex items-center justify-center cursor-pointer shrink-0"
                >
                  <i className="ph ph-info text-base" />
                </button>
              </div>

              {/* Chart Wrap */}
              <div className="w-full my-4">
                <svg className="chart-svg w-full h-auto" viewBox="0 20 900 340">
                  <line className="grid-line" x1="105" y1="70" x2="820" y2="70"/>
                  <line className="grid-line" x1="105" y1="155" x2="820" y2="155"/>
                  <line className="grid-line" x1="105" y1="240" x2="820" y2="240"/>
                  <line className="grid-line" x1="105" y1="315" x2="820" y2="315"/>
                  <line className="axis-line" x1="105" y1="55" x2="105" y2="325"/>
                  <line className="axis-line" x1="105" y1="325" x2="820" y2="325"/>
                  <text className="score-number green" x="55" y="76">100</text>
                  <text className="axis-label" x="72" y="161">75</text>
                  <text className="axis-label" x="72" y="246">50</text>
                  <text className="axis-label" x="72" y="321">0</text>
                  <path className="area-green" d="M105 315 L220 270 L335 220 L450 165 L560 105 L640 70 L820 70 L820 325 L105 325 Z"/>
                  <path className="curve green" d="M105 315 C155 295, 190 282, 220 270 C265 250, 300 236, 335 220 C380 198, 420 181, 450 165 C500 138, 535 119, 560 105 C595 85, 620 70, 640 70 L820 70"/>
                  <circle className="marker-green" cx="640" cy="70" r="12"/>
                  <text className="score-number green" x="640" y="40" textAnchor="middle">100</text>
                  <line x1="640" y1="70" x2="640" y2="325" stroke="#12a66a" strokeWidth="2" strokeDasharray="6 7"/>
                  <text className="chart-label green strong" x="640" y="355" textAnchor="middle">REACH HERE = 100!</text>
                  <text className="axis-label" transform="translate(24 190) rotate(-90)">Your score</text>
                  <text className="axis-label" x="460" y="347">How much you did →</text>
                </svg>
              </div>

              <p className="text-center text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 mt-3">
                Keep pushing! Once you reach your goal, you stay perfect.
              </p>
            </div>

            {/* Score Strip */}
            <div className="grid grid-cols-3 gap-2 px-5 py-3.5 bg-slate-50 dark:bg-[#181a20] border-y border-slate-200 dark:border-[#2a2d37]">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">LOWER</span>
                <strong className="text-xs text-slate-800 dark:text-slate-200 font-bold mt-0.5">Just a little (40)</strong>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#12a66a]">TARGET</span>
                <strong className="text-xs text-[#12a66a] font-bold mt-0.5">Hit bullseye (100)</strong>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#12a66a]">ABOVE</span>
                <strong className="text-xs text-[#12a66a] font-bold mt-0.5">Still 100</strong>
              </div>
            </div>

            {/* Example */}
            <div className="p-5 sm:p-7">
              <div className="mb-3">
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Real-life example</div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                  <i className="ph-fill ph-book-open text-blue-500" />
                  <span>Daily Reading</span>
                </h3>
                <div className="text-xs text-slate-500">Goal: 60 minutes</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-[#2a2d37] bg-white dark:bg-[#1c1e26] text-center">
                  <strong className="text-xs text-slate-900 dark:text-slate-100">20 min</strong>
                  <span className="block text-[11px] font-bold text-slate-500 mt-0.5">40 pts</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-[#2a2d37] bg-white dark:bg-[#1c1e26] text-center">
                  <strong className="text-xs text-slate-900 dark:text-slate-100">40 min</strong>
                  <span className="block text-[11px] font-bold text-slate-500 mt-0.5">70 pts</span>
                </div>
                <div className="p-2.5 rounded-xl border border-[#c6efd9] dark:border-emerald-800/60 bg-[#f0fbf5] dark:bg-[#1a2a1f] text-center">
                  <strong className="text-xs text-slate-900 dark:text-slate-100">60 min</strong>
                  <span className="block text-[11px] font-extrabold text-[#12a66a] dark:text-[#4ade80] mt-0.5">100 pts</span>
                </div>
                <div className="p-2.5 rounded-xl border border-[#c6efd9] dark:border-emerald-800/60 bg-[#f0fbf5] dark:bg-[#1a2a1f] text-center">
                  <strong className="text-xs text-slate-900 dark:text-slate-100">90 min</strong>
                  <span className="block text-[11px] font-extrabold text-[#12a66a] dark:text-[#4ade80] mt-0.5">100 pts</span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-[#181a20] border border-slate-200 dark:border-[#2a2d37] flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <i className="ph-fill ph-lightbulb text-amber-500 text-base shrink-0 mt-0.5" />
                <div><strong>Pro Tip:</strong> Even 20 mins earns points. Every bit counts.</div>
              </div>
            </div>
          </div>
        )}

        {/* 03 LESS = BETTER */}
        {activeEngine === 'less' && (
          <div>
            <div className="p-5 sm:p-7">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-[#4ade80] text-white dark:text-[#111318] flex items-center justify-center text-xs font-black shrink-0">
                    03
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Less = Better</h2>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">Keep it low to keep your score high.</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">(Lower Is Better)</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => toggleTooltip('Stay under your target for 100 points.', e)}
                  className="w-8 h-8 rounded-full border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-[#3f7cff] flex items-center justify-center cursor-pointer shrink-0"
                >
                  <i className="ph ph-info text-base" />
                </button>
              </div>

              {/* Chart Wrap */}
              <div className="w-full my-4">
                <svg className="chart-svg w-full h-auto" viewBox="0 20 900 370">
                  <line className="grid-line" x1="105" y1="70" x2="820" y2="70"/>
                  <line className="grid-line" x1="105" y1="160" x2="820" y2="160"/>
                  <line className="grid-line" x1="105" y1="250" x2="820" y2="250"/>
                  <line className="grid-line" x1="105" y1="340" x2="820" y2="340"/>
                  <line className="axis-line" x1="105" y1="55" x2="105" y2="340"/>
                  <line className="axis-line" x1="105" y1="340" x2="820" y2="340"/>
                  <text className="score-number green" x="48" y="76">100</text>
                  <text className="axis-label" x="72" y="166">75</text>
                  <text className="axis-label" x="72" y="256">50</text>
                  <text className="score-number red" x="58" y="346">0</text>
                  <rect x="105" y="70" width="415" height="270" fill="#e9f8f1" opacity=".9"/>
                  <rect x="760" y="70" width="60" height="270" fill="#fff0f1" opacity=".75"/>
                  <path className="curve purple" d="M105 70 L520 70 C 620 70, 700 160, 760 340 L820 340"/>
                  <circle className="marker-green" cx="520" cy="70" r="12"/>
                  <circle className="marker-red" cx="760" cy="340" r="12"/>
                  <text className="score-number green" x="520" y="40" textAnchor="middle">100</text>
                  <text className="score-number red" x="760" y="370" textAnchor="middle">0</text>
                  <text className="chart-label green strong" x="310" y="120" textAnchor="middle">LESS = BETTER</text>
                  <line x1="520" y1="70" x2="520" y2="340" stroke="#12a66a" strokeWidth="2" strokeDasharray="7 7"/>
                  <text className="chart-label green strong" x="520" y="355" textAnchor="middle">15 MIN OR LESS = 100</text>
                  <line x1="760" y1="340" x2="760" y2="150" stroke="#e5484d" strokeWidth="2" strokeDasharray="7 7"/>
                  <text className="chart-label red strong" x="760" y="130" textAnchor="middle">30+ MIN = 0</text>
                  <text className="axis-label" transform="translate(24 205) rotate(-90)">Your score</text>
                  <text className="axis-label" x="480" y="330">How much you did →</text>
                </svg>
              </div>

              <p className="text-center text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 mt-3">
                Resist the urge. The less you do, the better your score.
              </p>
            </div>

            {/* Score Strip */}
            <div className="grid grid-cols-3 gap-2 px-5 py-3.5 bg-slate-50 dark:bg-[#181a20] border-y border-slate-200 dark:border-[#2a2d37]">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#12a66a]">0–15 MIN</span>
                <strong className="text-xs text-[#12a66a] font-bold mt-0.5">Kept it low (100)</strong>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">15–30 MIN</span>
                <strong className="text-xs text-slate-800 dark:text-slate-200 font-bold mt-0.5">Drops slowly</strong>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#e5484d]">30+ MIN</span>
                <strong className="text-xs text-[#e5484d] font-bold mt-0.5">Too much (0)</strong>
              </div>
            </div>

            {/* Example */}
            <div className="p-5 sm:p-7">
              <div className="mb-3">
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Real-life example</div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                  <i className="ph-fill ph-device-mobile text-red-500" />
                  <span>Phone Screen Time</span>
                </h3>
                <div className="text-xs text-slate-500">Goal: 15 min or less</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl border border-[#c6efd9] dark:border-emerald-800/60 bg-[#f0fbf5] dark:bg-[#1a2a1f] text-center">
                  <strong className="text-xs text-slate-900 dark:text-slate-100">0 min</strong>
                  <span className="block text-[11px] font-extrabold text-[#12a66a] dark:text-[#4ade80] mt-0.5">100 pts</span>
                </div>
                <div className="p-2.5 rounded-xl border border-[#c6efd9] dark:border-emerald-800/60 bg-[#f0fbf5] dark:bg-[#1a2a1f] text-center">
                  <strong className="text-xs text-slate-900 dark:text-slate-100">10 min</strong>
                  <span className="block text-[11px] font-extrabold text-[#12a66a] dark:text-[#4ade80] mt-0.5">100 pts</span>
                </div>
                <div className="p-2.5 rounded-xl border border-[#c6efd9] dark:border-emerald-800/60 bg-[#f0fbf5] dark:bg-[#1a2a1f] text-center">
                  <strong className="text-xs text-slate-900 dark:text-slate-100">15 min</strong>
                  <span className="block text-[11px] font-extrabold text-[#12a66a] dark:text-[#4ade80] mt-0.5">100 pts</span>
                </div>
                <div className="p-2.5 rounded-xl border border-[#f4c7ca] dark:border-red-800/60 bg-[#fff0f1] dark:bg-[#2a1a1a] text-center">
                  <strong className="text-xs text-slate-900 dark:text-slate-100">30 min+</strong>
                  <span className="block text-[11px] font-extrabold text-[#e5484d] dark:text-[#f87171] mt-0.5">0 pts</span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-[#181a20] border border-slate-200 dark:border-[#2a2d37] flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <i className="ph-fill ph-lightbulb text-amber-500 text-base shrink-0 mt-0.5" />
                <div><strong>Pro Tip:</strong> Every minute less is a win.</div>
              </div>
            </div>
          </div>
        )}

        {/* 04 ON TIME */}
        {activeEngine === 'on-time' && (
          <div>
            <div className="p-5 sm:p-7">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-[#4ade80] text-white dark:text-[#111318] flex items-center justify-center text-xs font-black shrink-0">
                    04
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">On Time</h2>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">Hit it right on time for a perfect 100.</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">(Target Time)</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => toggleTooltip('Precision matters. 100 points exactly at the target time.', e)}
                  className="w-8 h-8 rounded-full border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-[#3f7cff] flex items-center justify-center cursor-pointer shrink-0"
                >
                  <i className="ph ph-info text-base" />
                </button>
              </div>

              {/* Chart Wrap */}
              <div className="w-full my-4">
                <svg className="chart-svg w-full h-auto" viewBox="0 20 900 340">
                  <line className="grid-line" x1="105" y1="70" x2="820" y2="70"/>
                  <line className="grid-line" x1="105" y1="140" x2="820" y2="140"/>
                  <line className="grid-line" x1="105" y1="210" x2="820" y2="210"/>
                  <line className="grid-line" x1="105" y1="280" x2="820" y2="280"/>
                  <line className="axis-line" x1="105" y1="55" x2="105" y2="280"/>
                  <line className="axis-line" x1="105" y1="280" x2="820" y2="280"/>
                  <text className="score-number green" x="55" y="76">100</text>
                  <text className="axis-label" x="72" y="146">75</text>
                  <text className="axis-label" x="72" y="216">50</text>
                  <text className="axis-label" x="72" y="286">0</text>
                  <path className="curve blue" d="M140 280 C 260 280, 380 70, 480 70 C 580 70, 700 280, 820 280"/>
                  <circle className="marker-blue" cx="480" cy="70" r="12"/>
                  <text className="score-number green" x="480" y="42" textAnchor="middle">100% Score</text>
                  <line x1="480" y1="70" x2="480" y2="280" stroke="#3f7cff" strokeWidth="2" strokeDasharray="7 7"/>
                  <text className="chart-label strong" x="480" y="310" textAnchor="middle">EXACTLY 8:00 AM</text>
                  <text className="chart-label" x="240" y="150" textAnchor="middle">TOO EARLY</text>
                  <text className="chart-label" x="720" y="150" textAnchor="middle">TOO LATE</text>
                  <text className="axis-label" transform="translate(24 175) rotate(-90)">Your score</text>
                  <text className="axis-label" x="480" y="340">Time you did it →</text>
                </svg>
              </div>

              <p className="text-center text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 mt-3">
                Timing is everything. Aim for your exact target!
              </p>
            </div>

            {/* Score Strip */}
            <div className="grid grid-cols-3 gap-2 px-5 py-3.5 bg-slate-50 dark:bg-[#181a20] border-y border-slate-200 dark:border-[#2a2d37]">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#12a66a]">TARGET</span>
                <strong className="text-xs text-[#12a66a] font-bold mt-0.5">On time (100)</strong>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">TOLERANCE</span>
                <strong className="text-xs text-slate-800 dark:text-slate-200 font-bold mt-0.5">±30m is great</strong>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">EXAMPLE</span>
                <strong className="text-xs text-slate-800 dark:text-slate-200 font-bold mt-0.5">Target: 8:00 AM</strong>
              </div>
            </div>

            {/* Example */}
            <div className="p-5 sm:p-7">
              <div className="mb-3">
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Real-life example</div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                  <i className="ph-fill ph-alarm text-amber-500" />
                  <span>Wake-Up Time</span>
                </h3>
                <div className="text-xs text-slate-500">Goal: 8:00 AM</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl border border-[#c6efd9] dark:border-emerald-800/60 bg-[#f0fbf5] dark:bg-[#1a2a1f] text-center">
                  <strong className="text-xs text-slate-900 dark:text-slate-100">7:30 AM</strong>
                  <span className="block text-[11px] font-extrabold text-[#12a66a] dark:text-[#4ade80] mt-0.5">100 pts</span>
                </div>
                <div className="p-2.5 rounded-xl border border-[#c6efd9] dark:border-emerald-800/60 bg-[#f0fbf5] dark:bg-[#1a2a1f] text-center">
                  <strong className="text-xs text-slate-900 dark:text-slate-100">8:00 AM</strong>
                  <span className="block text-[11px] font-extrabold text-[#12a66a] dark:text-[#4ade80] mt-0.5">100 pts</span>
                </div>
                <div className="p-2.5 rounded-xl border border-[#c6efd9] dark:border-emerald-800/60 bg-[#f0fbf5] dark:bg-[#1a2a1f] text-center">
                  <strong className="text-xs text-slate-900 dark:text-slate-100">8:30 AM</strong>
                  <span className="block text-[11px] font-extrabold text-[#12a66a] dark:text-[#4ade80] mt-0.5">100 pts</span>
                </div>
                <div className="p-2.5 rounded-xl border border-[#f4c7ca] dark:border-red-800/60 bg-[#fff0f1] dark:bg-[#2a1a1a] text-center">
                  <strong className="text-xs text-slate-900 dark:text-slate-100">10:00 AM</strong>
                  <span className="block text-[11px] font-extrabold text-[#e5484d] dark:text-[#f87171] mt-0.5">Low</span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-[#181a20] border border-slate-200 dark:border-[#2a2d37] flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <i className="ph-fill ph-lightbulb text-amber-500 text-base shrink-0 mt-0.5" />
                <div><strong>Pro Tip:</strong> Consistency &gt; being insanely early.</div>
              </div>
            </div>
          </div>
        )}

        {/* 05 SWEET SPOT */}
        {activeEngine === 'sweet-spot' && (
          <div>
            <div className="p-5 sm:p-7">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-[#4ade80] text-white dark:text-[#111318] flex items-center justify-center text-xs font-black shrink-0">
                    05
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Sweet Spot</h2>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">Not too little, not too much — right in the middle.</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">(Optimal Range)</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => toggleTooltip('Balance wins. 100 points inside your ideal range.', e)}
                  className="w-8 h-8 rounded-full border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-[#3f7cff] flex items-center justify-center cursor-pointer shrink-0"
                >
                  <i className="ph ph-info text-base" />
                </button>
              </div>

              {/* Chart Wrap */}
              <div className="w-full my-4">
                <svg className="chart-svg w-full h-auto" viewBox="0 20 900 340">
                  <line className="grid-line" x1="105" y1="70" x2="820" y2="70"/>
                  <line className="grid-line" x1="105" y1="155" x2="820" y2="155"/>
                  <line className="grid-line" x1="105" y1="240" x2="820" y2="240"/>
                  <line className="grid-line" x1="105" y1="325" x2="820" y2="325"/>
                  <line className="axis-line" x1="105" y1="55" x2="105" y2="340"/>
                  <line className="axis-line" x1="105" y1="340" x2="820" y2="340"/>
                  <text className="score-number green" x="50" y="76">100</text>
                  <text className="axis-label" x="72" y="161">75</text>
                  <text className="axis-label" x="72" y="246">50</text>
                  <text className="score-number red" x="58" y="331">0</text>
                  <path d="M105 325 C170 305, 220 265, 280 210 C325 170, 350 115, 390 70 L600 70 C640 115, 665 170, 710 210 C770 265, 800 305, 820 325 L820 340 L105 340 Z" fill="rgba(18,166,106,.09)"/>
                  <path className="curve green" d="M105 325 C170 305, 220 265, 280 210 C325 170, 350 115, 390 70 L600 70 C640 115, 665 170, 710 210 C770 265, 800 305, 820 325"/>
                  <circle className="marker-green" cx="390" cy="70" r="12"/>
                  <circle className="marker-green" cx="600" cy="70" r="12"/>
                  <text className="score-number green" x="495" y="42" textAnchor="middle">100</text>
                  <text className="chart-label green strong" x="495" y="105" textAnchor="middle">PERFECT RANGE</text>
                  <text className="axis-label" x="495" y="130" textAnchor="middle">7–8 HOURS</text>
                  <line x1="390" y1="70" x2="390" y2="340" stroke="#12a66a" strokeWidth="2" strokeDasharray="7 7"/>
                  <line x1="600" y1="70" x2="600" y2="340" stroke="#12a66a" strokeWidth="2" strokeDasharray="7 7"/>
                  <text className="chart-label red" x="220" y="190" textAnchor="middle">NOT ENOUGH</text>
                  <text className="chart-label red" x="700" y="190" textAnchor="middle">TOO MUCH</text>
                  <text className="axis-label" transform="translate(24 205) rotate(-90)">Your score</text>
                  <text className="axis-label" x="490" y="360">How much you did →</text>
                </svg>
              </div>

              <p className="text-center text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 mt-3">
                Find that perfect middle ground. Balance is key!
              </p>
            </div>

            {/* Score Strip */}
            <div className="grid grid-cols-3 gap-2 px-5 py-3.5 bg-slate-50 dark:bg-[#181a20] border-y border-slate-200 dark:border-[#2a2d37]">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#e5484d]">TOO LITTLE</span>
                <strong className="text-xs text-[#e5484d] font-bold mt-0.5">Not enough (↓)</strong>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#12a66a]">OPTIMAL</span>
                <strong className="text-xs text-[#12a66a] font-bold mt-0.5">Just right! (100)</strong>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#e5484d]">TOO MUCH</span>
                <strong className="text-xs text-[#e5484d] font-bold mt-0.5">Way too much (↓)</strong>
              </div>
            </div>

            {/* Example */}
            <div className="p-5 sm:p-7">
              <div className="mb-3">
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Real-life example</div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                  <i className="ph-fill ph-moon-stars text-purple-500" />
                  <span>Sleep Duration</span>
                </h3>
                <div className="text-xs text-slate-500">Goal: 7–8 hours</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl border border-[#f4c7ca] dark:border-red-800/60 bg-[#fff0f1] dark:bg-[#2a1a1a] text-center">
                  <strong className="text-xs text-slate-900 dark:text-slate-100">5 hrs</strong>
                  <span className="block text-[11px] font-extrabold text-[#e5484d] dark:text-[#f87171] mt-0.5">Low</span>
                </div>
                <div className="p-2.5 rounded-xl border border-[#c6efd9] dark:border-emerald-800/60 bg-[#f0fbf5] dark:bg-[#1a2a1f] text-center">
                  <strong className="text-xs text-slate-900 dark:text-slate-100">7 hrs</strong>
                  <span className="block text-[11px] font-extrabold text-[#12a66a] dark:text-[#4ade80] mt-0.5">100 pts</span>
                </div>
                <div className="p-2.5 rounded-xl border border-[#c6efd9] dark:border-emerald-800/60 bg-[#f0fbf5] dark:bg-[#1a2a1f] text-center">
                  <strong className="text-xs text-slate-900 dark:text-slate-100">8 hrs</strong>
                  <span className="block text-[11px] font-extrabold text-[#12a66a] dark:text-[#4ade80] mt-0.5">100 pts</span>
                </div>
                <div className="p-2.5 rounded-xl border border-[#f4c7ca] dark:border-red-800/60 bg-[#fff0f1] dark:bg-[#2a1a1a] text-center">
                  <strong className="text-xs text-slate-900 dark:text-slate-100">10 hrs</strong>
                  <span className="block text-[11px] font-extrabold text-[#e5484d] dark:text-[#f87171] mt-0.5">Low</span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-[#181a20] border border-slate-200 dark:border-[#2a2d37] flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <i className="ph-fill ph-lightbulb text-amber-500 text-base shrink-0 mt-0.5" />
                <div><strong>Pro Tip:</strong> Your body loves rhythm.</div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Tooltip Overlay */}
      {tooltip && (
        <div 
          onClick={() => setTooltip(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs"
        >
          <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 rounded-2xl max-w-xs text-xs font-bold shadow-xl animate-in zoom-in-95">
            {tooltip}
          </div>
        </div>
      )}

    </div>
  );
}
