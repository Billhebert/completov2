// src/core/i18n/index.ts
import { Request, Response, NextFunction } from 'express';
import en from './locales/en.json';
import pt from './locales/pt.json';
import es from './locales/es.json';

type TranslationKey = string;
type Translations = Record<string, any>;

const translations: Record<string, Translations> = {
  en,
  pt,
  es,
};

export const supportedLocales = ['en', 'pt', 'es'];
export const defaultLocale = 'en';

/**
 * Get nested value from object by path
 */
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Translate a key
 */
export function translate(
  key: TranslationKey,
  locale = defaultLocale,
  params?: Record<string, string | number>
): string {
  const translation = getNestedValue(translations[locale], key);
  
  if (!translation) {
    // Fallback to English
    const fallback = getNestedValue(translations[defaultLocale], key);
    if (!fallback) return key;
    
    if (!params) return fallback;
    
    return Object.entries(params).reduce(
      (str, [param, value]) => str.replace(`{{${param}}}`, String(value)),
      fallback
    );
  }

  if (!params) return translation;

  return Object.entries(params).reduce(
    (str, [param, value]) => str.replace(`{{${param}}}`, String(value)),
    translation
  );
}

/**
 * Shorthand for translate
 */
export const t = translate;

/**
 * I18n middleware - detects locale from Accept-Language header
 */
export function i18nMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check for locale in:
  // 1. Query parameter: ?locale=pt
  // 2. Header: Accept-Language
  // 3. User preference (if authenticated)
  
  let locale = defaultLocale;

  // Query parameter
  if (req.query.locale && supportedLocales.includes(req.query.locale as string)) {
    locale = req.query.locale as string;
  }
  // Accept-Language header
  else if (req.headers['accept-language']) {
    const acceptLanguage = req.headers['accept-language'];
    const preferredLocale = acceptLanguage.split(',')[0].split('-')[0];
    
    if (supportedLocales.includes(preferredLocale)) {
      locale = preferredLocale;
    }
  }

  // Attach locale and translator to request
  req.locale = locale;
  req.t = (key: string, params?: Record<string, string | number>) =>
    translate(key, locale, params);

  next();
}

/**
 * Get all translations for a locale
 */
export function getTranslations(locale: string): Translations {
  return translations[locale] || translations[defaultLocale];
}

/**
 * Add or update translation
 */
export function addTranslation(locale: string, key: string, value: string) {
  if (!translations[locale]) {
    translations[locale] = {};
  }

  const keys = key.split('.');
  let current = translations[locale];

  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;
}
