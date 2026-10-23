import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getCoreXConfigs, saveCoreXConfig } from '../../corex/data/schema';
import CoreYFlowCanvas from './CoreYFlowCanvas';
import { TreeStructure, Sparkle } from '@phosphor-icons/react';

export default function CoreYSection() {
  const { currentUser: user } = useAuth();
  const [configs, setConfigs] = useState([]);
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
    } catch (e) {
      console.error("Error loading Core Y config:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (newConfig) => {
    if (!user) return;
    const cxId = newConfig.id || `cy_${Date.now()}`;
    await saveCoreXConfig(user.uid, cxId, newConfig);
    await loadConfigs();
  };

  if (loading) return null;

  return (
    <div className="w-full mt-10 space-y-3 animate-in fade-in duration-300">
      
      {/* ── SECTION HEADER FOR CORE Y ── */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs font-serif font-black">
            <TreeStructure size={18} weight="bold" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                Core Y
              </h2>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9.5px] font-black uppercase px-1.5 py-0.2 rounded-md">
                Visual Flow Canvas
              </span>
            </div>
            <p className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate mt-0.5">
              Interactive node-tree flow builder (as shown in your reference image).
            </p>
          </div>
        </div>
      </div>

      {/* ── THE VISUAL FLOW BUILDER CANVAS ── */}
      <CoreYFlowCanvas 
        initialConfig={configs[0] || null}
        onSave={handleSaveConfig}
      />

    </div>
  );
}
