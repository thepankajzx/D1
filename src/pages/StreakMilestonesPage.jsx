import confetti from 'canvas-confetti';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import Icon from '../components/Icon';
import BadgePersonaIcon from '../components/BadgePersonaIcon';
import { getHeaderPillsConfig, saveHeaderPillsConfig } from '../components/HeaderPillWidgets';
import { evaluateUserBadges } from '../lib/badgeEngine';
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
import { calculateStreakData, getNextMilestone } from '../lib/streakEngine';
import { DEDICATED_MILESTONES } from '../lib/milestoneDefinitions';
export { DEDICATED_MILESTONES };

export default function StreakMilestonesPage() {
  const navigate = useNavigate();
  const { allSummaries = [], habits = [], streakTrackingEnabled } = useData();
  const { isHinglish } = useLanguage();

  const [activeTab, setActiveTab] = useState('persona'); // 'persona' | 'streak'
  const [headerConfig, setHeaderConfig] = useState(getHeaderPillsConfig);
  const [celebratedItem, setCelebratedItem] = useState(null);

  // Badge Engine
  const badgeState = useMemo(() => {
    return evaluateUserBadges(allSummaries, habits, streakTrackingEnabled);
  }, [allSummaries, habits, streakTrackingEnabled]);

  // Streak Data
  const streakData = useMemo(() => {
    return calculateStreakData('all', allSummaries);
  }, [allSummaries]);

  const bestStreak = Math.max(streakData.currentStreak, streakData.longestStreak);
  const unlockedStreakCount = DEDICATED_MILESTONES.filter(m => bestStreak >= m.target).length;
  const milestoneInfo = getNextMilestone(streakData.currentStreak);

  // Sort badges: Unlocked/Achieved badges appear at the TOP, then locked ones by order
  const sortedBadges = useMemo(() => {
    return [...badgeState.allBadges].sort((a, b) => {
      if (a.isUnlocked && !b.isUnlocked) return -1;
      if (!a.isUnlocked && b.isUnlocked) return 1;
      return (a.order || 0) - (b.order || 0);
    });
  }, [badgeState.allBadges]);

  const topActiveBadge = badgeState.topBadge || badgeState.allBadges[0];

  const handleItemClick = (badge, isUnlocked) => {
    if (navigator.vibrate) navigator.vibrate(25);
    setCelebratedItem(badge);

    if (isUnlocked) {
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.5 },
          zIndex: 9999
        });
      } catch (e) {}
    }
  };

  const handleEquipBadge = (badgeId) => {
    if (navigator.vibrate) navigator.vibrate(25);
    const current = getHeaderPillsConfig();
    const updated = {
      ...current,
      enabled: true,
      selectedBadgeId: badgeId
    };
    if (updated.pill1 !== 'persona_badge' && updated.pill2 !== 'persona_badge' && updated.pill3 !== 'persona_badge') {
      updated.pill1 = 'persona_badge';
    }
    saveHeaderPillsConfig(updated);
    setHeaderConfig(updated);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0e14] text-slate-900 dark:text-slate-100 pb-24 pt-2">
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 space-y-3.5">
        
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
              {isHinglish ? 'ट्रॉफ़ी एवं पदवी वॉल' : 'Honors & Badges'}
            </span>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none mt-0.5">
              {isHinglish ? 'माइलस्टोन्स एवं बैज वॉल' : 'Milestones & Badge Wall'}
            </h1>
          </div>
        </div>

        {/* ── MASTER HERO CARD (TOP ACTIVE HONOR) ───────────────────── */}
        <div className="bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-2xl pointer-events-none -translate-y-8 translate-x-8"></div>

          <div className="space-y-2.5 relative z-10">
            {/* Top Row: Active Persona Title Callout */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${topActiveBadge?.gradient || 'from-amber-500 to-orange-500'} text-white flex items-center justify-center shrink-0 shadow-md ${topActiveBadge?.glow || 'shadow-amber-500/25'}`}>
                  <BadgePersonaIcon iconName={topActiveBadge?.iconName || 'Crown'} size={22} weight="fill" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none truncate">
                      {isHinglish ? topActiveBadge?.hindiTitle : topActiveBadge?.title}
                    </span>
                    <span className="text-[9.5px] font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full shrink-0">
                      {isHinglish ? 'सर्वोच्च पदवी' : 'TOP HONOR'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1 truncate">
                    {isHinglish ? topActiveBadge?.hindiDefinition : topActiveBadge?.definition}
                  </p>
                </div>
              </div>

              {/* Total Unlocked Pill Badge */}
              <div className="shrink-0 text-right">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black whitespace-nowrap">
                  <Trophy size={13} weight="fill" className="text-amber-500" />
                  <span>{badgeState.unlockedBadges.length} / {badgeState.allBadges.length}</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Auto Feature Info */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {isHinglish ? 'हेडर पिल' : 'Header Pill'}:
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400 truncate pl-2">
                {isHinglish 
                  ? 'आपका सर्वोच्च अर्जित बैज स्वतः टॉप हेडर पिल में दिखेगा' 
                  : 'Highest unlocked honor automatically appears in top header pill'}
              </span>
            </div>
          </div>
        </div>

        {/* ── COMPACT SINGLE-LINE TAB SWITCHER ───────────────────────── */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('persona')}
            className={`flex-1 py-1.5 sm:py-2 rounded-xl text-xs sm:text-[13px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'persona'
                ? 'bg-white dark:bg-[#131722] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Crown size={15} weight="fill" className={activeTab === 'persona' ? 'text-amber-500' : ''} />
            <span>{isHinglish ? 'बैजेस' : 'Honors'}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {badgeState.unlockedBadges.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('streak')}
            className={`flex-1 py-1.5 sm:py-2 rounded-xl text-xs sm:text-[13px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'streak'
                ? 'bg-white dark:bg-[#131722] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Flame size={15} weight="fill" className={activeTab === 'streak' ? 'text-orange-500' : ''} />
            <span>{isHinglish ? 'स्ट्रीक्स' : 'Streaks'}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {unlockedStreakCount}
            </span>
          </button>
        </div>

        {/* ── TAB 1: HONORS & BADGES (SQUARE CARDS GRID WITH ACHIEVED FIRST) ── */}
        {activeTab === 'persona' && (
          <div className="space-y-3 pt-0.5 animate-in fade-in duration-200">
            {/* Achieved Badges Ribbon if user has unlocked any */}
            {badgeState.unlockedBadges.length > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Trophy size={15} weight="fill" className="text-amber-500 shrink-0" />
                  <span className="text-xs font-black text-amber-700 dark:text-amber-300 truncate">
                    {badgeState.unlockedBadges.length} {isHinglish ? 'बैज अर्जित किए' : 'Honors Achieved'}
                  </span>
                </div>
                <div className="flex items-center -space-x-1 shrink-0">
                  {badgeState.unlockedBadges.map((b) => (
                    <div 
                      key={b.id} 
                      className={`w-6 h-6 rounded-full bg-gradient-to-br ${b.gradient} text-white flex items-center justify-center ring-2 ring-white dark:ring-[#131722] shadow-xs`}
                      title={b.title}
                    >
                      <BadgePersonaIcon iconName={b.iconName} size={11} weight="fill" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Square Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
              {sortedBadges.map((badge) => {
                const isUnlocked = badge.isUnlocked;
                const isTopHonor = topActiveBadge?.id === badge.id;

                return (
                  <div
                    key={badge.id}
                    onClick={() => handleItemClick(badge, isUnlocked)}
                    className={`p-3 rounded-2xl border transition-all flex flex-col justify-between aspect-square relative overflow-hidden select-none cursor-pointer active:scale-97 text-left ${
                      isUnlocked
                        ? isTopHonor
                          ? 'bg-white dark:bg-[#131722] border-amber-500/70 shadow-xs ring-1 ring-amber-500/40'
                          : 'bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200/90 dark:border-slate-800 shadow-2xs'
                        : 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/40 opacity-70'
                    }`}
                  >
                    {/* Top Row: Small Icon + Status Pill */}
                    <div className="flex items-start justify-between gap-1 shrink-0">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${badge.gradient} text-white flex items-center justify-center shrink-0 shadow-xs ${badge.glow}`}>
                        <BadgePersonaIcon iconName={badge.iconName} size={17} weight="fill" />
                      </div>

                      {isUnlocked ? (
                        <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-0.5 ${
                          isTopHonor
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300/60'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}>
                          <CheckCircle size={10} weight="fill" />
                          <span>{isTopHonor ? (isHinglish ? 'शीर्ष' : 'TOP') : (isHinglish ? 'अर्जित' : 'EARNED')}</span>
                        </span>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 shrink-0 text-[9px] font-bold">
                          <Lock size={10} weight="bold" />
                          <span className="truncate max-w-[50px]">{badge.progress}</span>
                        </div>
                      )}
                    </div>

                    {/* Middle: Badge Name & Definition ("Kyun mila hai") */}
                    <div className="my-auto py-1 min-w-0">
                      <h3 className={`text-xs sm:text-[13px] font-black truncate leading-tight ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                        {isHinglish ? badge.hindiTitle : badge.title}
                      </h3>
                      <p className="text-[10px] leading-snug line-clamp-3 text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        {isHinglish ? badge.hindiDefinition : badge.definition}
                      </p>
                    </div>

                    {/* Bottom: Criteria pill */}
                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 shrink-0 flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500">
                      <span className="truncate font-semibold">{isHinglish ? badge.hindiCriteria : badge.criteria}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 2: STREAK MILESTONES (9 DEDICATED TIERS) ─────────── */}
        {activeTab === 'streak' && (
          <div className="space-y-4 pt-1 animate-in fade-in duration-200">
            {!streakTrackingEnabled && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300">
                  <Flame size={18} weight="fill" className="text-amber-500 shrink-0" />
                  <span>
                    {isHinglish
                      ? 'स्ट्रीक ट्रैकिंग बंद है। स्ट्रीक माइलस्टोन्स अनलॉक करने के लिए प्रोफ़ाइल में चालू करें।'
                      : 'Streak tracking is OFF. Turn it on in Profile settings to activate consecutive streak milestones.'}
                  </span>
                </div>
                <button
                  onClick={() => navigate('/profile')}
                  className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                >
                  {isHinglish ? 'चालू करें' : 'Settings'}
                </button>
              </div>
            )}

            {/* Streak Hero Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between gap-3 relative z-10">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-200">
                    {isHinglish ? 'सक्रिय स्ट्रीक रिकॉर्ड' : 'Active Streak Engine'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
                      {streakData.currentStreak}
                    </span>
                    <span className="text-sm font-bold text-amber-100">
                      {isHinglish ? 'दिन की स्ट्रीक' : 'Days Current'}
                    </span>
                  </div>
                  <p className="text-xs text-amber-100 font-medium">
                    {isHinglish ? 'सर्वश्रेष्ठ रिकॉर्ड' : 'All-time Best'}: <span className="font-bold text-white">{bestStreak} {isHinglish ? 'दिन' : 'days'}</span>
                  </p>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
                  <Flame size={32} weight="fill" className="text-white" />
                </div>
              </div>
            </div>

            {/* 9 Streak Milestones List */}
            <div className="space-y-2.5">
              {DEDICATED_MILESTONES.map((m) => {
                const isUnlocked = bestStreak >= m.target;
                const IconComponent = m.icon;

                return (
                  <div
                    key={m.target}
                    onClick={() => handleItemClick({ ...m, id: `streak_${m.target}` }, isUnlocked)}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isUnlocked
                        ? 'bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200/90 dark:border-slate-800 shadow-2xs cursor-pointer'
                        : 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/40 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                        <IconComponent size={20} weight="fill" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs sm:text-sm font-black truncate ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                            {isHinglish ? m.hindiTitle : m.title}
                          </h4>
                          {isUnlocked && (
                            <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full shrink-0">
                              {isHinglish ? 'अनलॉक' : 'UNLOCKED'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {isHinglish ? m.hindiDesc : m.desc}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {isUnlocked ? (
                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                          <CheckCircle size={16} weight="fill" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                          <Lock size={12} weight="bold" />
                          <span>{bestStreak}/{m.target}d</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ── CELEBRATION / DETAILS MODAL ─────────────────────────────── */}
      {celebratedItem && (
        <div 
          onClick={() => setCelebratedItem(null)}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl text-center relative overflow-hidden animate-in zoom-in-95 duration-200 my-auto"
          >
            <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${celebratedItem.gradient || 'from-amber-400 to-orange-500'} text-white flex items-center justify-center shadow-md`}>
              <BadgePersonaIcon iconName={celebratedItem.iconName || 'Crown'} size={26} weight="fill" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block">
                {celebratedItem.isUnlocked ? (isHinglish ? 'माइलस्टोन हासिल!' : 'HONOR ACHIEVED!') : (isHinglish ? 'माइलस्टोन विवरण' : 'HONOR CRITERIA')}
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                {isHinglish ? (celebratedItem.hindiTitle || celebratedItem.title) : celebratedItem.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 font-medium leading-relaxed">
                {isHinglish ? (celebratedItem.hindiDefinition || celebratedItem.desc) : (celebratedItem.definition || celebratedItem.desc)}
              </p>
              <div className="mt-3 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 inline-block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {isHinglish ? celebratedItem.hindiCriteria : celebratedItem.criteria}
              </div>
            </div>

            {celebratedItem.isUnlocked && celebratedItem.id && (
              <button
                type="button"
                onClick={() => {
                  handleEquipBadge(celebratedItem.id);
                  setCelebratedItem(null);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Crown size={15} weight="fill" />
                <span>{isHinglish ? 'हेडर पिल में प्राथमिकता दें' : 'Feature in Header Pill'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setCelebratedItem(null)}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
            >
              {isHinglish ? 'बंद करें' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
