import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import HabitIcon from '../components/HabitIcon';
import { ArrowLeft, Flame, Trophy, ChartBar, Star, Check, CaretDown, CalendarBlank } from '@phosphor-icons/react';
import { calculateStreakData } from '../lib/streakEngine';
import { resolveHabitColor, resolveHabitIcon } from '../lib/habitColors';

// @anchor: all-streaks-visualizer-page
export default function AllStreaksVisualizer() {
  const navigate = useNavigate();
  const { habits = [], allSummaries = [], streakTrackingEnabled } = useData();
  const { isHinglish } = useLanguage();
  const [timeFrame, setTimeFrame] = useState(14); // default to 14 days
  const [expandedHabits, setExpandedHabits] = useState({}); // accordion dropdown state for each habit


  const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);

  // Calculate streak for all habits and sort by current streak
  const sortedHabits = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    let timeframeDays = [];
    if (timeFrame === 'all') {
      if (allSummaries.length > 0) {
        const sortedSummaries = [...allSummaries].sort((a, b) => a.id.localeCompare(b.id));
        const earliestStr = sortedSummaries[0].id;
        const current = new Date(earliestStr + 'T00:00:00');
        const end = new Date(todayStr + 'T00:00:00');
        while (current <= end) {
          timeframeDays.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
        }
      } else {
        timeframeDays = [todayStr];
      }
    } else {
      const daysCount = typeof timeFrame === 'number' ? timeFrame : 14;
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        timeframeDays.push(d.toISOString().split('T')[0]);
      }
    }

    const summaryMap = {};
    allSummaries.forEach(s => { summaryMap[s.id] = s; });

    const sortedSummariesForBest = [...allSummaries].sort((a, b) => a.id.localeCompare(b.id));

    return activeHabits.map(h => {
      const realIcon = resolveHabitIcon({ id: h.id, icon: h.icon });
      const realColor = resolveHabitColor({ id: h.id, icon: realIcon, color: h.color });

      const data = calculateStreakData(h.id, allSummaries);
      
      const history = timeframeDays.map(dateStr => {
        const summary = summaryMap[dateStr];
        let status = 'missed';
        if (summary) {
           const score = summary.habitScores ? summary.habitScores[h.id] : undefined;
           const isLogged = score !== undefined && score !== null;
           const isSuccessful = isLogged && Number(score) >= 60;
           if (isSuccessful) status = 'completed';
           else if (isLogged) status = 'failed';
        }
        return { date: dateStr, status };
      });

      // Calculate global best streak dates
      let maxLen = 0;
      let bestBlocks = [];
      let currentBlock = [];
      
      sortedSummariesForBest.forEach(s => {
         const score = s.habitScores ? s.habitScores[h.id] : undefined;
         const isSuccessful = (score !== undefined && score !== null) && Number(score) >= 60;
         
         if (isSuccessful) {
             currentBlock.push(s.id);
         } else {
             if (currentBlock.length > maxLen) {
                 maxLen = currentBlock.length;
                 bestBlocks = [currentBlock];
             } else if (currentBlock.length === maxLen && maxLen > 0) {
                 bestBlocks.push(currentBlock);
             }
             currentBlock = [];
         }
      });
      if (currentBlock.length > maxLen) {
          maxLen = currentBlock.length;
          bestBlocks = [currentBlock];
      } else if (currentBlock.length === maxLen && maxLen > 0) {
          bestBlocks.push(currentBlock);
      }
      
      const bestStreakDates = new Set();
      if (maxLen > 1) {
          bestBlocks.forEach(block => block.forEach(d => bestStreakDates.add(d)));
      }

      return {
        ...h,
        icon: realIcon,
        color: realColor,
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
        bestStreakDates,
        history
      };
    }).sort((a, b) => b.currentStreak - a.currentStreak || b.longestStreak - a.longestStreak);
  }, [activeHabits, allSummaries, timeFrame]);

  if (!streakTrackingEnabled) {
    return (
      <div className="p-8 text-center text-slate-500">
        {isHinglish ? 'स्ट्रीक ट्रैकिंग बंद है' : 'Streak Tracking is Disabled'}
      </div>
    );
  }

  const top3Best = useMemo(() => {
    return [...sortedHabits]
      .sort((a, b) => b.longestStreak - a.longestStreak || b.currentStreak - a.currentStreak)
      .slice(0, 3);
  }, [sortedHabits]);

  const toggleHabitExpand = (habitId) => {
    setExpandedHabits(prev => ({
      ...prev,
      [habitId]: !prev[habitId]
    }));
  };

  const isAllExpanded = useMemo(() => {
    return sortedHabits.length > 0 && sortedHabits.every(h => expandedHabits[h.id]);
  }, [sortedHabits, expandedHabits]);

  const toggleAll = () => {
    if (isAllExpanded) {
      setExpandedHabits({});
    } else {
      const newExp = {};
      sortedHabits.forEach(h => { newExp[h.id] = true; });
      setExpandedHabits(newExp);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-white pb-24">
      {/* Header */}
      <div className="bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/analytics')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft weight="bold" />
            {isHinglish ? 'वापस' : 'Back'}
          </button>
          
          <div className="text-right">
            <h1 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
              {isHinglish ? 'हैबिट्स स्ट्रीक रेस' : 'Habits Streak Race'}
            </h1>
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center justify-end gap-1">
              <Star weight="fill" /> {isHinglish ? 'ओवरऑल व्यू' : 'Overall View'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-10">

        {/* Top 3 Best Streaks Showcase - All-Time Records */}
        {top3Best.length > 0 && (
          <div className="relative pt-1 pb-2">
            {/* Ambient Backlight */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-48 bg-amber-500/10 blur-[70px] rounded-full pointer-events-none"></div>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Trophy size={16} weight="fill" />
              </div>
              <h2 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {isHinglish ? 'ऑल-टाइम बेस्ट रिकॉर्ड्स' : 'All-Time Best Streaks'}
              </h2>
            </div>

            {/* Top 3 Cards Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-sm sm:max-w-md mx-auto items-end pt-2">
              
              {/* 2nd Place (Silver) */}
              {top3Best[1] && (
                <div className="flex flex-col items-center p-2.5 sm:p-3 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 shadow-xs relative">
                  {/* Avatar */}
                  <div className="relative mb-1">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-md ring-2 ring-slate-300 dark:ring-slate-600 relative" style={{ backgroundColor: top3Best[1].color }}>
                      <HabitIcon name={top3Best[1].icon} habitId={top3Best[1].id} className="text-white" size={20}  color={top3Best[1].color} />
                    </div>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-slate-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full shadow-xs border border-white dark:border-[#0B0F19]">
                      2ND
                    </div>
                  </div>

                  <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 truncate w-full text-center mt-1.5">{top3Best[1].name}</span>
                  
                  {/* Best Streak Badge with Trophy */}
                  <div className="mt-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                    <Trophy size={11} weight="fill" className="text-slate-400 dark:text-slate-300" />
                    <span className="text-xs font-black">{top3Best[1].longestStreak}d</span>
                  </div>
                </div>
              )}

              {/* 1st Place (Gold Champion) */}
              <div className="flex flex-col items-center p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/15 dark:to-transparent border-2 border-amber-400/60 dark:border-amber-500/40 shadow-md shadow-amber-500/10 relative -translate-y-2 z-10">
                {/* Avatar */}
                <div className="relative mb-1 mt-1">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg ring-3 ring-amber-400 dark:ring-amber-400 relative" style={{ backgroundColor: top3Best[0].color }}>
                    <HabitIcon name={top3Best[0].icon} habitId={top3Best[0].id} className="text-white" size={24}  color={top3Best[0].color} />
                  </div>
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black px-2 py-0.2 rounded-full shadow-xs border-2 border-white dark:border-[#0B0F19]">
                    1ST
                  </div>
                </div>

                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate w-full text-center mt-1.5">{top3Best[0].name}</span>
                
                {/* Best Streak Badge with Trophy */}
                <div className="mt-1.5 px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center gap-1 border border-amber-500/40">
                  <Trophy size={12} weight="fill" className="text-amber-500" />
                  <span className="text-xs font-black">{top3Best[0].longestStreak}d</span>
                </div>
              </div>

              {/* 3rd Place (Bronze) */}
              {top3Best[2] && (
                <div className="flex flex-col items-center p-2.5 sm:p-3 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 shadow-xs relative">
                  {/* Avatar */}
                  <div className="relative mb-1">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-md ring-2 ring-orange-300 dark:ring-orange-800 relative" style={{ backgroundColor: top3Best[2].color }}>
                      <HabitIcon name={top3Best[2].icon} habitId={top3Best[2].id} className="text-white" size={20}  color={top3Best[2].color} />
                    </div>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full shadow-xs border border-white dark:border-[#0B0F19]">
                      3RD
                    </div>
                  </div>

                  <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 truncate w-full text-center mt-1.5">{top3Best[2].name}</span>
                  
                  {/* Best Streak Badge with Trophy */}
                  <div className="mt-1.5 px-2 py-0.5 rounded-lg bg-orange-500/10 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 flex items-center gap-1 border border-orange-500/30">
                    <Trophy size={11} weight="fill" className="text-orange-500" />
                    <span className="text-xs font-black">{top3Best[2].longestStreak}d</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Timeline Section - 2-Tier Stacked Cards with Dropdown Full Grid */}
        <div className="space-y-4 pt-2">
          {/* Header Bar with Timeframe Selector & Expand/Collapse All */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <ChartBar size={16} weight="fill" />
              </div>
              <div>
                <h2 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {isHinglish ? 'स्ट्रीक टाइमलाइन' : 'Streak Timeline'}
                </h2>
                <p className="text-[10px] text-slate-400">
                  {isHinglish ? 'हैबिट पर टैप करें या ड्रॉपडाउन से फुल ग्रिड देखें' : 'Tap habit or dropdown to view full grid'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {/* Expand / Collapse All Toggle Button */}
              <button
                onClick={toggleAll}
                className="px-2.5 py-1 text-[11px] font-bold rounded-xl bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                title={isAllExpanded ? (isHinglish ? 'सब समेटें' : 'Collapse All') : (isHinglish ? 'सब खोलें' : 'Expand All')}
              >
                <CalendarBlank size={13} weight="bold" />
                <span>{isAllExpanded ? (isHinglish ? 'समेटें' : 'Collapse') : (isHinglish ? 'फुल ग्रिड' : 'Full Grid')}</span>
              </button>

              {/* Time Frame Selector */}
              <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-xl">
                {[
                  { value: 7, label: isHinglish ? '7 दिन' : '7D' },
                  { value: 14, label: isHinglish ? '14 दिन' : '14D' },
                  { value: 30, label: isHinglish ? '30 दिन' : '30D' },
                  { value: 'all', label: isHinglish ? 'ऑल' : 'All' }
                ].map(tf => (
                  <button
                    key={tf.value}
                    onClick={() => setTimeFrame(tf.value)}
                    className={`px-2.5 sm:px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      timeFrame === tf.value 
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List of Habits */}
          <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {sortedHabits.map((h, index) => {
              const isExpanded = !!expandedHabits[h.id];
              const completedCount = h.history.filter(d => d.status === 'completed').length;
              const totalDays = h.history.length;
              const completionRate = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;

              return (
                <div 
                  key={h.id} 
                  className="py-3 sm:py-3.5 space-y-2.5 transition-all"
                >
                  {/* Tier 1: Habit Info (Clickable header to toggle dropdown) */}
                  <div 
                    onClick={() => toggleHabitExpand(h.id)}
                    className="flex items-center justify-between gap-2 cursor-pointer select-none group"
                  >
                    {/* Left: Rank + Icon + Full Habit Name */}
                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                      <span className="text-xs font-black text-slate-400 w-3.5 text-right shrink-0">{index + 1}.</span>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform" style={{ backgroundColor: h.color }}>
                        <HabitIcon name={h.icon} habitId={h.id} className="text-white" size={15}  color={h.color} />
                      </div>
                      <span className="text-xs sm:text-sm font-bold truncate text-slate-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {h.name}
                      </span>
                    </div>

                    {/* Right: Badges for Current & Best + Dropdown Chevron */}
                    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      {/* Current Streak Badge */}
                      <div className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 flex items-center gap-1 shrink-0">
                        <Flame size={13} weight="fill" className="text-amber-500 shrink-0" />
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                          {h.currentStreak}d
                        </span>
                        <span className="text-[9px] font-bold text-amber-600/70 dark:text-amber-400/70 uppercase hidden sm:inline">
                          {isHinglish ? 'चालू' : 'Cur'}
                        </span>
                      </div>

                      {/* Best Streak Badge */}
                      <div className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/20 flex items-center gap-1 shrink-0">
                        <Trophy size={12} weight="fill" className="text-purple-500 shrink-0" />
                        <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                          {h.longestStreak}d
                        </span>
                        <span className="text-[9px] font-bold text-purple-600/70 dark:text-purple-400/70 uppercase hidden sm:inline">
                          {isHinglish ? 'बेस्ट' : 'Best'}
                        </span>
                      </div>

                      {/* Dropdown Toggle Button */}
                      <button
                        onClick={() => toggleHabitExpand(h.id)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                          isExpanded
                            ? 'bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-400'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200/70 dark:border-slate-700/70 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                        title={isExpanded ? (isHinglish ? 'समेटें' : 'Collapse') : (isHinglish ? 'फुल ग्रिड खोलें' : 'Expand Grid')}
                      >
                        <CaretDown 
                          size={14} 
                          weight="bold" 
                          className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-purple-500' : ''}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Tier 2: Conditional View - Either Full Grid (When Expanded) or Horizontal Tray (When Collapsed) */}
                  {isExpanded ? (
                    <div className="bg-slate-100/90 dark:bg-slate-900/80 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
                      {/* Grid Header Info */}
                      <div className="flex items-center justify-between text-[11px] font-bold pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-600 dark:text-emerald-400 font-black">
                            {completedCount} / {totalDays} {isHinglish ? 'दिन पूरे' : 'Days Completed'}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-slate-600 dark:text-slate-400">
                            {completionRate}% {isHinglish ? 'सफलता दर' : 'Success Rate'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {isHinglish ? 'स्ट्रीक लाइन कनेक्टेड' : 'Connected Streak Matrix'}
                        </span>
                      </div>

                      {/* 7-Column Grid with Individual Boxes and Dotted Connecting Lines */}
                      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                        {h.history.map((day, i) => {
                          const isCompleted = day.status === 'completed';
                          const isBestStreakCell = isCompleted && h.bestStreakDates.has(day.date);
                          const colIndex = i % 7;
                          const isPrevInRowCompleted = colIndex > 0 && h.history[i - 1]?.status === 'completed';
                          const isNextInRowCompleted = colIndex < 6 && h.history[i + 1]?.status === 'completed';
                          
                          // Styling specific to best streak vs past streak
                          const boxColorClass = !isCompleted 
                            ? 'bg-white/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                            : isBestStreakCell
                              ? 'bg-purple-500/10 dark:bg-purple-500/15 border-purple-500/30 dark:border-purple-500/30'
                              : 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 dark:border-emerald-500/30';

                          const lineStyleClass = isBestStreakCell 
                            ? 'border-purple-500 dark:border-purple-400' 
                            : 'border-emerald-500 dark:border-emerald-400';

                          const dotColorClass = isBestStreakCell
                            ? 'bg-purple-500 dark:bg-purple-400 text-white shadow-xs shadow-purple-500/30'
                            : 'bg-emerald-500 dark:bg-emerald-400 text-white shadow-xs shadow-emerald-500/30';

                          const dObj = new Date(day.date + 'T00:00:00');
                          const dayNum = dObj.getDate();
                          const monthStr = (dObj.getMonth() + 1).toString().padStart(2, '0');
                          const weekDayShort = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'][dObj.getDay()];
                          const weekDayEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dObj.getDay()];
                          const label = isHinglish ? weekDayShort : weekDayEn;

                          return (
                            <div
                              key={day.date}
                              className={`flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-xl border transition-all relative ${boxColorClass}`}
                              title={`${day.date} (${label}): ${day.status}${isBestStreakCell ? ' (Best Streak)' : ''}`}
                            >
                              {/* Date Header */}
                              <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 dark:text-slate-400 leading-none mb-1">
                                {dayNum}/{monthStr}
                              </span>

                              {/* Dot with Dotted Connecting Bridge */}
                              <div className="relative flex items-center justify-center w-full py-0.5">
                                {/* Dotted Line to Left */}
                                {isCompleted && isPrevInRowCompleted && (
                                  <div className={`absolute right-1/2 w-full top-1/2 -translate-y-1/2 border-t-2 border-dotted z-0 ${h.bestStreakDates.has(h.history[i-1]?.date) && isBestStreakCell ? 'border-purple-500 dark:border-purple-400' : lineStyleClass}`} />
                                )}
                                {/* Dotted Line to Right */}
                                {isCompleted && isNextInRowCompleted && (
                                  <div className={`absolute left-1/2 w-full top-1/2 -translate-y-1/2 border-t-2 border-dotted z-0 ${h.bestStreakDates.has(h.history[i+1]?.date) && isBestStreakCell ? 'border-purple-500 dark:border-purple-400' : lineStyleClass}`} />
                                )}

                                {/* Center Tick Dot */}
                                <div 
                                  className={`w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all z-10 relative ${
                                    isCompleted ? dotColorClass : 'bg-slate-200 dark:bg-slate-800'
                                  }`}
                                >
                                  {isCompleted ? (
                                    <Check size={11} weight="bold" className="text-white drop-shadow-xs" />
                                  ) : (
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Collapsed Recessed Horizontal Strip */
                    <div className="bg-slate-100/70 dark:bg-slate-900/50 rounded-xl px-2 py-1 border border-slate-200/50 dark:border-slate-800/60 overflow-x-auto scrollbar-hide">
                      <div className="flex items-center shrink-0 min-w-full justify-start py-0.5">
                        {h.history.map((day, i) => {
                          const isCurrentCompleted = day.status === 'completed';
                          const isBestStreakCell = isCurrentCompleted && h.bestStreakDates.has(day.date);
                          const isNextCompleted = i < h.history.length - 1 && h.history[i + 1].status === 'completed';
                          const isStreakConnected = isCurrentCompleted && isNextCompleted;
                          
                          const dotColorClass = isBestStreakCell
                            ? 'bg-purple-500 dark:bg-purple-400 text-white shadow-xs shadow-purple-500/30'
                            : 'bg-emerald-500 dark:bg-emerald-400 text-white shadow-xs shadow-emerald-500/30';
                            
                          const lineStyleClass = isBestStreakCell && h.bestStreakDates.has(h.history[i+1]?.date)
                            ? 'bg-purple-500 dark:bg-purple-400'
                            : 'bg-emerald-500 dark:bg-emerald-400';

                          return (
                            <div key={day.date} className="relative flex items-center justify-center w-7 h-7 shrink-0">
                              {/* Seamless Connecting Bridge */}
                              {isStreakConnected && (
                                <div 
                                  className={`absolute left-1/2 w-full top-1/2 -translate-y-1/2 h-[2.5px] z-0 ${lineStyleClass}`}
                                />
                              )}

                              {/* Consistent Medium Dot */}
                              <div 
                                className={`w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 z-10 relative transition-all ${
                                  isCurrentCompleted ? dotColorClass : 'bg-slate-200/80 dark:bg-slate-800/80'
                                }`}
                                title={`${day.date}: ${day.status}${isBestStreakCell ? ' (Best Streak)' : ''}`}
                              >
                                {isCurrentCompleted ? (
                                  <Check size={11} weight="bold" className="text-white drop-shadow-xs" />
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
