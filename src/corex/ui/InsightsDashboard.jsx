import React, { useMemo, useState } from 'react';
import { runAnalyzer } from '../analyzer/engine';
import CoreXIcon from './CoreXIcon';
import { exportCoreXToExcel } from '../export/excelBuilder';
import { 
  CheckCircle, 
  WarningCircle, 
  Info, 
  DownloadSimple, 
  Lock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkle, 
  Table, 
  ChartLineUp 
} from '@phosphor-icons/react';

export default function InsightsDashboard({ config, logs = [], canExport = true }) {
  const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'raw_data'
  const [isExporting, setIsExporting] = useState(false);

  const analysis = useMemo(() => {
    return runAnalyzer(config, logs);
  }, [config, logs]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportCoreXToExcel(config, logs);
    } catch (e) {
      console.error("Export error:", e);
    } finally {
      setIsExporting(false);
    }
  };

  if (analysis.error === 'not_enough_data') {
    return (
      <div className="p-6 bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-center space-y-3 shadow-2xs max-w-xl mx-auto">
        <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mx-auto">
          <ChartLineUp size={24} weight="bold" />
        </div>
        <div>
          <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">Building Intelligence...</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            Rule-based correlations unlock after at least 5 logged days. Currently tracked: <span className="font-bold text-purple-600">{analysis.days} / 5 days</span>.
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden max-w-xs mx-auto">
          <div 
            className="bg-purple-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (analysis.days / 5) * 100)}%` }}
          />
        </div>
      </div>
    );
  }

  const { insights, days, confidence } = analysis;

  const confidenceBadge = {
    early_signal: { text: 'Early Signal (<14 Days)', color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50' },
    building: { text: 'Building Pattern (14-29 Days)', color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50' },
    reliable: { text: 'Reliable Correlation (30+ Days)', color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50' }
  }[confidence];

  const helps = insights.filter(i => i.verdict === 'helps');
  const hurts = insights.filter(i => i.verdict === 'hurts');

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-in fade-in duration-150">
      
      {/* ── SUB-TABS (INSIGHTS VS RAW DATA) ── */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => setActiveTab('insights')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'insights'
              ? 'bg-white dark:bg-[#131722] text-purple-600 dark:text-purple-400 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Sparkle size={13} weight="fill" /> Rule-based Insights
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('raw_data')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'raw_data'
              ? 'bg-white dark:bg-[#131722] text-purple-600 dark:text-purple-400 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Table size={13} weight="bold" /> Tracked History
        </button>
      </div>

      {activeTab === 'insights' && (
        <div className="space-y-3.5">
          {/* Confidence Status Header */}
          <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] font-bold ${confidenceBadge.color}`}>
            <span className="flex items-center gap-1.5">
              <Info size={14} weight="bold" /> {confidenceBadge.text}
            </span>
            <span>{days} days analyzed</span>
          </div>

          {/* Helps Section */}
          {helps.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                <ArrowUpRight size={14} weight="bold" /> What's Working Well (Helps)
              </h4>
              {helps.map(insight => (
                <div 
                  key={insight.factorId}
                  className="bg-emerald-50/30 dark:bg-emerald-950/15 border border-emerald-200/80 dark:border-emerald-900/40 rounded-xl p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <CoreXIcon name={insight.factorIcon} size={13} />
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {insight.factorName}
                      </span>
                    </div>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      +{insight.delta.toFixed(1)} {config.outcome.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                    Avg <span className="font-bold">{insight.meanWith.toFixed(1)}</span> on days with {insight.factorName} vs <span className="font-bold">{insight.meanWithout.toFixed(1)}</span> without ({insight.daysWith} vs {insight.daysWithout} days).
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Hurts Section */}
          {hurts.length > 0 && (
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                <ArrowDownRight size={14} weight="bold" /> What Might Be Hurting
              </h4>
              {hurts.map(insight => (
                <div 
                  key={insight.factorId}
                  className="bg-rose-50/30 dark:bg-rose-950/15 border border-rose-200/80 dark:border-rose-900/40 rounded-xl p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                        <CoreXIcon name={insight.factorIcon} size={13} />
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {insight.factorName}
                      </span>
                    </div>
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-100/70 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                      {insight.delta.toFixed(1)} {config.outcome.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                    Avg <span className="font-bold">{insight.meanWith.toFixed(1)}</span> when {insight.factorName} is present vs <span className="font-bold">{insight.meanWithout.toFixed(1)}</span> without.
                  </p>
                </div>
              ))}
            </div>
          )}

          {helps.length === 0 && hurts.length === 0 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-500">
              No strong variance detected yet across factor gates. Keep logging daily!
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[10px] text-slate-400 text-center italic">
            * Based on observed deterministic correlations. Not medical advice.
          </p>
        </div>
      )}

      {activeTab === 'raw_data' && (
        <div className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3 space-y-2 overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                <th className="pb-2">Date</th>
                <th className="pb-2 text-center">{config.outcome.label}</th>
                {config.factors.filter(f => f.active).map(f => (
                  <th key={f.id} className="pb-2 text-center truncate max-w-[80px]">{f.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {[...logs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15).map(log => (
                <tr key={log.date} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="py-2 font-bold text-slate-700 dark:text-slate-300">{log.date}</td>
                  <td className="py-2 text-center font-black text-purple-600 dark:text-purple-400">
                    {log.outcome ?? '-'}
                  </td>
                  {config.factors.filter(f => f.active).map(f => {
                    const had = log.factors?.[f.id]?.had;
                    return (
                      <td key={f.id} className="py-2 text-center">
                        {had === true ? (
                          <span className="text-emerald-600 font-bold">Yes</span>
                        ) : had === false ? (
                          <span className="text-slate-400">No</span>
                        ) : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <p className="text-center py-4 text-xs text-slate-400">No logs tracked yet.</p>
          )}
        </div>
      )}

      {/* ── CLIENT-SIDE EXCEL EXPORT BUTTON ── */}
      <div className="pt-2">
        {canExport ? (
          <button
            type="button"
            disabled={isExporting || logs.length === 0}
            onClick={handleExport}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <DownloadSimple size={14} weight="bold" />
            {isExporting ? 'Generating Excel...' : 'Export Raw Data to Excel (.xlsx)'}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <Lock size={13} weight="bold" /> Export unlocks after 30 days of logging
          </button>
        )}
      </div>

    </div>
  );
}
