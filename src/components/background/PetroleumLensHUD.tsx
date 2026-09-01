import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Check,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Sun,
  Layers,
  Sliders,
  X,
  Compass,
  Flame,
} from 'lucide-react';
import { usePetroleumBackground, GlassIntensity } from '../../context/BackgroundContext';

export const PetroleumLensHUD: React.FC = () => {
  const {
    currentBackdrop,
    selectedId,
    setBackdrop,
    isPeekMode,
    togglePeekMode,
    glassIntensity,
    setGlassIntensity,
    isAutoRotate,
    setIsAutoRotate,
    backdropBrightness,
    setBackdropBrightness,
    allBackdrops,
  } = usePetroleumBackground();

  const [isOpen, setIsOpen] = useState(false);
  const hudRef = useRef<HTMLDivElement>(null);

  // Close HUD popup on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (hudRef.current && !hudRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const intensityOptions: { label: string; value: GlassIntensity; desc: string }[] = [
    { label: 'Crystal', value: 'crystal', desc: 'Ultra-translucent clear glass' },
    { label: 'Balanced', value: 'balanced', desc: 'Optimal contrast & gloss' },
    { label: 'Frosted', value: 'frosted', desc: 'Heavy frosted satin blur' },
    { label: 'Deep Smoke', value: 'deep', desc: 'Dark petroleum slate tint' },
  ];

  return (
    <aside
      ref={hudRef}
      aria-label="Petroleum Atmosphere Controls"
      className="fixed bottom-4 right-4 z-50 select-none font-sans print:hidden"
    >
      {/* Expanded Control Lens Modal / Drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Petroleum Atmosphere Settings"
          className="mb-2.5 w-80 sm:w-92 bg-[#040E1A]/90 backdrop-blur-2xl border border-white/25 rounded-xl shadow-2xl p-4 text-white animate-in fade-in slide-in-from-bottom-3 duration-200 overflow-hidden relative"
          style={{
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.15) inset',
          }}
        >
          {/* Top Amber Sovereign Bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
                <Flame className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white tracking-wide">
                  Petroleum Atmosphere &amp; Glass
                </h4>
                <p className="text-[10px] text-gray-400">Cinematic Industrial Theme</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5 mt-3 text-xs">
            {/* 1. Backdrop Selection Cards */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  Industrial Backdrop
                </label>
                <span className="text-[10px] text-amber-400 font-mono">
                  {allBackdrops.findIndex((b) => b.id === selectedId) + 1}/{allBackdrops.length}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {allBackdrops.map((backdrop) => {
                  const isSelected = backdrop.id === selectedId;
                  return (
                    <button
                      key={backdrop.id}
                      onClick={() => setBackdrop(backdrop.id)}
                      className={`group relative rounded-lg overflow-hidden border p-1 text-left transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-400/40 shadow-lg'
                          : 'border-white/10 hover:border-white/30 bg-black/40 hover:bg-black/60'
                      }`}
                    >
                      {/* Mini Preview Image */}
                      <div className="h-14 w-full rounded overflow-hidden relative mb-1.5 bg-gray-900">
                        <img
                          src={backdrop.url}
                          alt={backdrop.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center shadow">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="px-0.5">
                        <p className="font-semibold text-[11px] text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                          {backdrop.name}
                        </p>
                        <p className="text-[9px] text-gray-400 line-clamp-1 mt-0.5">
                          {backdrop.sector.split('•')[0]}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Glassmorphism Intensity Switcher */}
            <div>
              <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                Translucent Glass Finish
              </label>
              <div className="grid grid-cols-4 gap-1 bg-black/50 p-1 rounded-lg border border-white/10">
                {intensityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setGlassIntensity(opt.value)}
                    title={opt.desc}
                    className={`py-1.5 px-1 rounded text-center text-[10px] font-medium transition-all cursor-pointer ${
                      glassIntensity === opt.value
                        ? 'bg-white text-slate-900 font-bold shadow'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Backdrop Brightness Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  Atmospheric Luminescence
                </label>
                <span className="text-[10px] font-mono text-gray-400">{backdropBrightness}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                step="5"
                value={backdropBrightness}
                onChange={(e) => setBackdropBrightness(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* 4. Controls & Quick Toggles */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
              {/* Peek Mode Toggle */}
              <button
                onClick={togglePeekMode}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  isPeekMode
                    ? 'bg-amber-500 text-black border-amber-400 shadow-md ring-1 ring-amber-300'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                }`}
                title="Press Shift + B to toggle"
              >
                {isPeekMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{isPeekMode ? 'Restore UI' : 'Reveal Scene'}</span>
                <span className="text-[9px] opacity-75 font-mono ml-0.5">(⇧B)</span>
              </button>

              {/* Auto Cycle Button */}
              <button
                onClick={() => setIsAutoRotate(!isAutoRotate)}
                className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  isAutoRotate
                    ? 'bg-sky-500/20 text-sky-300 border-sky-400 ring-1 ring-sky-400/30'
                    : 'bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border-white/15'
                }`}
                title="Automatically cycle background every 45 seconds"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAutoRotate ? 'animate-spin' : ''}`} />
                <span>Auto-Cycle</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Pill Toggle Button */}
      <div className="flex items-center space-x-1.5">
        {/* Quick Peek Eye Button */}
        <button
          onClick={togglePeekMode}
          title={isPeekMode ? 'Restore UI Panels (Shift+B)' : 'Reveal Full Petroleum Backdrop (Shift+B)'}
          className={`h-9 px-3 rounded-full flex items-center space-x-1.5 border backdrop-blur-xl shadow-lg transition-all duration-200 cursor-pointer ${
            isPeekMode
              ? 'bg-amber-500 text-black border-amber-300 shadow-amber-500/30 ring-2 ring-amber-400'
              : 'bg-[#040E1A]/85 hover:bg-[#040E1A] text-white border-white/20 hover:border-white/40 shadow-black/40'
          }`}
          style={{
            boxShadow: '0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          {isPeekMode ? <EyeOff className="w-4 h-4 text-black" /> : <Eye className="w-4 h-4 text-amber-400" />}
          <span className="text-[11px] font-bold tracking-tight hidden sm:inline">
            {isPeekMode ? 'Exit View' : 'Peek Backdrop'}
          </span>
        </button>

        {/* Main Lens Pill Menu */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          title="Petroleum Theme & Visuals Lens"
          className="h-9 pl-3 pr-2.5 rounded-full flex items-center space-x-2 bg-[#040E1A]/85 hover:bg-[#040E1A] text-white border border-white/20 hover:border-white/40 backdrop-blur-xl shadow-lg transition-all duration-200 cursor-pointer group"
          style={{
            boxShadow: '0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          <div className="w-4 h-4 rounded-full overflow-hidden relative border border-white/30 shrink-0">
            <img
              src={currentBackdrop.url}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-[11px] font-semibold text-gray-200 group-hover:text-white max-w-[130px] truncate hidden md:inline">
            {currentBackdrop.name}
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
          )}
        </button>
      </div>
    </aside>
  );
};
