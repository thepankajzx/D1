import React, { useState } from 'react';
import { COREX_TEMPLATES, PROPERTY_TYPES, OUTCOME_TIMING, PRESET_FACTOR_SUGGESTIONS } from '../config/constants';
import CoreXIcon from './CoreXIcon';
import { Plus, Trash, X, Check, Sparkle, CaretDown, SlidersHorizontal, ArrowLeft } from '@phosphor-icons/react';

export default function MobileBuilder({ existingConfig, onSave, onCancel }) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState(existingConfig ? JSON.parse(JSON.stringify(existingConfig)) : JSON.parse(JSON.stringify(COREX_TEMPLATES.SLEEP)));
  const [customFactorName, setCustomFactorName] = useState('');
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [selectedFactorIndex, setSelectedFactorIndex] = useState(null);
  const [newPropLabel, setNewPropLabel] = useState('');
  const [newPropType, setNewPropType] = useState(PROPERTY_TYPES.NUMBER);
  const [newPropUnit, setNewPropUnit] = useState('');

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const handleOutcomeChange = (key, value) => {
    setConfig(c => ({
      ...c,
      outcome: { ...c.outcome, [key]: value }
    }));
  };

  const applyTemplate = (tplKey) => {
    const tpl = COREX_TEMPLATES[tplKey];
    if (tpl) {
      setConfig(JSON.parse(JSON.stringify(tpl)));
    }
  };

  const addPresetFactor = (preset) => {
    const newFactor = {
      id: `factor_${Date.now()}`,
      name: preset.name,
      icon: preset.icon,
      color: preset.color || '#6366f1',
      active: true,
      order: config.factors.length + 1,
      properties: preset.defaultProps.map((p, idx) => ({
        id: `prop_${Date.now()}_${idx}`,
        ...p,
        order: idx + 1
      }))
    };
    setConfig(c => ({ ...c, factors: [...c.factors, newFactor] }));
    setShowPresetMenu(false);
  };

  const addCustomFactor = () => {
    if (!customFactorName.trim()) return;
    const newFactor = {
      id: `factor_${Date.now()}`,
      name: customFactorName.trim(),
      icon: 'Sparkle',
      color: '#6366f1',
      active: true,
      order: config.factors.length + 1,
      properties: [
        { id: `prop_${Date.now()}_1`, label: 'Quantity / Time', type: PROPERTY_TYPES.NUMBER, unit: '', order: 1 }
      ]
    };
    setConfig(c => ({ ...c, factors: [...c.factors, newFactor] }));
    setCustomFactorName('');
  };

  const removeFactor = (index) => {
    setConfig(c => ({
      ...c,
      factors: c.factors.filter((_, i) => i !== index)
    }));
  };

  const addPropertyToFactor = (factorIndex) => {
    if (!newPropLabel.trim()) return;
    const newProp = {
      id: `prop_${Date.now()}`,
      label: newPropLabel.trim(),
      type: newPropType,
      unit: newPropUnit.trim(),
      order: (config.factors[factorIndex].properties?.length || 0) + 1
    };
    const updated = [...config.factors];
    updated[factorIndex].properties = [...(updated[factorIndex].properties || []), newProp];
    setConfig(c => ({ ...c, factors: updated }));
    setNewPropLabel('');
    setNewPropUnit('');
    setSelectedFactorIndex(null);
  };

  const removeProperty = (factorIndex, propIndex) => {
    const updated = [...config.factors];
    updated[factorIndex].properties = updated[factorIndex].properties.filter((_, i) => i !== propIndex);
    setConfig(c => ({ ...c, factors: updated }));
  };

  return (
    <div className="bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full mx-auto flex flex-col overflow-hidden max-h-[85vh] animate-in zoom-in-95 duration-200">
      
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <CoreXIcon name="Atom" size={18} />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
              {existingConfig ? 'Edit Core X' : 'Build Core X'}
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {step === 1 ? 'Step 1: Define Target & Outcome' : 'Step 2: Influencing Factors & Properties'}
            </p>
          </div>
        </div>
        <button 
          onClick={onCancel} 
          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={15} weight="bold" />
        </button>
      </div>

      {/* ── STEP CONTENT (SINGLE WRAPPER, DASHED SEPARATORS, COMPACT) ── */}
      <div className="p-4 overflow-y-auto flex-1 space-y-4">
        
        {step === 1 && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            {/* Template Quick Loader */}
            <div className="p-2.5 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 rounded-xl space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1">
                <Sparkle size={12} weight="fill" /> Ready Templates
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => applyTemplate('SLEEP')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer text-center ${
                    config.name.toLowerCase().includes('sleep')
                      ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                  }`}
                >
                  🌙 Sleep Optimization
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('FOCUS')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer text-center ${
                    config.name.toLowerCase().includes('focus')
                      ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                  }`}
                >
                  🎯 Deep Focus
                </button>
              </div>
            </div>

            {/* Target Habit Name */}
            <div>
              <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1">
                Target Habit Name
              </label>
              <input 
                type="text" 
                value={config.name}
                onChange={e => setConfig({ ...config, name: e.target.value })}
                placeholder="e.g., Sleep, Focus, Workout"
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Primary Outcome Metric Box */}
            <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                  Primary Outcome Metric (What are we tracking?)
                </label>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full">
                  Analysis Target
                </span>
              </div>

              <input 
                type="text" 
                value={config.outcome.label}
                onChange={e => handleOutcomeChange('label', e.target.value)}
                placeholder="e.g. Sleep Quality, Deep Work Hours"
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-purple-500 transition-colors"
              />

              <div className="grid grid-cols-2 gap-2">
                {/* Metric Type */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Metric Type</label>
                  <select
                    value={config.outcome.type}
                    onChange={e => handleOutcomeChange('type', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none"
                  >
                    <option value={PROPERTY_TYPES.RATING}>Rating (1 - 10)</option>
                    <option value={PROPERTY_TYPES.NUMBER}>Number / Hours / Qty</option>
                    <option value={PROPERTY_TYPES.YESNO}>Yes / No</option>
                  </select>
                </div>

                {/* Timing */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Timing Logic</label>
                  <select
                    value={config.outcome.timing}
                    onChange={e => handleOutcomeChange('timing', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none"
                  >
                    <option value={OUTCOME_TIMING.NEXT_DAY}>Next Morning (e.g. Sleep)</option>
                    <option value={OUTCOME_TIMING.SAME_DAY}>Same Day (e.g. Focus)</option>
                  </select>
                </div>
              </div>

              {/* Higher is Better Toggle */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input 
                  type="checkbox" 
                  checked={config.outcome.higherIsBetter}
                  onChange={e => handleOutcomeChange('higherIsBetter', e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 accent-purple-600 cursor-pointer"
                />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Higher number is better (e.g. 10 rating is great)
                </span>
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-1 border-b border-dashed border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">Influencing Factors</h3>
                <p className="text-[10px] text-slate-500">Things that make or break your outcome.</p>
              </div>
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                {config.factors.length} / 12 factors
              </span>
            </div>

            {/* Quick Preset Factor Dropdown / Chips */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setShowPresetMenu(!showPresetMenu)}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl border border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 text-[11px] font-bold hover:bg-purple-100/50 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Plus size={13} weight="bold" /> Add from Suggested Factor Presets
                </span>
                <CaretDown size={13} weight="bold" className={`transition-transform ${showPresetMenu ? 'rotate-180' : ''}`} />
              </button>

              {showPresetMenu && (
                <div className="p-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl grid grid-cols-2 gap-1.5 animate-in fade-in duration-100">
                  {PRESET_FACTOR_SUGGESTIONS.map(p => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => addPresetFactor(p)}
                      className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200/80 dark:border-slate-600 text-left hover:border-purple-400 transition-colors text-[10.5px] font-bold text-slate-800 dark:text-slate-100 cursor-pointer truncate"
                    >
                      <CoreXIcon name={p.icon} size={14} />
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Factor Cards List (Single container, compact rows) */}
            <div className="space-y-2">
              {config.factors.map((factor, fIdx) => (
                <div 
                  key={factor.id || fIdx} 
                  className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-2.5 space-y-2 transition-all"
                >
                  {/* Factor Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <CoreXIcon name={factor.icon} size={14} />
                      </div>
                      <input 
                        type="text" 
                        value={factor.name}
                        onChange={(e) => {
                          const updated = [...config.factors];
                          updated[fIdx].name = e.target.value;
                          setConfig({ ...config, factors: updated });
                        }}
                        className="bg-transparent text-xs font-black text-slate-900 dark:text-white outline-none flex-1 truncate focus:border-b focus:border-purple-500"
                      />
                    </div>
                    
                    <button 
                      type="button"
                      onClick={() => removeFactor(fIdx)}
                      className="w-6 h-6 rounded-lg text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                      <Trash size={13} weight="bold" />
                    </button>
                  </div>

                  {/* Properties Pills with Direct Inline Add */}
                  <div className="pl-2 border-l-2 border-slate-200 dark:border-slate-700/80 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {factor.properties?.map((prop, pIdx) => (
                        <span 
                          key={prop.id || pIdx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold text-slate-700 dark:text-slate-200 shadow-2xs"
                        >
                          <span>{prop.label}</span>
                          <span className="opacity-50">({prop.type}{prop.unit ? `·${prop.unit}` : ''})</span>
                          <button 
                            type="button"
                            onClick={() => removeProperty(fIdx, pIdx)}
                            className="text-slate-400 hover:text-rose-500 ml-0.5"
                          >
                            <X size={11} weight="bold" />
                          </button>
                        </span>
                      ))}

                      {/* Dropdown Button to Add Property */}
                      <button
                        type="button"
                        onClick={() => setSelectedFactorIndex(selectedFactorIndex === fIdx ? null : fIdx)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[10px] font-black text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition-colors cursor-pointer"
                      >
                        <Plus size={11} weight="bold" /> Add Property
                      </button>
                    </div>

                    {/* Inline Property Dropdown Adder */}
                    {selectedFactorIndex === fIdx && (
                      <div className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 animate-in fade-in duration-100 shadow-sm mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <input 
                            type="text"
                            placeholder="Property Name (e.g. Quantity, Time, Rating)"
                            value={newPropLabel}
                            onChange={e => setNewPropLabel(e.target.value)}
                            className="flex-1 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-900 dark:text-white outline-none"
                          />
                          <select
                            value={newPropType}
                            onChange={e => setNewPropType(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 text-[10.5px] font-bold text-slate-900 dark:text-white outline-none"
                          >
                            <option value={PROPERTY_TYPES.NUMBER}>Number</option>
                            <option value={PROPERTY_TYPES.TIME}>Time</option>
                            <option value={PROPERTY_TYPES.RATING}>Rating (1-10)</option>
                            <option value={PROPERTY_TYPES.YESNO}>Yes / No</option>
                            <option value={PROPERTY_TYPES.CHOICE}>Choice</option>
                          </select>
                        </div>

                        {newPropType === PROPERTY_TYPES.NUMBER && (
                          <input 
                            type="text"
                            placeholder="Unit (e.g. cups, ml, min, mg)"
                            value={newPropUnit}
                            onChange={e => setNewPropUnit(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 text-[10.5px] font-bold text-slate-900 dark:text-white outline-none"
                          />
                        )}

                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedFactorIndex(null)}
                            className="px-2.5 py-1 rounded-md text-[10.5px] font-bold text-slate-500 hover:text-slate-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => addPropertyToFactor(fIdx)}
                            className="px-3 py-1 rounded-md bg-purple-600 text-white text-[10.5px] font-bold hover:bg-purple-700 shadow-2xs"
                          >
                            Save Property
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Custom Factor Input */}
            <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 flex gap-2">
              <input 
                type="text"
                placeholder="Or type custom factor name..."
                value={customFactorName}
                onChange={e => setCustomFactorName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomFactor()}
                className="flex-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none"
              />
              <button
                type="button"
                onClick={addCustomFactor}
                className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 shrink-0 cursor-pointer shadow-2xs"
              >
                + Add
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── FOOTER ACTIONS (COMPACT, NO OVERLAP) ── */}
      <div className="p-3 bg-slate-50 dark:bg-[#151a26] border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
        {step > 1 ? (
          <button 
            type="button"
            onClick={prevStep}
            className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={13} weight="bold" /> Back
          </button>
        ) : (
          <button 
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Cancel
          </button>
        )}

        {step < 2 ? (
          <button 
            type="button"
            onClick={nextStep}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer ml-auto"
          >
            Next: Add Factors →
          </button>
        ) : (
          <button 
            type="button"
            onClick={() => onSave(config)}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer ml-auto"
          >
            <Check size={14} weight="bold" /> Save Core X Configuration
          </button>
        )}
      </div>

    </div>
  );
}
