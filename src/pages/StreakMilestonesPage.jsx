import confetti from 'canvas-confetti';
import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import Icon from '../components/Icon';
import { 
  Flame, 
  Trophy, 
  ArrowLeft, 
  Sparkle, 
  Lightning, 
  Plant, 
  Brain, 
  ShieldChevron, 
  RocketLaunch, 
  Diamond, 
  Crown, 
  Planet,
  Lock,
  CheckCircle,
  CaretRight
} from '@phosphor-icons/react';
import { calculateStreakData, getNextMilestone, MILESTONE_TARGETS } from '../lib/streakEngine';

export const DEDICATED_MILESTONES = [
  { 
    target: 3, 
    title: '3-Day Ignition', 
    hindiTitle: '3-दिन इग्निशन (Ignition)', 
    desc: 'The spark that starts everything. First 3 consecutive days.',
    hindiDesc: 'पहला स्पार्क — 3 दिन की लगातार और मजबूत शुरुआत!',
    icon: Sparkle, 
    color: 'from-amber-400 to-orange-500', 
    borderColor: 'border-amber-400/40',
    bgLight: 'bg-amber-500/10',
    accentText: 'text-amber-500',
    motto: 'Every giant habit was once a 3-day spark.'
  },
  { 
    target: 7, 
    title: '7-Day Momentum', 
    hindiTitle: '7-दिन मोमेंटम (Momentum)', 
    desc: '1 full week without break. The flywheel begins to turn.',
    hindiDesc: '1 पूरा हफ़्ता बिना रुके — गति और लय पकड़ ली है!',
    icon: Lightning, 
    color: 'from-orange-500 to-amber-600', 
    borderColor: 'border-orange-500/40',
    bgLight: 'bg-orange-500/10',
    accentText: 'text-orange-500',
    motto: 'Momentum is gravity working in your favor.'
  },
  { 
    target: 14, 
    title: '14-Day Habit Seed', 
    hindiTitle: '14-दिन आदत का बीज (Habit Seed)', 
    desc: '2 weeks of consistency. Roots are firmly planted in soil.',
    hindiDesc: '2 हफ़्ते — जड़ें ज़मीन में मज़बूती से जम चुकी हैं!',
    icon: Plant, 
    color: 'from-emerald-500 to-teal-600', 
    borderColor: 'border-emerald-500/40',
    bgLight: 'bg-emerald-500/10',
    accentText: 'text-emerald-500',
    motto: 'Water the seed every day and watch it become unbreakable.'
  },
  { 
    target: 21, 
    title: '21-Day Neural Path', 
    hindiTitle: '21-दिन दिमागी सर्किट (Neural Path)', 
    desc: 'The classical threshold. New synaptic pathway formed.',
    hindiDesc: '21 दिन का नियम — दिमाग में नया न्यूरल पाथवे लॉक हो गया!',
    icon: Brain, 
    color: 'from-cyan-500 to-blue-600', 
    borderColor: 'border-cyan-500/40',
    bgLight: 'bg-cyan-500/10',
    accentText: 'text-cyan-500',
    motto: 'Your brain now defaults to action rather than resistance.'
  },
  { 
    target: 30, 
    title: '30-Day Solid Iron', 
    hindiTitle: '30-दिन ठोस लोहा (Solid Iron)', 
    desc: '1 full month. Discipline forged under pressure.',
    hindiDesc: '1 पूरा महीना — अनुशासन अब ठोस लोहे जैसा पक्का बन चुका है!',
    icon: ShieldChevron, 
    color: 'from-blue-600 to-indigo-600', 
    borderColor: 'border-blue-500/40',
    bgLight: 'bg-blue-500/10',
    accentText: 'text-blue-500',
    motto: 'Iron sharpens iron; repetition sharpens will.'
  },
  { 
    target: 60, 
    title: '60-Day Unstoppable', 
    hindiTitle: '60-दिन अजेय रफ़्तार (Unstoppable)', 
    desc: '2 months of mastery. Velocity overcomes all obstacles.',
    hindiDesc: '2 महीने — अब आपको कोई बाहरी रुकावट नहीं डिगा सकती!',
    icon: RocketLaunch, 
    color: 'from-purple-500 to-pink-600', 
    borderColor: 'border-purple-500/40',
    bgLight: 'bg-purple-500/10',
    accentText: 'text-purple-500',
    motto: 'You no longer negotiate with daily fatigue.'
  },
  { 
    target: 90, 
    title: '90-Day New Identity', 
    hindiTitle: '90-दिन नई पहचान (New Identity)', 
    desc: 'Quarter of a year. It is no longer what you do, but who you are.',
    hindiDesc: '90 दिन — यह आदत अब सिर्फ़ काम नहीं, आपकी पहचान बन चुकी है!',
    icon: Diamond, 
    color: 'from-pink-500 to-rose-600', 
    borderColor: 'border-pink-500/40',
    bgLight: 'bg-pink-500/10',
    accentText: 'text-pink-500',
    motto: 'Identity is the ultimate habit anchor.'
  },
  { 
    target: 180, 
    title: '180-Day Titan', 
    hindiTitle: '180-दिन टाइटन (Titan)', 
    desc: 'Half a year of continuous excellence. Elite tier consistency.',
    hindiDesc: 'आधा साल — चैंपियन स्तर का अटूट और अडिग अनुशासन!',
    icon: Crown, 
    color: 'from-amber-400 to-yellow-600', 
    borderColor: 'border-yellow-400/40',
    bgLight: 'bg-yellow-500/10',
    accentText: 'text-yellow-500',
    motto: 'Titans do not rely on motivation; they build monuments.'
  },
  { 
    target: 365, 
    title: '365-Day Grandmaster', 
    hindiTitle: '365-दिन ग्रैंडमास्टर (Grandmaster)', 
    desc: '1 full year of triumph. The pinnacle of human consistency.',
    hindiDesc: '1 पूरा साल (365 दिन) — आदत का सर्वोच्च शिखर हासिल!',
    icon: Planet, 
    color: 'from-yellow-400 via-amber-500 to-red-500', 
    borderColor: 'border-red-400/40',
    bgLight: 'bg-rose-500/10',
    accentText: 'text-rose-500',
    motto: 'A 365-day master changes the trajectory of a lifetime.'
  }
];

