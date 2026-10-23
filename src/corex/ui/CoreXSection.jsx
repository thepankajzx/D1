import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getCoreXConfigs, getCoreXLogs, saveCoreXConfig, saveCoreXLog } from '../data/schema';
import CoreXIcon from './CoreXIcon';
import MobileBuilder from './MobileBuilder';
import DailyCheckIn from './DailyCheckIn';
import InsightsDashboard from './InsightsDashboard';
import { 
  Atom, 
  Plus, 
  CaretRight, 
  ArrowLeft, 
  Sparkle, 
  PencilSimple, 
  ChartLineUp, 
  CalendarCheck 
} from '@phosphor-icons/react';

export default function CoreXSection({ canExport = true }) {
  const { currentUser: user } = useAuth();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [viewState, setViewState] = useState('list'); // 'list' | 'builder' | 'dashboard'
  const [activeConfig, setActiveConfig] = useState(null);
  const [activeLogs, setActiveLogs] = useState([]);
  const [dashboardTab, setDashboardTab] = useState('track'); // 'track' | 'insights'

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
    } catch (e) {
      console.error("Error loading Core X configs:", e);
    } finally {
      setLoading(false);
    }
  };

  const openDashboard = async (config) => {
    setActiveConfig(config);
    setViewState('dashboard');
    setDashboardTab('track');
    try {
      const logs = await getCoreXLogs(user.uid, config.id || config.cxId);
      setActiveLogs(logs);
    } catch (e) {
      console.error("Error loading Core X logs:", e);
    }
  };

  const handleSaveConfig = async (newConfig) => {
    const cxId = newConfig.id || `cx_${Date.now()}`;
    await saveCoreXConfig(user.uid, cxId, newConfig);
    await loadConfigs();
    setViewState('list');
  };

  const handleSaveLog = async (logData) => {
    const todayStr = new Date().toISOString().split('T')[0];
    await saveCoreXLog(user.uid, activeConfig.id, todayStr, logData);
    const logs = await getCoreXLogs(user.uid, activeConfig.id);
    setActiveLogs(logs);
  };

  if (loading) {
    return (
      <div className="p-4 bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-center shadow-2xs mt-4">
        <span className="text-xs font-bold text-slate-400 animate-pulse">Loading Core X...</span>
      </div>
    );
  }

  return (
    <div className="w-full mt-6 space-y-3 animate-in fade-in duration-200">
      
      {/* ── SECTION HEADER (CLEAN PHOSPHOR VECTOR ICON, NO TEXT OVERLAP) ── */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Atom size={18} weight="bold" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                Core X
              </h2>
              <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[9.5px] font-black uppercase px-1.5 py-0.2 rounded-md">
                Intelligence
              </span>
            </div>
            <p className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate mt-0.5">
              Map and analyze the hidden factors that influence your habit.
            </p>
          </div>
        </div>

        {viewState === 'list' && (
          <button
            type="button"
            onClick={() => setViewState('builder')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
          >
            <Plus size={13} weight="bold" />
            <span>New</span>
          </button>
        )}
      </div>

      {/* ── LIST VIEW ── */}
      {viewState === 'list' && (
        <div className="space-y-2.5">
          {configs.length === 0 ? (
            /* Sleek Empty State Card */
            <div 
              onClick={() => setViewState('builder')}
              className="bg-white dark:bg-[#131722] border border-dashed border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 rounded-2xl p-5 text-center cursor-pointer transition-all group shadow-2xs"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                <Plus size={20} weight="bold" />
              </div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Create Your First Core X
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-0.5">
                Map influencing factors (Coffee, Milk, Screen Time, etc.) and unlock personal habit correlations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {configs.map(c => (
                <div
                  key={c.id}
                  onClick={() => openDashboard(c)}
                  className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between cursor-pointer hover:border-purple-400 dark:hover:border-purple-600 transition-all group shadow-2xs gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: c.color || '#6366f1' }}
                    >
                      <CoreXIcon name={c.icon || 'Atom'} size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {c.name}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 truncate">
                        Target: {c.outcome?.label || 'Outcome'} · {c.factors?.length || 0} factors
                      </p>
                    </div>
                  </div>

                  <div className="w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-purple-600 transition-colors shrink-0">
                    <CaretRight size={13} weight="bold" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BUILDER MODAL (STEP-BY-STEP WIZARD) ── */}
      {viewState === 'builder' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <MobileBuilder 
            existingConfig={activeConfig}
            onSave={handleSaveConfig}
            onCancel={() => setViewState('list')}
          />
        </div>
      )}

      {/* ── DASHBOARD VIEW (TRACKING & INSIGHTS) ── */}
      {viewState === 'dashboard' && activeConfig && (
        <div className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs animate-in fade-in duration-150">
          
          {/* Dashboard Header */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setViewState('list')}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft size={14} weight="bold" />
              </button>
              
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                style={{ backgroundColor: activeConfig.color || '#6366f1' }}
              >
                <CoreXIcon name={activeConfig.icon || 'Atom'} size={15} />
              </div>

              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                  {activeConfig.name}
                </h3>
                <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 truncate">
                  Target: {activeConfig.outcome?.label}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Edit Schema Button */}
              <button
                type="button"
                onClick={() => setViewState('builder')}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer text-[11px] font-bold flex items-center gap-1"
                title="Edit Factors & Properties"
              >
                <PencilSimple size={13} weight="bold" />
                <span className="hidden sm:inline">Edit Setup</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation (Track Daily vs Insights) */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => setDashboardTab('track')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                dashboardTab === 'track'
                  ? 'bg-white dark:bg-[#131722] text-purple-600 dark:text-purple-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <CalendarCheck size={14} weight="bold" /> Daily Check-In
            </button>
            <button
              type="button"
              onClick={() => setDashboardTab('insights')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                dashboardTab === 'insights'
                  ? 'bg-white dark:bg-[#131722] text-purple-600 dark:text-purple-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ChartLineUp size={14} weight="bold" /> Analyzer & Insights
            </button>
          </div>

          {/* Active Tab Content */}
          {dashboardTab === 'track' && (
            <DailyCheckIn 
              config={activeConfig}
              dateStr={new Date().toISOString().split('T')[0]}
              existingLog={activeLogs.find(l => l.date === new Date().toISOString().split('T')[0])}
              yesterdayLog={activeLogs.find(l => {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                return l.date === y.toISOString().split('T')[0];
              })}
              onSave={handleSaveLog}
            />
          )}

          {dashboardTab === 'insights' && (
            <InsightsDashboard 
              config={activeConfig}
              logs={activeLogs}
              canExport={canExport}
            />
          )}

        </div>
      )}

    </div>
  );
}
