import React, { useState } from 'react';
import CoreXIcon from './CoreXIcon';
import { PROPERTY_TYPES, OUTCOME_TIMING } from '../config/constants';
import { Check, X, Sparkle, Clock, Calendar, ArrowCounterClockwise, CheckCircle } from '@phosphor-icons/react';

const getRatingDescriptor = (val) => {
  const num = Number(val);
  if (!num) return { label: 'Not Set', color: 'text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
  if (num <= 2) return { label: 'Critical / Struggle', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900' };
  if (num <= 4) return { label: 'Below Average', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900' };
  if (num <= 6) return { label: 'Moderate / Fair', color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-900' };
  if (num <= 8) return { label: 'Good / Solid', color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900' };
  return { label: 'Outstanding / Peak', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900' };
};

export default function DailyCheckIn({ config, dateStr, existingLog, yesterdayLog, onSave }) {
  const [outcome, setOutcome] = useState(existingLog?.outcome ?? '');
  const [yesterdayOutcome, setYesterdayOutcome] = useState(yesterdayLog?.outcome ?? '');
  const [factors, setFactors] = useState(existingLog?.factors || {});
  const [validationErrors, setValidationErrors] = useState([]);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isNextDay = config?.outcome?.timing === OUTCOME_TIMING.NEXT_DAY;
  const currentOutcomeVal = isNextDay ? yesterdayOutcome : outcome;
  const ratingInfo = getRatingDescriptor(currentOutcomeVal);

  const validateForm = () => {
    const errors = [];
    const currentOutcome = isNextDay ? yesterdayOutcome : outcome;

    if (currentOutcome === '' || currentOutcome === null || currentOutcome === undefined) {
      errors.push(`Please rate ${isNextDay ? "Yesterday's Morning Outcome" : "Today's Target Outcome"} (${config?.outcome?.label || 'Outcome'}) from 1 to 10`);
    }

    const activeFactors = (config?.factors || []).filter(f => f.active !== false);
    for (const factor of activeFactors) {
      const factorData = factors[factor.id];
      if (!factorData || (factorData.had !== true && factorData.had !== false)) {
        errors.push(`Please select Yes or No for "${factor.name}"`);
        continue;
      }

      if (factorData.had === true && factor.properties && factor.properties.length > 0) {
        for (const prop of factor.properties) {
          const val = factorData[prop.id];
          if (val === undefined || val === null || val === '' || val === '--:--') {
            errors.push(`Please provide "${prop.label}" for ${factor.name}`);
          }
          if (prop.subProperties && prop.subProperties.length > 0) {
            for (const sub of prop.subProperties) {
              const subVal = factorData[sub.id];
              if (subVal === undefined || subVal === null || subVal === '' || subVal === '--:--') {
                errors.push(`Please provide "${sub.label}" for ${factor.name}`);
              }
            }
          }
        }
      }
    }

    return errors;
  };

  const handleManualSave = async () => {
    setAttemptedSave(true);
    const errors = validateForm();
    setValidationErrors(errors);
    if (errors.length > 0) {
      if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
      return;
    }

    setIsSaving(true);
    try {
      const targetOutcome = isNextDay ? yesterdayOutcome : outcome;
      await onSave({
        outcome: targetOutcome === '' || targetOutcome === null ? null : Number(targetOutcome),
        factors
      });
      if (navigator.vibrate) navigator.vibrate(30);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Error saving check-in:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFactorGate = (factorId, val) => {
    setFactors(prev => ({
      ...prev,
      [factorId]: {
        ...(prev[factorId] || {}),
        had: val
      }
    }));
    if (attemptedSave) {
      setValidationErrors(validateForm());
    }
  };

  const updateProperty = (factorId, propId, val) => {
    setFactors(prev => ({
      ...prev,
      [factorId]: {
        ...(prev[factorId] || {}),
        [propId]: val
      }
    }));
    if (attemptedSave) {
      setValidationErrors(validateForm());
    }
  };

  const copyYesterdayValues = () => {
    if (yesterdayLog?.factors) {
      setFactors(JSON.parse(JSON.stringify(yesterdayLog.factors)));
    }
  };

  const activeFactors = (config?.factors || []).filter(f => f.active !== false);
  const isOutcomeMissing = attemptedSave && (currentOutcomeVal === '' || currentOutcomeVal === null || currentOutcomeVal === undefined);

  return (
    <div className="bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4 max-w-xl mx-auto animate-in fade-in duration-150">
      
      {/* ── TOP HEADER: DATE & QUICK ACTIONS ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
            <Calendar size={16} weight="bold" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
              {dateStr || 'Today'}
            </h2>
            <p className="text-[10.5px] text-slate-400 font-medium">Daily Performance Log</p>
          </div>
        </div>
        
        {yesterdayLog && (
          <button
            type="button"
            onClick={copyYesterdayValues}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer active:scale-95"
          >
            <ArrowCounterClockwise size={13} weight="bold" />
            <span>Same as yesterday</span>
          </button>
        )}
      </div>

      {/* ── DASHED SEPARATOR ── */}
      <div className="border-t border-dashed border-slate-200/90 dark:border-slate-800" />

      {/* ── SECTION 1: TARGET / PRIMARY OUTCOME RATING (1-10 SLIDER & SCORE PILLS) ── */}
      <div className={`space-y-3 p-3 rounded-2xl transition-all ${
        isOutcomeMissing ? 'bg-rose-50/40 dark:bg-rose-950/20 ring-1 ring-rose-500/50' : 'bg-slate-50/60 dark:bg-slate-800/40'
      }`}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              {isNextDay ? "Morning Outcome (Previous Night)" : "Today's Target Outcome"}
            </span>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
              {config?.outcome?.label || config?.name || 'Primary Outcome'}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {currentOutcomeVal ? (
              <span className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 ${ratingInfo.color}`}>
                <span className="text-sm font-black">{currentOutcomeVal}</span>
                <span className="text-[10px] opacity-75">/ 10</span>
                <span className="text-[10px] font-bold">· {ratingInfo.label}</span>
              </span>
            ) : (
              <span className="text-[11px] font-bold text-slate-400 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                Rate 1 to 10
              </span>
            )}
          </div>
        </div>

        {/* 1 to 10 Interactive Drag Range Slider */}
        <div className="space-y-2 pt-1">
          <div className="relative flex items-center px-1">
            <input 
              type="range"
              min="1"
              max="10"
              step="1"
              value={currentOutcomeVal || 5}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (isNextDay) setYesterdayOutcome(val);
                else setOutcome(val);
                if (attemptedSave) setValidationErrors(validateForm());
              }}
              className="w-full h-2.5 bg-gradient-to-r from-rose-500 via-amber-400 via-sky-400 to-emerald-500 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-white"
            />
          </div>

          {/* 10 Numbered Clickable Pills */}
          <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
              const isSelected = Number(currentOutcomeVal) === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    if (isNextDay) setYesterdayOutcome(num);
                    else setOutcome(num);
                    if (attemptedSave) setValidationErrors(validateForm());
                  }}
                  className={`py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer text-center ${
                    isSelected 
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md scale-105 ring-2 ring-slate-900/20 dark:ring-white/20' 
                      : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── DASHED SEPARATOR ── */}
      <div className="border-t border-dashed border-slate-200/90 dark:border-slate-800" />

      {/* ── SECTION 2: DAILY INFLUENCING FACTORS (CLEAN ROWS SEPARATED BY DASHED LINES) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Daily Influencing Factors
          </span>
          <span className="text-[10.5px] text-slate-400 font-medium">
            Fill each factor below
          </span>
        </div>

        <div className="space-y-1">
          {activeFactors.map((factor, fIdx) => {
            const factorData = factors[factor.id] || {};
            const isYes = factorData.had === true;
            const isNo = factorData.had === false;
            const isGateMissing = attemptedSave && (factorData.had !== true && factorData.had !== false);

            return (
              <div key={factor.id}>
                {fIdx > 0 && (
                  <div className="border-t border-dashed border-slate-200/80 dark:border-slate-800/80 my-3" />
                )}

                <div className="space-y-2.5">
                  {/* Factor Header Row (Clean flat item without outer box) */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs transition-transform"
                        style={{ backgroundColor: factor.color || '#6366f1' }}
                      >
                        <CoreXIcon name={factor.icon || 'Sparkle'} size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className={`text-xs font-black block truncate ${isGateMissing ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                          {factor.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {factor.properties?.length ? `${factor.properties.length} metrics` : 'Gate only'}
                        </span>
                      </div>
                    </div>

                    {/* Yes / No Segmented Button */}
                    <div className={`flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border shrink-0 ${
                      isGateMissing ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-slate-200/80 dark:border-slate-700'
                    }`}>
                      <button
                        type="button"
                        onClick={() => toggleFactorGate(factor.id, true)}
                        className={`px-3.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          isYes 
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFactorGate(factor.id, false)}
                        className={`px-3.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          isNo 
                            ? 'bg-rose-500 text-white shadow-2xs' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {/* Properties Expandable Area if YES */}
                  {isYes && factor.properties && factor.properties.length > 0 && (
                    <div className="pl-4 ml-3.5 border-l-2 border-dashed border-slate-200 dark:border-slate-800 space-y-2.5 pt-1.5 animate-in slide-in-from-top-1">
                      {factor.properties.map(prop => {
                        const propVal = factorData[prop.id];
                        const isPropMissing = attemptedSave && (propVal === undefined || propVal === null || propVal === '' || propVal === '--:--');

                        return (
                          <div key={prop.id} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-3 text-xs">
                              <span className={`font-bold text-xs ${isPropMissing ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-slate-700 dark:text-slate-300'}`}>
                                {prop.label}
                              </span>

                              {/* Number with Stepper */}
                              {prop.type === PROPERTY_TYPES.NUMBER && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const current = Number(factorData[prop.id] || 0);
                                      updateProperty(factor.id, prop.id, Math.max(0, current - 1));
                                    }}
                                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-black text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer active:scale-95 transition-colors"
                                  >
                                    -
                                  </button>
                                  <input 
                                    type="number"
                                    value={factorData[prop.id] ?? ''}
                                    onChange={e => updateProperty(factor.id, prop.id, Number(e.target.value))}
                                    className={`w-14 bg-slate-50 dark:bg-slate-800 border rounded-lg py-1 text-center text-xs font-bold outline-none ${
                                      isPropMissing ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-700'
                                    }`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const current = Number(factorData[prop.id] || 0);
                                      updateProperty(factor.id, prop.id, current + 1);
                                    }}
                                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-black text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer active:scale-95 transition-colors"
                                  >
                                    +
                                  </button>
                                  {prop.unit && <span className="text-[10px] font-bold text-slate-400 pl-0.5">{prop.unit}</span>}
                                </div>
                              )}

                              {/* Native Time Picker */}
                              {prop.type === PROPERTY_TYPES.TIME && (
                                <input 
                                  type="time"
                                  value={factorData[prop.id] || ''}
                                  onChange={e => updateProperty(factor.id, prop.id, e.target.value)}
                                  className={`bg-slate-50 dark:bg-slate-800 border rounded-lg px-2.5 py-1 text-xs font-bold outline-none ${
                                    isPropMissing ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-700'
                                  }`}
                                />
                              )}

                              {/* Yes/No Selector */}
                              {prop.type === PROPERTY_TYPES.YESNO && (
                                <select
                                  value={factorData[prop.id] === undefined ? '' : String(factorData[prop.id])}
                                  onChange={e => updateProperty(factor.id, prop.id, e.target.value === 'true')}
                                  className={`bg-slate-50 dark:bg-slate-800 border rounded-lg px-2.5 py-1 text-xs font-bold outline-none ${
                                    isPropMissing ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  <option value="">Select...</option>
                                  <option value="true">Yes</option>
                                  <option value="false">No</option>
                                </select>
                              )}

                              {/* Choice */}
                              {prop.type === PROPERTY_TYPES.CHOICE && (
                                <select
                                  value={factorData[prop.id] || ''}
                                  onChange={e => updateProperty(factor.id, prop.id, e.target.value)}
                                  className={`bg-slate-50 dark:bg-slate-800 border rounded-lg px-2.5 py-1 text-xs font-bold outline-none ${
                                    isPropMissing ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  <option value="">Select...</option>
                                  {prop.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              )}

                              {/* Rating (1-10) */}
                              {prop.type === PROPERTY_TYPES.RATING && (
                                <select
                                  value={factorData[prop.id] || ''}
                                  onChange={e => updateProperty(factor.id, prop.id, Number(e.target.value))}
                                  className={`bg-slate-50 dark:bg-slate-800 border rounded-lg px-2.5 py-1 text-xs font-bold outline-none ${
                                    isPropMissing ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  <option value="">Score (1-10)...</option>
                                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} / 10</option>)}
                                </select>
                              )}
                            </div>

                            {/* Mini Properties (Sub-properties) rendered seamlessly below */}
                            {prop.subProperties && prop.subProperties.length > 0 && (
                              <div className="pl-3.5 ml-1.5 border-l-2 border-slate-100 dark:border-slate-800/80 space-y-1.5 pt-1">
                                {prop.subProperties.map(sub => {
                                  const subVal = factorData[sub.id];
                                  const isSubMissing = attemptedSave && (subVal === undefined || subVal === null || subVal === '' || subVal === '--:--');

                                  return (
                                    <div key={sub.id} className="flex items-center justify-between gap-2 text-xs">
                                      <span className={`text-[11px] font-medium ${isSubMissing ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                                        ↳ {sub.label}
                                      </span>

                                      {/* Mini Number */}
                                      {sub.type === PROPERTY_TYPES.NUMBER && (
                                        <div className="flex items-center gap-1">
                                          <input 
                                            type="number"
                                            value={factorData[sub.id] ?? ''}
                                            onChange={e => updateProperty(factor.id, sub.id, Number(e.target.value))}
                                            className={`w-14 bg-slate-50 dark:bg-slate-800 border rounded-lg py-0.5 text-center text-xs font-bold outline-none ${
                                              isSubMissing ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-700'
                                            }`}
                                          />
                                          {sub.unit && <span className="text-[9px] font-bold text-slate-400">{sub.unit}</span>}
                                        </div>
                                      )}

                                      {/* Mini Time */}
                                      {sub.type === PROPERTY_TYPES.TIME && (
                                        <input 
                                          type="time"
                                          value={factorData[sub.id] || ''}
                                          onChange={e => updateProperty(factor.id, sub.id, e.target.value)}
                                          className={`bg-slate-50 dark:bg-slate-800 border rounded-lg px-2 py-0.5 text-xs font-bold outline-none ${
                                            isSubMissing ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-700'
                                          }`}
                                        />
                                      )}

                                      {/* Mini Yes/No */}
                                      {sub.type === PROPERTY_TYPES.YESNO && (
                                        <select
                                          value={factorData[sub.id] === undefined ? '' : String(factorData[sub.id])}
                                          onChange={e => updateProperty(factor.id, sub.id, e.target.value === 'true')}
                                          className={`bg-slate-50 dark:bg-slate-800 border rounded-lg px-2 py-0.5 text-[11px] font-bold outline-none ${
                                            isSubMissing ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-700'
                                          }`}
                                        >
                                          <option value="">...</option>
                                          <option value="true">Yes</option>
                                          <option value="false">No</option>
                                        </select>
                                      )}

                                      {/* Mini Choice */}
                                      {sub.type === PROPERTY_TYPES.CHOICE && (
                                        <select
                                          value={factorData[sub.id] || ''}
                                          onChange={e => updateProperty(factor.id, sub.id, e.target.value)}
                                          className={`bg-slate-50 dark:bg-slate-800 border rounded-lg px-2 py-0.5 text-[11px] font-bold outline-none ${
                                            isSubMissing ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-700'
                                          }`}
                                        >
                                          <option value="">...</option>
                                          {sub.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                      )}

                                      {/* Mini Rating */}
                                      {sub.type === PROPERTY_TYPES.RATING && (
                                        <select
                                          value={factorData[sub.id] || ''}
                                          onChange={e => updateProperty(factor.id, sub.id, Number(e.target.value))}
                                          className={`bg-slate-50 dark:bg-slate-800 border rounded-lg px-2 py-0.5 text-[11px] font-bold outline-none ${
                                            isSubMissing ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-700'
                                          }`}
                                        >
                                          <option value="">...</option>
                                          {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}/10</option>)}
                                        </select>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── VALIDATION ERROR BANNER ── */}
      {attemptedSave && validationErrors.length > 0 && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl space-y-1.5 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-black">
            <X size={16} weight="bold" />
            <span>Please complete all required fields ({validationErrors.length} remaining):</span>
          </div>
          <ul className="text-[11px] text-rose-600 dark:text-rose-300 font-medium list-disc list-inside space-y-0.5 max-h-28 overflow-y-auto">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── DASHED SEPARATOR ── */}
      <div className="border-t border-dashed border-slate-200/90 dark:border-slate-800" />

      {/* ── BOTTOM ACTIONS & MANUAL SAVE BUTTON ── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="min-w-0">
          {saveSuccess && (
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in zoom-in-95">
              <CheckCircle size={16} weight="fill" />
              <span>Saved Successfully!</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleManualSave}
          disabled={isSaving}
          className={`px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 shadow-md cursor-pointer ml-auto active:scale-98 ${
            saveSuccess
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900'
          } ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : saveSuccess ? (
            <>
              <Check size={16} weight="bold" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Check size={16} weight="bold" />
              <span>Save Check-in</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
