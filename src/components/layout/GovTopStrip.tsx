import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const GovTopStrip: React.FC = () => {
  const { language, setLanguage, fontSize, setFontSize, t } = useLanguage();

  return (
    <div className="w-full bg-[#071A2E] text-white text-xs select-none border-b border-[#0B2A4A]">
      {/* Indian Tricolour top border */}
      <div className="gov-tricolour-bar" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        {/* Left: Ministry & Country Attribution */}
        <div className="flex items-center space-x-2 font-medium tracking-wide">
          <span className="font-serif">{t('gov.india')}</span>
          <span className="text-gray-400">|</span>
          <span className="hidden md:inline text-gray-200">{t('gov.ministry')}</span>
        </div>

        {/* Right: Accessibility Controls & Language Switcher */}
        <div className="flex items-center space-x-4">
          <a
            href="#main-content"
            className="text-gray-300 hover:text-white underline text-[11px] hidden sm:inline"
          >
            {t('gov.skipToMain')}
          </a>

          <span className="text-gray-500 hidden sm:inline">|</span>

          {/* Font Resizing Controls */}
          <div className="flex items-center space-x-1">
            <span className="text-gray-400 hidden lg:inline mr-1">{t('gov.fontSize')}:</span>
            <button
              onClick={() => setFontSize('normal')}
              title="Standard Font Size"
              className={`px-1.5 py-0.5 rounded-[2px] font-mono text-[11px] ${
                fontSize === 'normal'
                  ? 'bg-white text-[#0B2A4A] font-bold'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('large')}
              title="Large Font Size"
              className={`px-1.5 py-0.5 rounded-[2px] font-mono text-[11px] ${
                fontSize === 'large'
                  ? 'bg-white text-[#0B2A4A] font-bold'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('larger')}
              title="Extra Large Font Size"
              className={`px-1.5 py-0.5 rounded-[2px] font-mono text-[11px] ${
                fontSize === 'larger'
                  ? 'bg-white text-[#0B2A4A] font-bold'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              A+
            </button>
          </div>

          <span className="text-gray-500">|</span>

          {/* Bilingual Switcher */}
          <div className="flex items-center space-x-1.5 font-medium">
            <button
              onClick={() => setLanguage('en')}
              className={`px-1.5 py-0.5 rounded-[2px] transition-colors ${
                language === 'en'
                  ? 'bg-[#123B63] text-white font-bold border border-white/30'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              English
            </button>
            <span className="text-gray-400">/</span>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-1.5 py-0.5 rounded-[2px] transition-colors ${
                language === 'hi'
                  ? 'bg-[#123B63] text-white font-bold border border-white/30'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
