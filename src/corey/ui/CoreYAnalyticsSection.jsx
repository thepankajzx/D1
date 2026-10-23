import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getCoreXConfigs, getCoreXLogs } from '../../corex/data/schema';
import CoreYAnalytics from './CoreYAnalytics';
import { ArrowLeft } from '@phosphor-icons/react';

export default function CoreYAnalyticsSection({ onExitFullscreen }) {
  const { currentUser: user } = useAuth();
  const [configs, setConfigs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      loadConfigs();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const data = await getCoreXConfigs(user.uid);
      setConfigs(data);

      if (data && data.length > 0) {
        const fetchedLogs = await getCoreXLogs(user.uid, data[0].id);
        
        // Seed dummy data if none exists for visual testing
        if (!fetchedLogs || fetchedLogs.length === 0) {
          const seededLogs = seedDummyData(data[0]);
          setLogs(seededLogs);
        } else {
          setLogs(fetchedLogs);
        }
      }
    } catch (e) {
      console.error("Error loading Core Y config & logs:", e);
    } finally {
      setLoading(false);
    }
  };

  const seedDummyData = (config) => {
    const dummy = [];
    const today = new Date();
    
    for (let i = 9; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const log = { date: dateStr };
      if (config.outcome) {
        // Random rating 1-10
        log[config.outcome.key || 'outcome'] = Math.floor(Math.random() * 5) + 5;
      }
      
      if (config.factors) {
        config.factors.forEach(f => {
          if (f.properties && f.properties.length > 0) {
            log[f.id] = {};
            f.properties.forEach(p => {
              if (p.type === 'number') log[f.id][p.id] = Math.floor(Math.random() * 4);
              else if (p.type === 'yesno') log[f.id][p.id] = Math.random() > 0.5;
              else if (p.type === 'time') log[f.id][p.id] = '16:00';
            });
          }
        });
      }
      dummy.push(log);
    }
    return dummy;
  };

  if (loading) return null;

  const currentConfig = configs[0] || null;

  return (
    <div className="w-full h-full flex-1 flex flex-col overflow-y-auto bg-[#fafafc] dark:bg-[#0c0e15] pb-20">
      <div className="px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-[#131722]/95 backdrop-blur-md flex items-center justify-between gap-3 sticky top-0 z-50">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onExitFullscreen}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors shrink-0"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Back</span>
          </button>
          <div className="flex flex-col min-w-0">
            <h1 className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate">
              Factor Analytics
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 mt-6">
        <CoreYAnalytics 
          config={currentConfig}
          logs={logs}
          isDedicatedPage={true}
        />
      </div>
    </div>
  );
}
