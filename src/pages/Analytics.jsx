import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  computeKPIs, 
  generateHeatmapGrid, 
  computeHabitBreakdown, 
  identifyAreasToImprove 
} from '../lib/analytics';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Analytics() {
  const { user } = useAuth();
  
  // Date Range State
  const [rangeOption, setRangeOption] = useState('30'); // '7', '30', '90', 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  // Filter States
  const [filterMode, setFilterMode] = useState('overall'); // 'overall' or habitId
  const [chartMode, setChartMode] = useState('combined'); // 'combined' or 'separate'
  
  // Data States
  const [habits, setHabits] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userDoc, setUserDoc] = useState(null);

  // Compute actual start/end based on option
  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    
    if (rangeOption === 'custom' && customStart && customEnd) {
      return { startDate: customStart, endDate: customEnd };
    }
    
    let days = parseInt(rangeOption) || 30;
    const startObj = new Date();
    startObj.setDate(startObj.getDate() - days + 1); // +1 because inclusive of today
    
    return {
      startDate: startObj.toISOString().split('T')[0],
      endDate: end
    };
  }, [rangeOption, customStart, customEnd]);

  // Initial Fetch Data (Habits & User)
  useEffect(() => {
    if (!user) return;
    async function init() {
      const uDoc = await getDoc(doc(db, 'users', user.uid));
      setUserDoc(uDoc.exists() ? uDoc.data() : null);
      
      const habitsSnap = await getDocs(collection(db, `users/${user.uid}/habits`));
      setHabits(habitsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    init();
  }, [user]);

  // Fetch summaries and entries when date range changes
  useEffect(() => {
    if (!user || !startDate || !endDate) return;
    
    async function loadRangeData() {
      setLoading(true);
      try {
        // Fetch summaries
        const summariesSnap = await getDocs(
          query(collection(db, `users/${user.uid}/dailySummaries`), 
            where('__name__', '>=', startDate),
            where('__name__', '<=', endDate)
          )
        );
        const fetchedSummaries = summariesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSummaries(fetchedSummaries);
        
        // Fetch all entries in range (using entryDate field we added in Dashboard)
        const entriesSnap = await getDocs(
          query(collection(db, `users/${user.uid}/entries`), 
            where('entryDate', '>=', startDate),
            where('entryDate', '<=', endDate)
          )
        );
        setEntries(entriesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Failed to load range data", e);
      }
      setLoading(false);
    }
    loadRangeData();
  }, [user, startDate, endDate]);

  // Computations
  const kpis = useMemo(() => computeKPIs(summaries, startDate, endDate), [summaries, startDate, endDate]);
  const heatmapGrid = useMemo(() => generateHeatmapGrid(summaries, entries, filterMode, filterMode, startDate, endDate), [summaries, entries, filterMode, startDate, endDate]);
  const breakdown = useMemo(() => computeHabitBreakdown(habits, entries, startDate, endDate), [habits, entries, startDate, endDate]);
  const areasToImprove = useMemo(() => identifyAreasToImprove(breakdown), [breakdown]);

  // Chart Data Prep
  const chartData = useMemo(() => {
    // Generate dates array
    const dates = [];
    let current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates.map(dateStr => {
      const dataPoint = { date: dateStr };
      
      // Overall
      const summary = summaries.find(s => s.id === dateStr);
      dataPoint.overallScore = summary?.overallScore || 0;
      
      // Habits
      habits.forEach(h => {
        const entry = entries.find(e => e.entryDate === dateStr && e.habitId === h.id);
        dataPoint[h.id] = entry?.computedScore !== undefined && entry?.computedScore !== null ? entry.computedScore : null;
      });
      
      return dataPoint;
    });
  }, [startDate, endDate, summaries, entries, habits]);

  if (loading && !summaries.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-container-max-width mx-auto">
      {/* Header & Date Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Performance Analytics</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Analyze your habit consistency and intensity over time.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-surface-container rounded-lg p-1 border border-outline-variant">
          {['7', '30', '90'].map(val => (
            <button 
              key={val}
              onClick={() => setRangeOption(val)}
              className={`px-3 py-1.5 rounded-md font-label-sm text-label-sm transition-colors ${rangeOption === val ? 'bg-surface shadow-sm border border-outline-variant text-on-surface' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            >
              {val} Days
            </button>
          ))}
          <div className="relative group">
            <button 
              onClick={() => setRangeOption('custom')}
              className={`px-3 py-1.5 rounded-md font-label-sm text-label-sm transition-colors flex items-center gap-1 ${rangeOption === 'custom' ? 'bg-surface shadow-sm border border-outline-variant text-on-surface' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            >
              Custom <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            </button>
            {rangeOption === 'custom' && (
              <div className="absolute top-full right-0 mt-2 bg-surface border border-outline-variant rounded-lg p-2 flex flex-col gap-2 z-20 shadow-lg">
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="text-sm rounded p-1" />
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="text-sm rounded p-1" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-surface border border-outline-variant rounded-xl p-6 flex flex-col gap-2">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Avg Score</span>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-primary">{kpis.averageScore}</span>
            <span className="font-mono-data text-mono-data text-on-surface-variant">/100</span>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant rounded-xl p-6 flex flex-col gap-2">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Best Day</span>
          <span className="font-headline-lg text-headline-lg text-primary">{kpis.bestDayScore || '--'}</span>
          <span className="font-body-md text-body-md text-on-surface-variant mt-auto">{kpis.bestDay || 'N/A'}</span>
        </div>
        <div className="bg-surface border border-outline-variant rounded-xl p-6 flex flex-col gap-2">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Consistency</span>
          <div className="flex items-baseline gap-1">
            <span className="font-headline-lg text-headline-lg text-primary">{kpis.consistency}</span>
            <span className="font-headline-md text-headline-md text-primary">%</span>
          </div>
          <div className="w-full h-1 bg-surface-container rounded-full mt-auto overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${kpis.consistency}%` }}></div>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant rounded-xl p-6 flex flex-col gap-2">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Current Streak</span>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-primary">{userDoc?.currentStreak || 0}</span>
            <span className="font-body-md text-body-md text-on-surface-variant">days</span>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant mt-auto">Record: {userDoc?.longestStreak || 0} days</span>
        </div>
        <div className="bg-surface border border-outline-variant rounded-xl p-6 flex flex-col gap-2 col-span-2 md:col-span-1">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Tracked Days</span>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-primary">{kpis.trackedDays}</span>
            <span className="font-mono-data text-mono-data text-on-surface-variant">/{kpis.totalDays}</span>
          </div>
        </div>
      </div>

      {/* Main Chart & Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Line Chart */}
        <div className="lg:col-span-2 bg-surface border border-outline-variant rounded-xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline-md text-headline-md text-on-surface">Score Trend</h2>
            <div className="flex gap-2">
                <select 
                  className="bg-surface-container border border-outline-variant rounded p-1 text-sm text-on-surface"
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                >
                    <option value="overall">Overall</option>
                    {habits.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
            </div>
          </div>
          <div className="flex-grow w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eeedf3" />
                <XAxis dataKey="date" tick={{fontSize: 10, fill: '#868381'}} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{fontSize: 10, fill: '#868381'}} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#faf9fe', borderRadius: '8px', border: '1px solid #c4c7c7' }}
                  itemStyle={{ color: '#000' }}
                />
                {filterMode === 'overall' ? (
                  <Line type="monotone" dataKey="overallScore" stroke="#000" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                ) : (
                  <Line type="monotone" dataKey={filterMode} stroke="#000" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} connectNulls={true} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-surface border border-outline-variant rounded-xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline-md text-headline-md text-on-surface">Consistency Map</h2>
          </div>
          
          <div className="flex-grow flex flex-col overflow-x-auto pb-2">
            <div className="flex gap-2">
              <div className="flex flex-col justify-between py-[2px] pr-2 font-mono-data text-[10px] text-on-surface-variant h-[108px]">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
                <span>Sun</span>
              </div>
              <div className="grid-heatmap">
                {heatmapGrid.map((cell, i) => (
                  <div 
                    key={i} 
                    title={!cell.isPad && cell.score !== null ? `${cell.date}: ${cell.score}%` : ''}
                    className={`heatmap-cell ${cell.isPad ? 'bg-transparent' : cell.score === null ? 'bg-surface-container' : `bg-perf-${cell.perfBand}`}`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4 font-mono-data text-[10px] text-on-surface-variant">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-perf-0 border border-outline-variant"></div>
              <div className="w-3 h-3 rounded-sm bg-perf-3"></div>
              <div className="w-3 h-3 rounded-sm bg-perf-5"></div>
              <div className="w-3 h-3 rounded-sm bg-perf-8"></div>
              <div className="w-3 h-3 rounded-sm bg-perf-10"></div>
            </div>
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Habit Performance Table */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden mb-8">
        <div className="p-6 border-b border-outline-variant">
          <h2 className="font-headline-md text-headline-md text-on-surface">Habit Breakdown</h2>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="font-label-sm text-label-sm text-on-surface-variant opacity-70 border-b border-outline-variant">
                <th className="p-4 font-medium">Habit</th>
                <th className="p-4 font-medium text-right">Average Score</th>
                <th className="p-4 font-medium text-right">Consistency</th>
                <th className="p-4 font-medium text-right">Best / Lowest</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md text-on-surface">
              {breakdown.map((b) => (
                <tr key={b.id} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors group">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary group-hover:scale-125 transition-transform"></div>
                    {b.name}
                  </td>
                  <td className="p-4 text-right font-mono-data">{Math.round(b.avgScore)}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-mono-data">{b.consistency}%</span>
                      <div className="w-16 h-1 bg-surface-container rounded-full overflow-hidden inline-block">
                        <div className="h-full bg-primary" style={{ width: `${b.consistency}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono-data text-on-surface-variant">
                    {b.bestScore ?? '--'} / {b.lowestScore ?? '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Areas to Improve */}
        {areasToImprove.length > 0 && (
          <div className="p-6 bg-error-container text-on-error-container text-sm">
            <h3 className="font-bold mb-2">Areas to Improve</h3>
            <ul className="list-disc pl-5 space-y-1">
              {areasToImprove.map(h => (
                <li key={h.id}>
                  {h.name} has averaged {Math.round(h.avgScore)}% this {rangeOption === 'custom' ? 'period' : `${rangeOption} days`}.
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
