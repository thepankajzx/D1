import React, { useState, useEffect } from 'react';
import brandSvg from '../assets/streak-icon.svg';
import { recalculateStreaks } from '../lib/scoring';

const getScoreColor = (score) => {
    if (score >= 90) return '#22c55e'; 
    if (score >= 70) return '#84cc16'; 
    if (score >= 50) return '#eab308'; 
    if (score >= 30) return '#f97316'; 
    return '#ef4444'; 
};

const StreakWidget = ({ allSummaries }) => {
    const [showModal, setShowModal] = useState(false);
    const [stats, setStats] = useState({ currentStreak: 0, last7Days: 0, last30Days: 0 });

    useEffect(() => {
        if (!allSummaries || allSummaries.length === 0) return;
        
        const generateDates = (days) => {
            const dates = [];
            const today = new Date();
            const tzoffset = today.getTimezoneOffset() * 60000;
            const localToday = new Date(today.getTime() - tzoffset);
            
            for (let i = 0; i < days; i++) {
                const d = new Date(localToday);
                d.setDate(d.getDate() - i);
                dates.push(d.toISOString().split('T')[0]);
            }
            return dates;
        };

        const last7Dates = generateDates(7);
        const last30Dates = generateDates(30);

        const getAvg = (dates) => {
            let sum = 0;
            let validDays = 0;
            dates.forEach(dateStr => {
                const summary = allSummaries.find(s => s.id === dateStr);
                if (summary && summary.overallScore !== null) {
                    sum += summary.overallScore;
                    validDays++;
                }
            });
            // Treat missing days as 0 in average to reflect consistency
            return Math.round(dates.length > 0 ? sum / dates.length : 0);
        };

        const avg7 = getAvg(last7Dates);
        const avg30 = getAvg(last30Dates);
        
        // Re-use central streak logic
        // We filter out null scores first because null means no data tracked (skipped day)
        const validSummaries = allSummaries.filter(s => s.overallScore !== null);
        const { currentStreak } = recalculateStreaks(validSummaries);

        setStats({
            currentStreak: currentStreak,
            last7Days: avg7,
            last30Days: avg30
        });
    }, [allSummaries]);

    const borderColor = getScoreColor(stats.last7Days);

    return (
        <>
            <div 
                onClick={() => setShowModal(true)}
                className="relative cursor-pointer shrink-0 transition-transform active:scale-95"
                style={{ width: '80px', height: '80px' }}
            >
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle 
                        cx="50" cy="50" r="46" 
                        fill="none" 
                        stroke={borderColor} 
                        strokeWidth="4" 
                        strokeDasharray="15 5" 
                        className="transition-colors duration-500"
                    />
                </svg>
                
                <div className="absolute inset-[6px] rounded-full bg-black flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    <img 
                        src={brandSvg} 
                        alt="Streak" 
                        className="w-[120%] h-[120%] object-cover scale-[1.35] translate-y-[2px]"
                    />
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
                    <div className="bg-[#1c1c1c] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="w-24 h-24 mx-auto mb-4 bg-black rounded-full flex items-center justify-center border-[4px]" style={{ borderColor }}>
                                <img src={brandSvg} alt="Streak" className="w-[120%] h-[120%] object-cover scale-[1.35] translate-y-[2px]" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Your Streak</h2>
                            <p className="text-[#a0a0a0] text-sm mb-6">Keep it up! Consistency is the key.</p>
                            
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-[#2a2a2a] p-3 rounded-2xl flex flex-col items-center justify-center">
                                    <div className="text-[10px] text-[#888] font-bold uppercase tracking-wider mb-1">Streak</div>
                                    <div className="text-xl font-black text-white">{stats.currentStreak} <span className="text-xs font-semibold text-[#888]">d</span></div>
                                </div>
                                <div className="bg-[#2a2a2a] p-3 rounded-2xl flex flex-col items-center justify-center">
                                    <div className="text-[10px] text-[#888] font-bold uppercase tracking-wider mb-1">Last 7d</div>
                                    <div className="text-xl font-black" style={{ color: getScoreColor(stats.last7Days) }}>{stats.last7Days}%</div>
                                </div>
                                <div className="bg-[#2a2a2a] p-3 rounded-2xl flex flex-col items-center justify-center">
                                    <div className="text-[10px] text-[#888] font-bold uppercase tracking-wider mb-1">Last 30d</div>
                                    <div className="text-xl font-black" style={{ color: getScoreColor(stats.last30Days) }}>{stats.last30Days}%</div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-white/5">
                            <button 
                                onClick={() => setShowModal(false)}
                                className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default StreakWidget;
