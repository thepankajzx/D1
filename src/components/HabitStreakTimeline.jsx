import React, { useMemo } from 'react';
import Icon from './Icon';

// A predefined set of distinct colors for habits
const HABIT_COLORS = [
  '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', 
  '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#14b8a6', 
  '#6366f1', '#d946ef', '#f43f5e', '#0ea5e9', '#22c55e',
  '#a855f7', '#eab308', '#f97316', '#0284c7', '#be123c'
];

// Helper to format Date to 'YYYY-MM-DD' ignoring timezone shifts
function formatDateStr(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function HabitStreakTimeline({ habits, summaries, startDate, endDate }) {
  // Generate dates array between startDate and endDate
  const dates = useMemo(() => {
    const list = [];
    if (!startDate || !endDate) return list;
    
    let current = new Date(startDate);
    const end = new Date(endDate);
    current.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // Safeguard to prevent infinite loops (max 60 days)
    let safeGuard = 0;
    while (current <= end && safeGuard < 60) {
      list.push(new Date(current));
      current.setDate(current.getDate() + 1);
      safeGuard++;
    }
    return list;
  }, [startDate, endDate]);

  if (!dates.length || !habits.length) return null;

  // Header texts
  const startStr = dates[0].toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  const endStr = dates[dates.length - 1].toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

  return (
    <div className="flex flex-col w-full overflow-hidden mb-6 relative">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-2 shrink-0">
        <span className="text-on-surface text-[14px] font-bold tracking-tight">
          {startStr} – {endStr}
        </span>
      </div>

      {/* Scrollable Container */}
      <div className="overflow-x-auto custom-scrollbar pb-3 relative">
        <div className="flex flex-col min-w-max">
          
          {/* Days Header Row */}
          <div className="flex mb-3">
            {/* Empty space for habit names sticky sidebar */}
            <div className="w-[140px] shrink-0 sticky left-0 z-20 bg-background"></div>
            
            {/* Days Columns */}
            <div className="flex gap-[6px]">
              {dates.map((date, idx) => {
                const dayLetter = date.toLocaleDateString('en-US', { weekday: 'narrow' });
                const dayNum = date.getDate();
                const isToday = formatDateStr(date) === formatDateStr(new Date());

                return (
                  <div key={idx} className="w-[32px] flex flex-col items-center justify-center shrink-0 gap-0.5">
                    <span className={`text-[11px] font-bold ${isToday ? 'text-primary' : 'text-on-surface-variant/80'}`}>{dayLetter}</span>
                    <span className={`text-[10px] font-medium ${isToday ? 'text-primary' : 'text-on-surface-variant/60'}`}>{dayNum}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Habit Rows */}
          <div className="flex flex-col gap-[14px]">
            {habits.map((habit, hIdx) => {
              const color = HABIT_COLORS[hIdx % HABIT_COLORS.length];
              
              return (
                <div key={habit.id} className="flex items-center relative h-[32px]">
                  
                  {/* Sticky Sidebar: Habit Info */}
                  <div className="w-[140px] shrink-0 sticky left-0 z-20 bg-background flex items-center gap-2.5 pr-2">
                    <div 
                      className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: `${color}15`, color: color }}
                    >
                      <Icon name={habit.icon} className="text-[16px]" />
                    </div>
                    <span className="text-[13px] font-bold text-on-surface truncate pr-2 leading-tight flex-1">
                      {habit.name}
                    </span>
                    {/* Shadow gradient for sticky transition */}
                    <div className="absolute right-[-12px] top-0 bottom-0 w-[12px] bg-gradient-to-r from-background to-transparent pointer-events-none"></div>
                  </div>

                  {/* Timeline Nodes */}
                  <div className="flex gap-[6px] relative">
                    {dates.map((date, dIdx) => {
                      const dateStr = formatDateStr(date);
                      const daySummary = summaries.find(s => s.id === dateStr);
                      const score = daySummary?.habitScores?.[habit.id] || 0;
                      const isCompleted = score > 0;
                      
                      // Check next day to draw connecting line
                      let hasNextCompleted = false;
                      if (isCompleted && dIdx < dates.length - 1) {
                        const nextDateStr = formatDateStr(dates[dIdx + 1]);
                        const nextSummary = summaries.find(s => s.id === nextDateStr);
                        if ((nextSummary?.habitScores?.[habit.id] || 0) > 0) {
                          hasNextCompleted = true;
                        }
                      }

                      return (
                        <div key={dIdx} className="w-[32px] h-[32px] flex items-center justify-center shrink-0 relative">
                          
                          {/* Connecting Line */}
                          {hasNextCompleted && (
                            <div 
                              className="absolute top-1/2 left-1/2 h-[3.5px] -translate-y-1/2 z-0 rounded-full" 
                              style={{ width: '38px', backgroundColor: color, opacity: 0.9 }} 
                            />
                          )}

                          {/* Node Circle */}
                          <div 
                            className="w-[24px] h-[24px] rounded-full flex items-center justify-center z-10 transition-all shadow-sm"
                            style={{
                              backgroundColor: isCompleted ? color : '#ffffff',
                              opacity: 1,
                              border: isCompleted ? 'none' : '1px solid var(--color-outline-variant)'
                            }}
                          >
                            {isCompleted ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            ) : (
                              <div className="w-[4px] h-[4px] rounded-full bg-black/30"></div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