export default function StreakMilestonesPage() {
  const navigate = useNavigate();
  const { allSummaries = [] } = useData();
  const { isHinglish } = useLanguage();

  const streakData = useMemo(() => {
    return calculateStreakData('all', allSummaries);
  }, [allSummaries]);

  const bestStreak = Math.max(streakData.currentStreak, streakData.longestStreak);
  const unlockedCount = DEDICATED_MILESTONES.filter(m => bestStreak >= m.target).length;
  const milestoneInfo = getNextMilestone(streakData.currentStreak);

  const [celebratedMilestone, setCelebratedMilestone] = useState(null);

  useEffect(() => {
    if (bestStreak >= 3) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [bestStreak]);

  const handleMilestoneClick = (m, isUnlocked) => {
    if (navigator.vibrate) navigator.vibrate(30);
    if (isUnlocked) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
      setCelebratedMilestone(m);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0e14] text-slate-900 dark:text-slate-100 pb-24 pt-2">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 space-y-5">
        
        {/* ── TOP NAV BAR ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-black shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft size={15} weight="bold" />
            <span>{isHinglish ? 'पीछे जाएँ' : 'Back'}</span>
          </button>

          <div className="text-right">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500 block">
              {isHinglish ? 'ट्रॉफ़ी और माइलस्टोन्स' : 'Milestones & Trophies'}
            </span>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none mt-0.5">
              Streak Milestones
            </h1>
          </div>
        </div>

        {/* ── MASTER HERO CARD (COMPACT) ────────────────────────── */}
        <div className="bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-2xl pointer-events-none -translate-y-8 translate-x-8"></div>

          <div className="flex items-center justify-between gap-3 relative z-10">
            {/* Left: Flame & Current Streak */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <Flame size={22} weight="fill" className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                    {streakData.currentStreak}
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {isHinglish ? 'दिन की स्ट्रीक' : 'Day Streak'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                  {isHinglish ? `Personal Best: ${bestStreak} दिन` : `Personal Best: ${bestStreak} days`}
                </p>
              </div>
            </div>

            {/* Right: Unlocked Progress Badge */}
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-black">
                <Trophy size={13} weight="fill" className="text-amber-500" />
                <span>{unlockedCount} / {DEDICATED_MILESTONES.length}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-1 truncate max-w-[120px] xs:max-w-none">
                {isHinglish ? `अगला: ${milestoneInfo.label}` : `Next: ${milestoneInfo.label}`}
              </p>
            </div>
          </div>
        </div>

        {/* ── 9 COMPACT MILESTONE TROPHIES (2-COL MOBILE, 3-COL DESKTOP) ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 pt-0.5">
          {DEDICATED_MILESTONES.map((m) => {
            const IconComponent = m.icon;
            const isUnlocked = bestStreak >= m.target;
            const isNext = !isUnlocked && m.target === milestoneInfo.target;
            const remaining = Math.max(0, m.target - streakData.currentStreak);

            return (
              <div
                key={m.target}
                onClick={() => handleMilestoneClick(m, isUnlocked)}
                className={`p-2.5 sm:p-3 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between gap-2 cursor-pointer ${
                  isUnlocked
                    ? 'bg-white dark:bg-[#131722] border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs'
                    : isNext
                    ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700/60 shadow-2xs ring-1 ring-blue-400/30'
                    : 'bg-slate-50 dark:bg-slate-800/20 border-slate-200/60 dark:border-slate-800/40 opacity-70'
                }`}
              >
                {/* Card Top: Icon & Target Tag */}
                <div className="flex items-center justify-between gap-1">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isUnlocked
                      ? 'bg-gradient-to-tr ' + m.color + ' text-white shadow-xs'
                      : isNext
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}>
                    {isUnlocked ? (
                      <IconComponent size={16} weight="fill" />
                    ) : isNext ? (
                      <IconComponent size={16} weight="bold" />
                    ) : (
                      <Lock size={14} weight="bold" />
                    )}
                  </div>

                  <span className={`text-[9.5px] sm:text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                    isUnlocked
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : isNext
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      : 'bg-slate-200/70 dark:bg-slate-700/70 text-slate-500'
                  }`}>
                    {m.target} {isHinglish ? 'दिन' : 'Days'}
                  </span>
                </div>

                {/* Card Middle: Title & 1-Line Description */}
                <div>
                  <h3 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white leading-tight truncate">
                    {isHinglish ? m.hindiTitle : m.title}
                  </h3>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                    {isHinglish ? m.hindiDesc : m.desc}
                  </p>
                </div>

                {/* Card Bottom: Progress / Status */}
                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                  {isUnlocked ? (
                    <div className="flex items-center justify-between text-[10.5px] font-black text-emerald-600 dark:text-emerald-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle size={12} weight="fill" />
                        <span>{isHinglish ? 'हासिल' : 'Achieved'}</span>
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold">✓</span>
                    </div>
                  ) : isNext ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9.5px] font-black text-blue-600 dark:text-blue-400 leading-none">
                        <span>{remaining} {isHinglish ? 'दिन बाकी' : 'left'}</span>
                        <span>{streakData.currentStreak}/{m.target}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${milestoneInfo.progressPct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-400 block truncate">
                      {isHinglish ? `${m.target} दिन पर अनलॉक` : `Unlocks at ${m.target}d`}
                    </span>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* ── MOTIVATION PHILOSOPHY CARD ──────────────────────────────── */}
        <div className="p-4 sm:p-5 rounded-[24px] bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-yellow-500/10 border border-amber-500/20 text-slate-800 dark:text-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Trophy size={20} weight="fill" />
            <h4 className="text-xs sm:text-sm font-black">
              {isHinglish ? 'माइलस्टोन्स की शक्ति — अनुशासन का प्रमाण' : 'The Power of Streak Milestones'}
            </h4>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {isHinglish
              ? 'हर एक माइलस्टोन केवल एक संख्या नहीं है, बल्कि आपके आत्म-अनुशासन का प्रमाण है। 3 दिन से शुरू होकर 365 दिन का ग्रैंडमास्टर बनना एक दिन-प्रतिदिन की प्रक्रिया है। जब आप एक बैज जीतते हैं, तो वह हमेशा आपकी प्रोफ़ाइल की शोभा बढ़ाता है।'
              : 'Each milestone is a monument to your daily discipline. Moving from 3-day Ignition to 365-day Grandmaster cements true mastery that reshapes your trajectory for life.'}
          </p>
        </div>

      </div>

      {/* ── CELEBRATION MODAL ON TROPHY TAP ── */}
      {celebratedMilestone && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setCelebratedMilestone(null)}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-[#151a26] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-lg animate-bounce">
              <Trophy size={28} weight="fill" />
            </div>

            <div>
              <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                {isHinglish ? '🏆 माइलस्टोन हासिल!' : '🏆 Milestone Unlocked!'}
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1.5">
                {isHinglish ? celebratedMilestone.hindiTitle : celebratedMilestone.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isHinglish ? celebratedMilestone.hindiDesc : celebratedMilestone.desc}
              </p>
            </div>

            <p className="text-[11px] italic font-semibold text-amber-700/90 dark:text-amber-300/90 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-800/60">
              "{celebratedMilestone.motto}"
            </p>

            <button
              type="button"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(20);
                try {
                  confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
                } catch (e) {}
                setCelebratedMilestone(null);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs cursor-pointer hover:opacity-90 transition-all shadow-xs"
            >
              {isHinglish ? 'शानदार! (Continue)' : 'Awesome!'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
