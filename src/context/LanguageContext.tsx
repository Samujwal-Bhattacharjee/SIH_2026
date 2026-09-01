import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../i18n/en';
import { hi } from '../i18n/hi';

type Language = 'en' | 'hi';
type TranslationKey = keyof typeof en;

export type FontSize = 'small' | 'normal' | 'large';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, fallback?: string) => string;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
}

const translations = { en, hi };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('gov_lang') as Language) || 'en';
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    const saved = localStorage.getItem('gov_font_size');
    if (saved === 'small' || saved === 'normal' || saved === 'large') return saved;
    return 'normal';
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return localStorage.getItem('gov_high_contrast') === 'true';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('gov_lang', lang);
    document.documentElement.lang = lang;
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem('gov_font_size', size);
    document.documentElement.setAttribute('data-font-size', size);
    if (size === 'small') {
      document.documentElement.style.fontSize = '12px';
    } else if (size === 'normal') {
      document.documentElement.style.fontSize = '14px';
    } else if (size === 'large') {
      document.documentElement.style.fontSize = '16.5px';
    }
  };

  const setHighContrast = (val: boolean) => {
    setHighContrastState(val);
    localStorage.setItem('gov_high_contrast', String(val));
    if (val) {
      document.documentElement.classList.add('gov-high-contrast');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('gov-high-contrast');
      document.documentElement.removeAttribute('data-theme');
    }
  };

  useEffect(() => {
    setFontSize(fontSize);
    setLanguage(language);
    if (highContrast) {
      document.documentElement.classList.add('gov-high-contrast');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const t = (key: TranslationKey, fallback?: string): string => {
    const dict = translations[language] || translations.en;
    return dict[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
