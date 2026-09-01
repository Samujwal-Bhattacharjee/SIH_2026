import React, { useState } from 'react';
import { Eye, Type } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const GovTopStrip: React.FC = () => {
  const { language, setLanguage, fontSize, setFontSize, t } = useLanguage();
  const [highContrast, setHighContrast] = useState(false);

  const toggleContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  return (
    <div className="w-full bg-[#1E0922] text-white text-xs select-none border-b border-[#3B1A42] font-sans">
      {/* Indian Tricolour top border */}
      <div className="gov-tricolour-bar" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        {/* Left: Complete Government Attribution Hierarchy */}
        <div className="flex items-center flex-wrap gap-x-1.5 font-medium tracking-wide">
          <span className="font-serif font-bold text-gray-100">{t('gov.india')}</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-200">Government Procurement</span>
          <span className="text-gray-400 hidden sm:inline">|</span>
          <span className="text-[#FF9933] font-semibold hidden sm:inline">CPCL</span>
          <span className="text-gray-400 hidden md:inline">|</span>
          <span className="text-gray-200 hidden md:inline">Ministry of Petroleum &amp; Natural Gas</span>
          <span className="text-gray-400 hidden lg:inline">|</span>
          <span className="font-mono text-[#F3E8FF] text-[10px] hidden lg:inline">SIH26100</span>
        </div>

        {/* Right: Accessibility Controls & Language Switcher */}
        <div className="flex items-center space-x-3">
          <a
            href="#main-content"
            className="text-gray-300 hover:text-white underline text-[11px] hidden sm:inline focus:outline-none focus:ring-1 focus:ring-white"
          >
            {t('gov.skipToMain')}
          </a>

          <span className="text-gray-500 hidden sm:inline">|</span>

          {/* High Contrast / Accessibility Toggle */}
          <button
            onClick={toggleContrast}
            title={highContrast ? "Standard Contrast" : "High Contrast Theme"}
            className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-[2px] text-[11px] transition-colors cursor-pointer ${
              highContrast
                ? 'bg-[#FF9933] text-black font-bold'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">Accessibility</span>
          </button>

          <span className="text-gray-500">|</span>

          {/* Font Resizing Controls */}
          <div className="flex items-center space-x-1" role="group" aria-label="Font Size Controls">
            <button
              onClick={() => setFontSize('small')}
              title="Decrease Font Size (A-)"
              aria-label="Decrease Font Size"
              className={`px-1.5 py-0.5 rounded-[2px] font-mono text-[11px] cursor-pointer transition-colors ${
                fontSize === 'small'
                  ? 'bg-white text-[#4A154B] font-bold shadow-xs'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('normal')}
              title="Default Font Size (A)"
              aria-label="Default Font Size"
              className={`px-1.5 py-0.5 rounded-[2px] font-mono text-[11px] cursor-pointer transition-colors ${
                fontSize === 'normal'
                  ? 'bg-white text-[#4A154B] font-bold shadow-xs'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              title="Increase Font Size (A+)"
              aria-label="Increase Font Size"
              className={`px-1.5 py-0.5 rounded-[2px] font-mono text-[11px] cursor-pointer transition-colors ${
                fontSize === 'large'
                  ? 'bg-white text-[#4A154B] font-bold shadow-xs'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              A+
            </button>
          </div>

          <span className="text-gray-500">|</span>

          {/* Bilingual Switcher */}
          <div className="flex items-center space-x-1 font-medium">
            <button
              onClick={() => setLanguage('en')}
              className={`px-1.5 py-0.5 rounded-[2px] transition-colors cursor-pointer ${
                language === 'en'
                  ? 'bg-[#4A154B] text-white font-bold border border-purple-300/40 shadow-xs'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              English
            </button>
            <span className="text-gray-400">/</span>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-1.5 py-0.5 rounded-[2px] transition-colors cursor-pointer ${
                language === 'hi'
                  ? 'bg-[#4A154B] text-white font-bold border border-purple-300/40 shadow-xs'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
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

export default GovTopStrip;
