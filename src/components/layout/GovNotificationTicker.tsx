import React, { useState, useEffect } from 'react';
import { Volume2, Pause, Play, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

interface NoticeItem {
  id: string;
  tag: string;
  text: string;
  link?: string;
  isUrgent?: boolean;
}

const NOTICES: NoticeItem[] = [
  {
    id: '1',
    tag: 'PROCUREMENT COMPLIANCE',
    text: 'Bid verification assessments require officer review before final qualification (GeM Tender Rules).',
    isUrgent: true,
  },
  {
    id: '2',
    tag: 'EVIDENCE VERIFICATION',
    text: 'Document verification results are generated from submitted evidence and configured verification sources.',
  },
  {
    id: '3',
    tag: 'ADVISORY NOTICE',
    text: 'AI-generated compliance assessments are advisory and require officer review and signature.',
    isUrgent: true,
  },
  {
    id: '4',
    tag: 'SANDBOX ADAPTERS',
    text: 'Sandbox verification sources are currently enabled for this demonstration prototype.',
  },
];

export const GovNotificationTicker: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<'marquee' | 'slider'>('marquee');

  useEffect(() => {
    if (mode === 'slider' && !isPaused) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % NOTICES.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [mode, isPaused]);

  return (
    <div className="w-full bg-[#2A0E30] text-white border-y border-[#D97706] shadow-inner select-none font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-8 text-xs">
        {/* Left Official Tag / Badge */}
        <div className="flex items-center space-x-1.5 shrink-0 pr-3 border-r border-purple-900">
          <span className="px-2 py-0.5 bg-[#D97706] text-white font-serif font-bold text-[10px] tracking-wider uppercase rounded-[1px] shadow-sm">
            CIRCULAR
          </span>
          <span className="hidden sm:inline font-sans text-[11px] font-semibold text-[#FBBF24]">
            NOTICES / सूचनाएं:
          </span>
        </div>

        {/* Center Scrolling / Marquee Container */}
        <div
          className="flex-1 overflow-hidden relative mx-3 h-full flex items-center cursor-pointer"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          title="Hover to pause notice stream"
        >
          {mode === 'marquee' ? (
            <div
              className={`flex items-center space-x-8 whitespace-nowrap ${
                isPaused ? '' : 'gov-marquee-track'
              }`}
            >
              {NOTICES.concat(NOTICES).map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="inline-flex items-center space-x-2 text-[11px] sm:text-xs">
                  <span
                    className={`font-bold ${
                      item.isUrgent ? 'text-[#F87171]' : 'text-[#FBBF24]'
                    }`}
                  >
                    [{item.tag}]:
                  </span>
                  <span className="text-gray-100 font-sans tracking-wide">
                    {item.text}
                  </span>
                  <span className="text-[#D97706] mx-2">★</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-[11px] sm:text-xs truncate">
              <span
                className={`font-bold shrink-0 ${
                  NOTICES[currentIndex].isUrgent ? 'text-[#F87171]' : 'text-[#FBBF24]'
                }`}
              >
                [{NOTICES[currentIndex].tag}]:
              </span>
              <span className="text-gray-100 font-sans tracking-wide truncate">
                {NOTICES[currentIndex].text}
              </span>
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-1.5 shrink-0 pl-2 border-l border-[#173F67] text-[10px] text-gray-300">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 hover:bg-[#123B63] text-gray-300 hover:text-white rounded-[2px] transition-colors cursor-pointer"
            title={isPaused ? 'Resume Notice Scroll' : 'Pause Notice Scroll'}
          >
            {isPaused ? <Play className="w-3 h-3 text-[#FBBF24]" /> : <Pause className="w-3 h-3" />}
          </button>

          <button
            onClick={() => {
              setMode(mode === 'marquee' ? 'slider' : 'marquee');
            }}
            className="hidden md:inline px-1.5 py-0.5 text-[9px] font-mono uppercase bg-[#0B2A4A] hover:bg-[#123B63] border border-[#173F67] text-gray-300 rounded-[1px]"
            title="Toggle Continuous Marquee / Step Slider"
          >
            {mode === 'marquee' ? 'Ticker' : 'Step'}
          </button>
        </div>
      </div>
    </div>
  );
};
