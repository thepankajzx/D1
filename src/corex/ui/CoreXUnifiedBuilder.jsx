import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getCoreXConfigs, saveCoreXConfig } from '../data/schema';
import CoreYFlowCanvas from '../../corey/ui/CoreYFlowCanvas';
import MobileBuilder from './MobileBuilder';
import { 
  TreeStructure, 
  SlidersHorizontal, 
  ArrowLeft, 
  DeviceMobile, 
  Desktop, 
  Info, 
  X,
  Sparkle
} from '@phosphor-icons/react';

export default function CoreXUnifiedBuilder({ onExitFullscreen }) {
  const { currentUser: user } = useAuth();
  const { isHinglish } = useLanguage();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Auto-detect optimal default view based on screen size
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 ? 'canvas' : 'list';
    }
    return 'canvas';
  });

  const [showDeviceTip, setShowDeviceTip] = useState(true);

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
      setConfigs(data || []);
    } catch (e) {
      console.error("Error loading Core X config:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (newConfig) => {
    if (!user) return;
    const cxId = newConfig.id || `cx_${Date.now()}`;
    await saveCoreXConfig(user.uid, cxId, newConfig);
    await loadConfigs();
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#fafafc] dark:bg-[#0c0e15]">
        <div className="text-xs font-black text-slate-400 animate-pulse flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
          <span>Loading Core X Builder...</span>
        </div>
      </div>
    );
  }

  const currentConfig = configs[0] || null;

  return (
    <div className="fixed inset-0 z-[999999] bg-[#fafafc] dark:bg-[#0c0e15] w-screen h-screen flex flex-col overflow-hidden select-none font-sans">
      
      {/* ── TOP UNIFIED SWITCHER BAR ── */}
      <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#131722]/95 backdrop-blur-md flex items-center justify-between gap-2.5 sm:gap-4 shrink-0 z-50">
        
        {/* Left: Back Button & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onExitFullscreen}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors shrink-0"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Back</span>
          </button>

          <div className="min-w-0 hidden xs:block">
            <h1 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight truncate flex items-center gap-1.5">
              <span>Core X Builder</span>
            </h1>
          </div>
        </div>

        {/* Center: View Switcher (Tree Canvas ↔ List View) */}
        <div className="flex items-center p-0.5 sm:p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 shrink-0 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(20);
              setViewMode('canvas');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'canvas'
                ? 'bg-white dark:bg-[#131722] text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TreeStructure size={14} weight="bold" />
            <span>Tree Canvas</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(20);
              setViewMode('list');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white dark:bg-[#131722] text-purple-600 dark:text-purple-400 shadow-xs ring-1 ring-purple-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <SlidersHorizontal size={14} weight="bold" />
            <span>List View</span>
          </button>
        </div>

        {/* Right: Close Button */}
        <button
          type="button"
          onClick={onExitFullscreen}
          className="px-3 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors shrink-0 cursor-pointer"
        >
          Close
        </button>
      </div>

      {/* ── DEVICE RECOMMENDATION BANNER ── */}
      {showDeviceTip && (
        <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-emerald-500/10 border-b border-purple-500/20 px-3 sm:px-5 py-1.5 flex items-center justify-between gap-2 text-[10.5px] sm:text-xs text-slate-700 dark:text-slate-300 shrink-0 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 shrink-0">
              <Info size={14} weight="bold" />
              <span>{isHinglish ? 'सुझाव:' : 'Tip:'}</span>
            </span>
            <span className="truncate">
              {isHinglish 
                ? 'बड़ी स्क्रीन (Desktop/Tablet) पर ट्री कैनवस सबसे अच्छा काम करता है, जबकि फोन पर लिस्ट व्यू तेज़ है।' 
                : 'Tree Canvas is ideal for larger screens & tablets; List view is optimized for phone screens.'}
            </span>
          </div>
          <button 
            type="button" 
            onClick={() => setShowDeviceTip(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer shrink-0"
            title="Dismiss tip"
          >
            <X size={13} weight="bold" />
          </button>
        </div>
      )}

      {/* ── MAIN WORKSPACE CONTENT ── */}
      <div className="flex-1 w-full h-full overflow-hidden relative">
        {viewMode === 'canvas' ? (
          <CoreYFlowCanvas 
            initialConfig={currentConfig}
            onSave={handleSaveConfig}
            isFullscreen={true}
            onExitFullscreen={onExitFullscreen}
          />
        ) : (
          <div className="w-full h-full overflow-y-auto p-3 sm:p-6 pb-24 max-w-2xl mx-auto">
            <MobileBuilder 
              existingConfig={currentConfig}
              onSave={handleSaveConfig}
              onCancel={onExitFullscreen}
            />
          </div>
        )}
      </div>

    </div>
  );
}
