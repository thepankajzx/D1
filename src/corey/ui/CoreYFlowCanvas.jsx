import React, { useState, useRef, useEffect, useCallback } from 'react';
import CoreXIcon from '../../corex/ui/CoreXIcon';
import DailyCheckIn from '../../corex/ui/DailyCheckIn';
import CoreYExplainerModal from './CoreYExplainerModal';
import { COREX_TEMPLATES, PROPERTY_TYPES, PRESET_FACTOR_SUGGESTIONS } from '../../corex/config/constants';
import {
  Plus,
  Trash,
  X,
  Check,
  Sparkle,
  ArrowsOutCardinal,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  CornersOut,
  CornersIn,
  DotsThree,
  Eye,
  FloppyDisk,
  SlidersHorizontal,
  PencilSimple,
  TreeStructure,
  Info,
  MagicWand,
  ArrowLeft,
  Clock,
  Star,
  CheckCircle,
  Hash
} from '@phosphor-icons/react';

export default function CoreYFlowCanvas({ initialConfig, onSave }) {
  const [config, setConfig] = useState(
    initialConfig ? JSON.parse(JSON.stringify(initialConfig)) : JSON.parse(JSON.stringify(COREX_TEMPLATES.SLEEP))
  );

  // Viewport Pan & Zoom
  const [zoom, setZoom] = useState(0.9);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Node Dragging State
  const [positions, setPositions] = useState({});
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragDistanceRef = useRef(0);

  // Fullscreen & Modals
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Quick Port '+' Modal
  const [activePortMenu, setActivePortMenu] = useState(null); // { nodeId, type, factorIdx, propIdx }
  const [portLabel, setPortLabel] = useState('');
  const [portType, setPortType] = useState('number');
  const [portUnit, setPortUnit] = useState('');

  // Node Edit Modal
  const [editingNode, setEditingNode] = useState(null); // { type: 'root'|'factor'|'property'|'subproperty', factorIdx, propIdx, subIdx }
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('number');
  const [editUnit, setEditUnit] = useState('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const canvasRef = useRef(null);

  // Factor colors palette
  const COLOR_PALETTE = [
    { color: '#d97706', bg: 'bg-amber-50/95 dark:bg-amber-950/40', border: 'border-amber-400 dark:border-amber-700', stroke: '#d97706' },
    { color: '#0284c7', bg: 'bg-sky-50/95 dark:bg-sky-950/40', border: 'border-sky-400 dark:border-sky-700', stroke: '#0284c7' },
    { color: '#16a34a', bg: 'bg-emerald-50/95 dark:bg-emerald-950/40', border: 'border-emerald-400 dark:border-emerald-700', stroke: '#16a34a' },
    { color: '#9333ea', bg: 'bg-purple-50/95 dark:bg-purple-950/40', border: 'border-purple-400 dark:border-purple-700', stroke: '#9333ea' },
    { color: '#e11d48', bg: 'bg-rose-50/95 dark:bg-rose-950/40', border: 'border-rose-400 dark:border-rose-700', stroke: '#e11d48' },
    { color: '#4f46e5', bg: 'bg-indigo-50/95 dark:bg-indigo-950/40', border: 'border-indigo-400 dark:border-indigo-700', stroke: '#4f46e5' }
  ];

  const getPalette = (index) => COLOR_PALETTE[index % COLOR_PALETTE.length];

  // 1. AUTO-LAYOUT GENERATION
  const calculateAutoLayout = useCallback((cfg) => {
    const newPos = {};
    const factorCount = cfg.factors.length;
    const factorSpacing = 320;
    const totalWidth = Math.max(1, factorCount - 1) * factorSpacing;
    const startX = 650 - totalWidth / 2;

    newPos['root'] = { x: 500, y: 40 };

    cfg.factors.forEach((factor, fIdx) => {
      const fX = startX + fIdx * factorSpacing;
      const fY = 220;
      const fId = factor.id || `factor_${fIdx}`;
      newPos[fId] = { x: fX, y: fY };

      let currentPropY = fY + 120;
      factor.properties?.forEach((prop, pIdx) => {
        const pId = prop.id || `prop_${fIdx}_${pIdx}`;
        newPos[pId] = { x: fX + 10, y: currentPropY };

        prop.subProperties?.forEach((sub, sIdx) => {
          const sId = sub.id || `sub_${fIdx}_${pIdx}_${sIdx}`;
          newPos[sId] = { x: fX + 220, y: currentPropY + sIdx * 60 };
        });

        const subCount = prop.subProperties?.length || 0;
        currentPropY += Math.max(85, subCount * 60 + 20);
      });
    });

    return newPos;
  }, []);

  useEffect(() => {
    setPositions(calculateAutoLayout(config));
  }, [config.name, calculateAutoLayout]);

  // 2. SPACEBAR PANNING LISTENER
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 3. NODE POINTER DOWN (WITH DRAG THRESHOLD TO PREVENT ACCIDENTAL CLICKS)
  const handleNodePointerDown = (e, nodeId) => {
    if (isSpacePressed) return;
    e.stopPropagation();
    setDraggingNodeId(nodeId);
    dragDistanceRef.current = 0;
    const nodePos = positions[nodeId] || { x: 0, y: 0 };
    dragOffsetRef.current = {
      x: e.clientX / zoom - nodePos.x,
      y: e.clientY / zoom - nodePos.y
    };
  };

  const handleCanvasPointerDown = (e) => {
    if (isSpacePressed || e.target === canvasRef.current || e.target.tagName === 'svg' || e.target.classList.contains('canvas-bg')) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      };
    }
  };

  const handlePointerMove = (e) => {
    if (draggingNodeId) {
      dragDistanceRef.current += Math.abs(e.movementX) + Math.abs(e.movementY);
      const newX = Math.round(e.clientX / zoom - dragOffsetRef.current.x);
      const newY = Math.round(e.clientY / zoom - dragOffsetRef.current.y);
      setPositions(prev => ({
        ...prev,
        [draggingNodeId]: { x: newX, y: newY }
      }));
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
    }
  };

  const handlePointerUp = () => {
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  const handleZoom = (delta) => {
    setZoom(prev => Math.min(1.5, Math.max(0.4, Number((prev + delta).toFixed(2)))));
  };

  const resetCanvasView = () => {
    setZoom(0.9);
    setPan({ x: 0, y: 0 });
    setPositions(calculateAutoLayout(config));
  };

  // 4. ORTHOGONAL STEP WIRE RENDERER
  const renderOrthogonalWire = (x1, y1, x2, y2, color, width = 2, isHorizontal = false) => {
    let path = '';
    const r = 8;

    if (!isHorizontal) {
      const midY = (y1 + y2) / 2;
      if (Math.abs(x1 - x2) < 4) {
        path = `M ${x1} ${y1} L ${x2} ${y2}`;
      } else {
        path = `M ${x1} ${y1} L ${x1} ${midY - r} Q ${x1} ${midY} ${x1 + (x2 > x1 ? r : -r)} ${midY} L ${x2 - (x2 > x1 ? r : -r)} ${midY} Q ${x2} ${midY} ${x2} ${midY + r} L ${x2} ${y2}`;
      }
    } else {
      const midX = (x1 + x2) / 2;
      if (Math.abs(y1 - y2) < 4) {
        path = `M ${x1} ${y1} L ${x2} ${y2}`;
      } else {
        path = `M ${x1} ${y1} L ${midX - r} ${y1} Q ${midX} ${y1} ${midX} ${y1 + (y2 > y1 ? r : -r)} L ${midX} ${y2 - (y2 > y1 ? r : -r)} Q ${midX} ${y2} ${midX + r} ${y2} L ${x2} ${y2}`;
      }
    }

    return (
      <g key={`${x1}-${y1}-${x2}-${y2}`}>
        <path d={path} stroke={color} strokeWidth={width + 2} strokeOpacity="0.12" fill="none" />
        <path d={path} stroke={color} strokeWidth={width} fill="none" />
      </g>
    );
  };

  // 5. INTENTIONAL EDIT OPENER (Pencil Icon Click or Zero-Drag Tap)
  const handleOpenEdit = (type, factorIdx = null, propIdx = null, subIdx = null) => {
    if (dragDistanceRef.current > 6) return; // Prevent opening modal when dragging
    setActivePortMenu(null);
    setEditingNode({ type, factorIdx, propIdx, subIdx });

    if (type === 'root') {
      setEditName(config.name);
      setEditUnit(config.outcome.label);
    } else if (type === 'factor') {
      setEditName(config.factors[factorIdx].name);
    } else if (type === 'property') {
      const p = config.factors[factorIdx].properties[propIdx];
      setEditName(p.label);
      setEditType(p.type || 'number');
      setEditUnit(p.unit || '');
    } else if (type === 'subproperty') {
      const s = config.factors[factorIdx].properties[propIdx].subProperties[subIdx];
      setEditName(s.label);
      setEditType(s.type || 'number');
      setEditUnit(s.unit || '');
    }
  };

  const handleSaveEdit = () => {
    if (!editingNode) return;
    const { type, factorIdx, propIdx, subIdx } = editingNode;
    const updated = JSON.parse(JSON.stringify(config));

    if (type === 'root') {
      updated.name = editName;
      updated.outcome.label = editUnit;
    } else if (type === 'factor') {
      updated.factors[factorIdx].name = editName;
    } else if (type === 'property') {
      updated.factors[factorIdx].properties[propIdx].label = editName;
      updated.factors[factorIdx].properties[propIdx].type = editType;
      updated.factors[factorIdx].properties[propIdx].unit = editType === 'number' ? editUnit : '';
    } else if (type === 'subproperty') {
      const targetSub = updated.factors[factorIdx].properties[propIdx].subProperties[subIdx];
      targetSub.label = editName;
      targetSub.type = editType;
      targetSub.unit = editType === 'number' ? editUnit : '';
    }

    setConfig(updated);
    setEditingNode(null);
  };

  // 6. PORT ADDER MODAL HANDLERS
  const handleOpenPortModal = (nodeId, type, factorIdx = null, propIdx = null) => {
    setActivePortMenu({ nodeId, type, factorIdx, propIdx });
    setPortLabel('');
    setPortType('number');
    setPortUnit('');
  };

  const handleAddFromPort = () => {
    if (!activePortMenu || !portLabel.trim()) return;
    const { type, factorIdx, propIdx } = activePortMenu;
    const updated = JSON.parse(JSON.stringify(config));

    if (type === 'root') {
      const pal = getPalette(updated.factors.length);
      const newF = {
        id: `factor_${Date.now()}`,
        name: portLabel.trim(),
        icon: 'Sparkle',
        color: pal.color,
        active: true,
        order: updated.factors.length + 1,
        properties: [
          { id: `prop_${Date.now()}_1`, label: 'Quantity', type: 'number', unit: 'count', order: 1, subProperties: [] }
        ]
      };
      updated.factors.push(newF);
    } else if (type === 'factor') {
      const newP = {
        id: `prop_${Date.now()}`,
        label: portLabel.trim(),
        type: portType,
        unit: portType === 'number' ? portUnit.trim() : '',
        order: (updated.factors[factorIdx].properties?.length || 0) + 1,
        subProperties: []
      };
      updated.factors[factorIdx].properties = [...(updated.factors[factorIdx].properties || []), newP];
    } else if (type === 'property') {
      const newS = {
        id: `sub_${Date.now()}`,
        label: portLabel.trim(),
        type: portType,
        unit: portType === 'number' ? portUnit.trim() : '',
        order: (updated.factors[factorIdx].properties[propIdx].subProperties?.length || 0) + 1
      };
      const targetP = updated.factors[factorIdx].properties[propIdx];
      targetP.subProperties = [...(targetP.subProperties || []), newS];
    }

    setConfig(updated);
    setPositions(calculateAutoLayout(updated));
    setActivePortMenu(null);
  };

  const removeFactor = (factorIdx) => {
    const updatedCfg = { ...config, factors: config.factors.filter((_, idx) => idx !== factorIdx) };
    setConfig(updatedCfg);
    setPositions(calculateAutoLayout(updatedCfg));
    setEditingNode(null);
  };

  const removeProperty = (factorIdx, propIdx) => {
    const updated = [...config.factors];
    updated[factorIdx].properties = updated[factorIdx].properties.filter((_, idx) => idx !== propIdx);
    const updatedCfg = { ...config, factors: updated };
    setConfig(updatedCfg);
    setPositions(calculateAutoLayout(updatedCfg));
    setEditingNode(null);
  };

  const removeSubProperty = (factorIdx, propIdx, subIdx) => {
    const updated = [...config.factors];
    const targetProp = updated[factorIdx].properties[propIdx];
    targetProp.subProperties = targetProp.subProperties.filter((_, idx) => idx !== subIdx);
    const updatedCfg = { ...config, factors: updated };
    setConfig(updatedCfg);
    setPositions(calculateAutoLayout(updatedCfg));
    setEditingNode(null);
  };

  const handleSaveAll = () => {
    if (onSave) {
      onSave({ ...config, layout: positions });
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2500);
    }
  };

  const rootPos = positions['root'] || { x: 500, y: 40 };
  const rootOutput = { x: rootPos.x + 140, y: rootPos.y + 80 };

  return (
    <div 
      className={`w-full bg-white dark:bg-[#11141d] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col font-sans relative select-none transition-all ${
        isFullscreen ? 'fixed inset-0 z-[999] rounded-none border-none h-screen w-screen' : ''
      }`}
    >
      
      {/* ── TOP HEADER (STANDALONE FULLSCREEN VIEW READY) ── */}
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-[#131722]/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0 z-30">
        
        {/* Left: Brand Title */}
        <div className="flex items-center gap-3 min-w-0">
          {isFullscreen && (
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={14} weight="bold" /> Exit Full Page
            </button>
          )}

          <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-serif text-lg font-black shrink-0 shadow-2xs">
            <TreeStructure size={20} weight="bold" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-serif font-black text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
              <span>Core Y — Flowchart Canvas</span>
              <span className="text-[9.5px] font-sans font-bold bg-purple-100 dark:bg-purple-950/50 text-purple-600 px-2 py-0.5 rounded-full">
                Space + Drag to Pan
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Drag nodes freely · '+' Port to add child · Click ✏️ Pencil to edit.
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Auto-Align */}
          <button
            type="button"
            onClick={() => setPositions(calculateAutoLayout(config))}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            title="Auto-organize clean node tree"
          >
            <MagicWand size={14} weight="bold" className="text-purple-600" />
            <span className="hidden sm:inline">Auto-Align</span>
          </button>

          {/* Info Explainer Tabbed Modal Button */}
          <button
            type="button"
            onClick={() => setShowInfoModal(true)}
            className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center justify-center hover:bg-purple-100 transition-colors cursor-pointer shadow-2xs"
            title="How Core Y Works (Tabbed Guide)"
          >
            <Info size={16} weight="bold" />
          </button>

          {/* Fullscreen Mode (ज़ूम आउट / फुल स्क्रीन ऑप्शन) */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shadow-2xs ${
              isFullscreen 
                ? 'bg-purple-600 text-white border-purple-600' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
            title={isFullscreen ? 'Exit Full Page Mode' : 'Full Page Mode (Dedicated Screen)'}
          >
            {isFullscreen ? <CornersIn size={16} weight="bold" /> : <CornersOut size={16} weight="bold" />}
          </button>

          {/* Preview Form */}
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
          >
            <Eye size={14} weight="bold" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          {/* Save Tree */}
          <button
            type="button"
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <FloppyDisk size={14} weight="bold" />
            <span>Save Tree</span>
          </button>
        </div>
      </div>

      {/* Save Success Notice */}
      {saveSuccessNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 rounded-full text-xs font-black shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check size={14} weight="bold" className="text-emerald-400" />
          <span>Pipeline & Node Positions Saved!</span>
        </div>
      )}

      {/* ── INTERACTIVE CANVAS WORKSPACE ── */}
      <div 
        ref={canvasRef}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`canvas-bg relative w-full overflow-hidden bg-[#fafafc] dark:bg-[#0c0e15] ${
          isSpacePressed || isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        } ${isFullscreen ? 'flex-1' : 'h-[620px] sm:h-[720px]'}`}
        style={{
          backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.35) 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px'
        }}
      >

        {/* Floating Zoom Bar (Bottom Left) */}
        <div className="absolute bottom-6 left-6 z-30 flex items-center gap-1.5 bg-white/95 dark:bg-[#151a26]/95 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-lg p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => handleZoom(-0.1)}
            className="w-7 h-7 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center font-black text-xs cursor-pointer"
          >
            -
          </button>
          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 px-1.5">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => handleZoom(0.1)}
            className="w-7 h-7 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center font-black text-xs cursor-pointer"
          >
            +
          </button>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
          <button
            type="button"
            onClick={resetCanvasView}
            className="w-7 h-7 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
            title="Reset Pan & Auto-Align"
          >
            <CornersOut size={13} weight="bold" />
          </button>
        </div>

        {/* ── DRAGGABLE NODES LAYER + RECTANGULAR STEP SVG CONNECTIONS ── */}
        <div 
          className="absolute inset-0 origin-top-left pointer-events-auto"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
          }}
        >
          
          {/* 🌟 1. ORTHOGONAL STEPPED RECTANGULAR SVG CONNECTOR WIRES */}
          <svg className="absolute inset-0 w-[4000px] h-[4000px] pointer-events-none overflow-visible z-0">
            {config.factors.map((factor, fIdx) => {
              const pal = getPalette(fIdx);
              const fId = factor.id || `factor_${fIdx}`;
              const fPos = positions[fId] || { x: 300 + fIdx * 250, y: 220 };
              const fInput = { x: fPos.x + 110, y: fPos.y };
              const fOutput = { x: fPos.x + 110, y: fPos.y + 70 };

              // Step Line: Root -> Factor Node
              const rootLine = renderOrthogonalWire(rootOutput.x, rootOutput.y, fInput.x, fInput.y, pal.stroke, 2.5, false);

              // Step Lines: Factor -> Property Nodes
              const propLines = factor.properties?.map((prop, pIdx) => {
                const pId = prop.id || `prop_${fIdx}_${pIdx}`;
                const pPos = positions[pId] || { x: fPos.x + 10, y: fPos.y + 120 + pIdx * 80 };
                const pInput = { x: pPos.x + 85, y: pPos.y };
                const pOutput = { x: pPos.x + 170, y: pPos.y + 24 };

                const factorToPropLine = renderOrthogonalWire(fOutput.x, fOutput.y, pInput.x, pInput.y, pal.stroke, 2, false);

                // Step Lines: Property -> Sub-property Mini Branches (Horizontal Step)
                const subLines = prop.subProperties?.map((sub, sIdx) => {
                  const sId = sub.id || `sub_${fIdx}_${pIdx}_${sIdx}`;
                  const sPos = positions[sId] || { x: pPos.x + 220, y: pPos.y + sIdx * 60 };
                  const sInput = { x: sPos.x, y: sPos.y + 18 };

                  return renderOrthogonalWire(pOutput.x, pOutput.y, sInput.x, sInput.y, pal.stroke, 1.8, true);
                });

                return (
                  <React.Fragment key={pId}>
                    {factorToPropLine}
                    {subLines}
                  </React.Fragment>
                );
              });

              return (
                <React.Fragment key={fId}>
                  {rootLine}
                  {propLines}
                </React.Fragment>
              );
            })}
          </svg>

          {/* 🌟 2. ROOT HABIT NODE */}
          <div
            onPointerDown={(e) => handleNodePointerDown(e, 'root')}
            style={{
              transform: `translate(${rootPos.x}px, ${rootPos.y}px)`,
              cursor: draggingNodeId === 'root' ? 'grabbing' : 'grab'
            }}
            className="absolute z-20 group"
          >
            <div className="w-72 bg-white dark:bg-[#151a26] border-2 border-indigo-500 rounded-3xl p-4 shadow-xl flex items-center justify-between gap-3.5 backdrop-blur-md hover:shadow-2xl transition-shadow">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
                  <CoreXIcon name={config.icon || 'Moon'} size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                    {config.name}
                  </h3>
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                    Primary Outcome
                  </span>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 truncate block">
                    {config.outcome.label}
                  </span>
                </div>
              </div>

              {/* Explicit Edit Pencil Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEdit('root');
                }}
                className="w-7 h-7 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
                title="Edit Root Details"
              >
                <PencilSimple size={15} weight="bold" />
              </button>
            </div>

            {/* Bottom Output Pin */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white dark:bg-[#151a26] border-2 border-indigo-500 flex items-center justify-center shadow-xs pointer-events-none">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            </div>

            {/* Right '+' Port Button (N8N Style) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenPortModal('root', 'root');
              }}
              className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
              title="Add Factor Branch"
            >
              <Plus size={12} weight="bold" />
            </button>
          </div>

          {/* 🌟 3. FACTOR NODES & PROPERTY NODES */}
          {config.factors.map((factor, fIdx) => {
            const pal = getPalette(fIdx);
            const fId = factor.id || `factor_${fIdx}`;
            const fPos = positions[fId] || { x: 300 + fIdx * 250, y: 220 };

            return (
              <React.Fragment key={fId}>
                
                {/* A. Factor Node */}
                <div
                  onPointerDown={(e) => handleNodePointerDown(e, fId)}
                  style={{
                    transform: `translate(${fPos.x}px, ${fPos.y}px)`,
                    cursor: draggingNodeId === fId ? 'grabbing' : 'grab'
                  }}
                  className="absolute z-20 group min-w-[220px]"
                >
                  {/* Top Input Pin */}
                  <div 
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white dark:bg-[#151a26] border-2 flex items-center justify-center shadow-xs pointer-events-none"
                    style={{ borderColor: pal.color }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pal.color }} />
                  </div>

                  <div className={`w-full ${pal.bg} border-2 ${pal.border} rounded-2xl p-3 shadow-md flex items-center justify-between gap-2.5 transition-shadow hover:shadow-xl`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: pal.color }}
                      >
                        <CoreXIcon name={factor.icon} size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {factor.name}
                        </h4>
                        <span className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 block">
                          {factor.properties?.length || 0} properties
                        </span>
                      </div>
                    </div>

                    {/* Explicit Edit Pencil Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit('factor', fIdx);
                      }}
                      className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                      title="Edit Factor"
                    >
                      <PencilSimple size={14} weight="bold" />
                    </button>
                  </div>

                  {/* Bottom Output Pin */}
                  <div 
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white dark:bg-[#151a26] border-2 flex items-center justify-center shadow-xs pointer-events-none"
                    style={{ borderColor: pal.color }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pal.color }} />
                  </div>

                  {/* Right '+' Port Button (N8N Style) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPortModal(fId, 'factor', fIdx);
                    }}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
                    title="Add Property"
                  >
                    <Plus size={12} weight="bold" />
                  </button>
                </div>

                {/* B. Property Nodes */}
                {factor.properties?.map((prop, pIdx) => {
                  const pId = prop.id || `prop_${fIdx}_${pIdx}`;
                  const pPos = positions[pId] || { x: fPos.x + 10, y: fPos.y + 120 + pIdx * 80 };

                  return (
                    <React.Fragment key={pId}>
                      <div
                        onPointerDown={(e) => handleNodePointerDown(e, pId)}
                        style={{
                          transform: `translate(${pPos.x}px, ${pPos.y}px)`,
                          cursor: draggingNodeId === pId ? 'grabbing' : 'grab'
                        }}
                        className="absolute z-20 group min-w-[170px]"
                      >
                        {/* Top Input Pin */}
                        <div 
                          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white dark:bg-[#151a26] border flex items-center justify-center pointer-events-none"
                          style={{ borderColor: pal.color }}
                        />

                        {/* Property Card */}
                        <div className={`px-3 py-2 rounded-xl border-2 ${pal.border} bg-white dark:bg-[#151a26] shadow-sm flex items-center justify-between gap-2 hover:shadow-md transition-shadow`}>
                          <div className="min-w-0">
                            <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block truncate max-w-[105px]">
                              {prop.label}
                            </span>
                            <span 
                              className="text-[9px] font-bold uppercase tracking-wider block"
                              style={{ color: pal.color }}
                            >
                              ({prop.type === 'yesno' ? 'Boolean' : prop.type}{prop.unit ? `·${prop.unit}` : ''})
                            </span>
                          </div>

                          {/* Explicit Edit Pencil Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit('property', fIdx, pIdx);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                            title="Edit Property"
                          >
                            <PencilSimple size={13} weight="bold" />
                          </button>
                        </div>

                        {/* Right '+' Port Button (N8N Style to attach Mini Branch) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPortModal(pId, 'property', fIdx, pIdx);
                          }}
                          className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
                          title="Add Mini-Property Branch"
                        >
                          <Plus size={10} weight="bold" />
                        </button>
                      </div>

                      {/* C. Sub-Properties (Side Mini Branches) */}
                      {prop.subProperties?.map((sub, sIdx) => {
                        const sId = sub.id || `sub_${fIdx}_${pIdx}_${sIdx}`;
                        const sPos = positions[sId] || { x: pPos.x + 220, y: pPos.y + sIdx * 60 };

                        return (
                          <div
                            key={sId}
                            onPointerDown={(e) => handleNodePointerDown(e, sId)}
                            style={{
                              transform: `translate(${sPos.x}px, ${sPos.y}px)`,
                              cursor: draggingNodeId === sId ? 'grabbing' : 'grab'
                            }}
                            className="absolute z-20 group min-w-[130px]"
                          >
                            {/* Left Input Pin */}
                            <div 
                              className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white dark:bg-[#151a26] border flex items-center justify-center pointer-events-none"
                              style={{ borderColor: pal.color }}
                            />

                            <div className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-1.5 text-[10.5px] font-bold text-slate-800 dark:text-slate-200 hover:border-purple-400">
                              <div className="min-w-0">
                                <span className="truncate block max-w-[80px]">{sub.label}</span>
                                <span className="text-[8.5px] font-bold text-purple-600 block">
                                  ({sub.type || 'number'}{sub.unit ? `·${sub.unit}` : ''})
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit('subproperty', fIdx, pIdx, sIdx);
                                }}
                                className="text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                                title="Edit Mini Branch"
                              >
                                <PencilSimple size={12} weight="bold" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}

              </React.Fragment>
            );
          })}

        </div>

      </div>

      {/* ── PORT MODAL (+ BUTTON ON NODE) ── */}
      {activePortMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Plus size={16} className="text-purple-600" weight="bold" /> 
                {activePortMenu.type === 'root' ? 'Add Factor Node' : (activePortMenu.type === 'factor' ? 'Add Property Node' : 'Add Mini-Property Branch')}
              </h3>
              <button onClick={() => setActivePortMenu(null)} className="text-slate-400 hover:text-slate-900">
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">Label / Name</label>
                <input 
                  type="text"
                  placeholder={activePortMenu.type === 'root' ? 'e.g. Coffee, Workout, Screen...' : 'e.g. Quantity, Time, Rating...'}
                  value={portLabel}
                  onChange={e => setPortLabel(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                />
              </div>

              {activePortMenu.type !== 'root' && (
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block">Input Metric Type</label>
                    <select
                      value={portType}
                      onChange={e => setPortType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold outline-none"
                    >
                      <option value="number">Number (with custom unit)</option>
                      <option value="time">Time (HH:mm)</option>
                      <option value="rating">Rating (1 to 10 Scale)</option>
                      <option value="yesno">Yes / No (Boolean Gate)</option>
                    </select>
                  </div>

                  {/* Dynamic Conditional Fields based on Type */}
                  {portType === 'number' && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block">Custom Unit</label>
                      <input 
                        type="text"
                        placeholder="e.g. cups, ml, min, mg, hrs, reps..."
                        value={portUnit}
                        onChange={e => setPortUnit(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                      />
                    </div>
                  )}

                  {portType === 'time' && (
                    <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 text-[10.5px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <Clock size={14} weight="bold" /> Tracks clock time (e.g. 05:30 PM)
                    </div>
                  )}

                  {portType === 'rating' && (
                    <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 text-[10.5px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <Star size={14} weight="bold" /> 1 to 10 rating score
                    </div>
                  )}

                  {portType === 'yesno' && (
                    <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 text-[10.5px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <CheckCircle size={14} weight="bold" /> Binary Yes / No switch
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleAddFromPort}
                className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-black text-xs hover:bg-purple-700 shadow-2xs mt-2 cursor-pointer"
              >
                Attach & Connect Node
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT NODE MODAL (DYNAMIC TYPE & UNIT PER FIELD) ── */}
      {editingNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <PencilSimple size={16} className="text-purple-600" weight="bold" /> Edit Node Details
              </h3>
              <button onClick={() => setEditingNode(null)} className="text-slate-400 hover:text-slate-900">
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">Label / Title</label>
                <input 
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                />
              </div>

              {editingNode.type === 'root' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">Primary Target Metric</label>
                  <input 
                    type="text"
                    value={editUnit}
                    onChange={e => setEditUnit(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>
              )}

              {(editingNode.type === 'property' || editingNode.type === 'subproperty') && (
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block">Input Metric Type</label>
                    <select
                      value={editType}
                      onChange={e => setEditType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold outline-none"
                    >
                      <option value="number">Number (with custom unit)</option>
                      <option value="time">Time (HH:mm)</option>
                      <option value="rating">Rating (1 to 10 Scale)</option>
                      <option value="yesno">Yes / No (Boolean Gate)</option>
                    </select>
                  </div>

                  {/* Dynamic Conditional Fields based on Type */}
                  {editType === 'number' && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block">Custom Unit</label>
                      <input 
                        type="text"
                        placeholder="e.g. cups, ml, min, mg, hrs..."
                        value={editUnit}
                        onChange={e => setEditUnit(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                      />
                    </div>
                  )}

                  {editType === 'time' && (
                    <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 text-[10.5px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <Clock size={14} weight="bold" /> Time Picker format (HH:mm)
                    </div>
                  )}

                  {editType === 'rating' && (
                    <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 text-[10.5px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <Star size={14} weight="bold" /> 1 to 10 scale rating
                    </div>
                  )}

                  {editType === 'yesno' && (
                    <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 text-[10.5px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <CheckCircle size={14} weight="bold" /> Binary Yes / No gate
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {editingNode.type === 'factor' && (
                  <button
                    type="button"
                    onClick={() => removeFactor(editingNode.factorIdx)}
                    className="flex-1 py-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Trash size={14} weight="bold" /> Delete
                  </button>
                )}
                {editingNode.type === 'property' && (
                  <button
                    type="button"
                    onClick={() => removeProperty(editingNode.factorIdx, editingNode.propIdx)}
                    className="flex-1 py-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Trash size={14} weight="bold" /> Delete
                  </button>
                )}
                {editingNode.type === 'subproperty' && (
                  <button
                    type="button"
                    onClick={() => removeSubProperty(editingNode.factorIdx, editingNode.propIdx, editingNode.subIdx)}
                    className="flex-1 py-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Trash size={14} weight="bold" /> Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex-1 py-2 rounded-xl bg-purple-600 text-white font-black text-xs hover:bg-purple-700 shadow-2xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabbed Info Explainer Modal */}
      <CoreYExplainerModal 
        isOpen={showInfoModal} 
        onClose={() => setShowInfoModal(false)} 
      />

      {/* Preview Form Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-lg w-full shadow-2xl max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Daily Form Live Preview</h3>
              <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-slate-900">
                <X size={16} weight="bold" />
              </button>
            </div>

            <DailyCheckIn 
              config={config}
              dateStr="Today (Preview)"
              existingLog={{}}
              onSave={() => {}}
            />
          </div>
        </div>
      )}

    </div>
  );
}
