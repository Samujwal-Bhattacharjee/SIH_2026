import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export interface PetroleumBackdrop {
  id: string;
  name: string;
  sector: string;
  url: string;
  accent: string;
  description: string;
}

export const PETROLEUM_BACKDROPS: PetroleumBackdrop[] = [
  {
    id: 'twilight',
    name: 'Refinery at Twilight',
    sector: 'Downstream Processing • CPCL Sector',
    url: '/backgrounds/refinery-twilight.png',
    accent: '#FF9933',
    description: 'High-temperature distillation and fractionating towers illuminated at golden twilight.',
  },
  {
    id: 'offshore',
    name: 'Deepwater Exploration Rig',
    sector: 'Upstream Exploration • Offshore Basin',
    url: '/backgrounds/offshore-rig.png',
    accent: '#38BDF8',
    description: 'Ultra-deepwater offshore drilling and extraction platform stationed on ocean waters.',
  },
  {
    id: 'sunset',
    name: 'Petrochemical Complex at Dusk',
    sector: 'Refining Operations • Strategic Infrastructure',
    url: '/backgrounds/refinery-sunset.jpg',
    accent: '#F97316',
    description: 'Industrial petrochemical processing units with glowing infrastructure under a vibrant sunset.',
  },
  {
    id: 'storage',
    name: 'Strategic Reserves & Bulk Terminal',
    sector: 'Midstream Storage • National Fuel Grid',
    url: '/backgrounds/storage-tanks.png',
    accent: '#A855F7',
    description: 'High-capacity pressurized crude storage terminals and supply logistics hub.',
  },
];

export type GlassIntensity = 'crystal' | 'balanced' | 'frosted' | 'deep';

interface BackgroundContextType {
  currentBackdrop: PetroleumBackdrop;
  selectedId: string;
  setBackdrop: (id: string) => void;
  isPeekMode: boolean;
  setPeekMode: (peek: boolean) => void;
  togglePeekMode: () => void;
  glassIntensity: GlassIntensity;
  setGlassIntensity: (intensity: GlassIntensity) => void;
  isAutoRotate: boolean;
  setIsAutoRotate: (auto: boolean) => void;
  isPageTransitioning: boolean;
  backdropBrightness: number;
  setBackdropBrightness: (val: number) => void;
  allBackdrops: PetroleumBackdrop[];
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const BackgroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedId, setSelectedId] = useState<string>(() => {
    return localStorage.getItem('sih_petroleum_bg_id') || 'twilight';
  });
  const [isPeekMode, setIsPeekMode] = useState<boolean>(false);
  const [glassIntensity, setGlassIntensity] = useState<GlassIntensity>(() => {
    return (localStorage.getItem('sih_glass_intensity') as GlassIntensity) || 'balanced';
  });
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(() => {
    return localStorage.getItem('sih_bg_autorotate') === 'true';
  });
  const [backdropBrightness, setBackdropBrightness] = useState<number>(() => {
    const saved = localStorage.getItem('sih_bg_brightness');
    return saved ? Number(saved) : 85;
  });
  const [isPageTransitioning, setIsPageTransitioning] = useState<boolean>(false);

  const location = useLocation();

  // Find active backdrop
  const currentBackdrop =
    PETROLEUM_BACKDROPS.find((b) => b.id === selectedId) || PETROLEUM_BACKDROPS[0];

  const setBackdrop = useCallback((id: string) => {
    setSelectedId(id);
    localStorage.setItem('sih_petroleum_bg_id', id);
  }, []);

  const handleSetGlassIntensity = (intensity: GlassIntensity) => {
    setGlassIntensity(intensity);
    localStorage.setItem('sih_glass_intensity', intensity);
  };

  const handleSetAutoRotate = (auto: boolean) => {
    setIsAutoRotate(auto);
    localStorage.setItem('sih_bg_autorotate', String(auto));
  };

  const handleSetBrightness = (val: number) => {
    setBackdropBrightness(val);
    localStorage.setItem('sih_bg_brightness', String(val));
  };

  const togglePeekMode = useCallback(() => {
    setIsPeekMode((prev) => !prev);
  }, []);

  // Keyboard shortcut: Shift + B or Space to toggle Peek Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.shiftKey && (e.key === 'B' || e.key === 'b')) {
        e.preventDefault();
        togglePeekMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePeekMode]);

  // Trigger cinematic background reveal animation on route/page change
  useEffect(() => {
    setIsPageTransitioning(true);
    const timer = setTimeout(() => {
      setIsPageTransitioning(false);
    }, 750);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Auto-rotate backdrops every 45 seconds if enabled
  useEffect(() => {
    if (!isAutoRotate) return;
    const interval = setInterval(() => {
      setSelectedId((prev) => {
        const currentIndex = PETROLEUM_BACKDROPS.findIndex((b) => b.id === prev);
        const nextIndex = (currentIndex + 1) % PETROLEUM_BACKDROPS.length;
        const nextId = PETROLEUM_BACKDROPS[nextIndex].id;
        localStorage.setItem('sih_petroleum_bg_id', nextId);
        return nextId;
      });
    }, 45000);
    return () => clearInterval(interval);
  }, [isAutoRotate]);

  return (
    <BackgroundContext.Provider
      value={{
        currentBackdrop,
        selectedId,
        setBackdrop,
        isPeekMode,
        setPeekMode: setIsPeekMode,
        togglePeekMode,
        glassIntensity,
        setGlassIntensity: handleSetGlassIntensity,
        isAutoRotate,
        setIsAutoRotate: handleSetAutoRotate,
        isPageTransitioning,
        backdropBrightness,
        setBackdropBrightness: handleSetBrightness,
        allBackdrops: PETROLEUM_BACKDROPS,
      }}
    >
      {children}
    </BackgroundContext.Provider>
  );
};

export const usePetroleumBackground = () => {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('usePetroleumBackground must be used within a BackgroundProvider');
  }
  return context;
};
