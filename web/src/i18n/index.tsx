// i18n System
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ptBR, Translation } from './pt-BR';
import { enUS } from './en-US';

export type Locale = 'pt-BR' | 'en-US';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translation;
}

const translations: Record<Locale, Translation> = {
  'pt-BR': ptBR,
  'en-US': enUS,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: React.ReactNode;
  defaultLocale?: Locale;
}

export function I18nProvider({ children, defaultLocale = 'pt-BR' }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Try to get from localStorage
    const saved = localStorage.getItem('locale') as Locale;
    return saved || defaultLocale;
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    // Update HTML lang attribute
    document.documentElement.lang = newLocale;
  };

  useEffect(() => {
    // Set initial HTML lang attribute
    document.documentElement.lang = locale;
  }, []);

  const value: I18nContextType = {
    locale,
    setLocale,
    t: translations[locale],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}

// Helper hook for easier access to translations
export function useT() {
  const { t } = useTranslation();
  return t;
}

// Export translations for direct use if needed
export { ptBR, enUS };
export type { Translation };
