import React, { useEffect, useState } from 'react';
import { usePetroleumBackground } from '../../context/BackgroundContext';
import { PetroleumLensHUD } from './PetroleumLensHUD';
import { Radio, Activity, ShieldCheck, Compass, EyeOff, Sparkles } from 'lucide-react';

export const PetroleumBackground: React.FC = () => {
  const {
    currentBackdrop,
    isPeekMode,
    togglePeekMode,
    isPageTransitioning,
    backdropBrightness,
    glassIntensity,
  } = usePetroleumBackground();

  const [activeImage, setActiveImage] = useState(currentBackdrop.url);
  const [fadeImage, setFadeImage] = useState<string | null>(null);

  // Smooth crossfade when backdrop url changes
  useEffect(() => {
    if (currentBackdrop.url !== activeImage) {
      setFadeImage(currentBackdrop.url);
      const timer = setTimeout(() => {
        setActiveImage(currentBackdrop.url);
        setFadeImage(null);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentBackdrop.url, activeImage]);

  return (
    <>
      {/* ── Fixed Fullscreen Industrial Canvas ────────────────────────────── */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none"
      >
        {/* Layer 1: Active Petroleum Image with Ambient Breathing Pan */}
        <div
          className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out transform ${
            isPageTransitioning ? 'scale-[1.03] filter brightness-110 saturate-125' : 'scale-100'
          }`}
          style={{
            backgroundImage: `url(${activeImage})`,
            backgroundPosition: 'center 40%',
            filter: `brightness(${backdropBrightness}%) contrast(108%) saturate(115%)`,
            transformOrigin: 'center center',
          }}
        />

        {/* Layer 1B: Crossfade Image if switching */}
        {fadeImage && (
          <div
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-500 ease-in-out opacity-100"
            style={{
              backgroundImage: `url(${fadeImage})`,
              backgroundPosition: 'center 40%',
              filter: `brightness(${backdropBrightness}%) contrast(108%) saturate(115%)`,
            }}
          />
        )}

        {/* Layer 2: Dynamic Route Change Atmospheric Light Sweep */}
        {isPageTransitioning && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/15 to-transparent animate-route-sweep pointer-events-none" />
        )}

        {/* Layer 3: Atmospheric Sovereign Color Tint & Vignette Wash */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 100% 70% at 50% 10%, rgba(4, 14, 26, 0.45) 0%, rgba(4, 14, 26, 0.75) 100%),
              linear-gradient(180deg, rgba(4, 14, 26, 0.5) 0%, rgba(11, 42, 74, 0.25) 45%, rgba(4, 14, 26, 0.65) 100%),
              radial-gradient(circle 600px at 90% 85%, rgba(255, 153, 51, 0.12) 0%, transparent 70%),
              radial-gradient(circle 500px at 10% 90%, rgba(19, 136, 8, 0.08) 0%, transparent 70%)
            `,
          }}
        />

        {/* Layer 4: Subtle Specular Light Mesh & Grain */}
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Layer 5: Subtle Animated Refinery Light Nodes (Simulating twinkling flares) */}
        <div className="absolute top-1/3 left-1/4 w-2 h-2 rounded-full bg-amber-400/40 blur-xs animate-ping duration-1000" />
        <div className="absolute top-1/2 right-1/3 w-2.5 h-2.5 rounded-full bg-orange-400/30 blur-xs animate-pulse duration-700" />
        <div className="absolute top-2/5 right-1/4 w-1.5 h-1.5 rounded-full bg-sky-300/40 blur-xs animate-pulse duration-1000" />
      </div>

      {/* ── Peek Mode Fullscreen Telemetry HUD ──────────────────────────────── */}
      {isPeekMode && (
        <div className="fixed inset-0 z-40 flex flex-col justify-between p-6 sm:p-10 pointer-events-none select-none font-sans animate-in fade-in zoom-in-95 duration-300">
          {/* Top Telemetry Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 bg-[#040E1A]/80 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-full shadow-2xl pointer-events-auto">
              <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
              <div className="text-xs">
                <span className="font-bold text-white tracking-wide">{currentBackdrop.name}</span>
                <span className="text-gray-400 mx-2">•</span>
                <span className="text-amber-400 font-mono text-[11px]">{currentBackdrop.sector}</span>
              </div>
            </div>

            {/* Exit Peek Mode Button */}
            <button
              onClick={togglePeekMode}
              className="pointer-events-auto flex items-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-full shadow-2xl transition-all hover:scale-105 cursor-pointer"
            >
              <EyeOff className="w-4 h-4" />
              <span>Restore Dashboard</span>
            </button>
          </div>

          {/* Bottom Telemetry Information Box */}
          <div className="max-w-md bg-[#040E1A]/85 backdrop-blur-2xl border border-white/25 p-4 rounded-xl shadow-2xl text-white space-y-2 pointer-events-auto">
            <div className="flex items-center space-x-2 text-[11px] text-amber-400 font-mono">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>LIVE INDUSTRIAL INFRASTRUCTURE FEED</span>
            </div>
            <h3 className="font-serif font-bold text-base text-white">{currentBackdrop.name}</h3>
            <p className="text-xs text-gray-300 leading-relaxed">{currentBackdrop.description}</p>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400 font-mono">
              <span>SECTOR: CPCL / MoPNG</span>
              <span>GRID: 13.0827° N, 80.2707° E</span>
              <span>STATUS: NOMINAL</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Persistent Floating Lens HUD Widget ────────────────────────────── */}
      <PetroleumLensHUD />
    </>
  );
};
