// src/core/timezone/index.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Common timezones
 */
export const commonTimezones = {
  'America/New_York': 'Eastern Time (US & Canada)',
  'America/Chicago': 'Central Time (US & Canada)',
  'America/Denver': 'Mountain Time (US & Canada)',
  'America/Los_Angeles': 'Pacific Time (US & Canada)',
  'America/Sao_Paulo': 'Brasilia',
  'America/Mexico_City': 'Mexico City',
  'Europe/London': 'London',
  'Europe/Paris': 'Paris',
  'Europe/Berlin': 'Berlin',
  'Europe/Madrid': 'Madrid',
  'Asia/Tokyo': 'Tokyo',
  'Asia/Shanghai': 'Beijing',
  'Asia/Dubai': 'Dubai',
  'Australia/Sydney': 'Sydney',
  'Pacific/Auckland': 'Auckland',
  UTC: 'UTC',
};

/**
 * Get timezone from various sources
 */
export function detectTimezone(req: Request): string {
  // Priority:
  // 1. User preference (if authenticated)
  // 2. Query parameter
  // 3. Header
  // 4. Default to UTC

  // Query parameter
  if (req.query.timezone && typeof req.query.timezone === 'string') {
    return req.query.timezone;
  }

  // Custom header
  if (req.headers['x-timezone']) {
    return req.headers['x-timezone'] as string;
  }

  // User preference (would need to be set in user profile)
  if (req.user?.timezone) {
    return req.user.timezone;
  }

  // Default
  return 'UTC';
}

/**
 * Convert UTC date to user timezone
 */
export function toUserTimezone(date: Date, timezone: string): Date {
  // Using Intl.DateTimeFormat for timezone conversion
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const offset = tzDate.getTime() - utcDate.getTime();
  
  return new Date(date.getTime() + offset);
}

/**
 * Convert user timezone to UTC
 */
export function toUTC(date: Date, timezone: string): Date {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const offset = tzDate.getTime() - utcDate.getTime();
  
  return new Date(date.getTime() - offset);
}

/**
 * Format date for user timezone
 */
export function formatDate(
  date: Date,
  timezone: string,
  locale = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
    ...options,
  };

  return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
}

/**
 * Get timezone offset in hours
 */
export function getTimezoneOffset(timezone: string): number {
  const now = new Date();
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  
  return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
}

/**
 * Check if timezone is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Middleware to attach timezone utilities to request
 */
export function timezoneMiddleware(req: Request, res: Response, next: NextFunction) {
  const timezone = detectTimezone(req);

  // Validate timezone
  if (!isValidTimezone(timezone)) {
    req.timezone = 'UTC';
  } else {
    req.timezone = timezone;
  }

  // Attach utility functions to request
  req.toUserTimezone = (date: Date) => toUserTimezone(date, req.timezone!);
  req.toUTC = (date: Date) => toUTC(date, req.timezone!);
  req.formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) =>
    formatDate(date, req.timezone!, req.locale || 'en-US', options);

  next();
}

/**
 * Transform dates in response to user timezone
 */
export function transformDatesMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);

  res.json = function (data: any) {
    if (req.query.convertTimezone === 'true' && req.timezone) {
      const transformed = transformDates(data, req.timezone);
      return originalJson(transformed);
    }
    return originalJson(data);
  };

  next();
}

/**
 * Recursively transform dates in an object
 */
function transformDates(obj: any, timezone: string): any {
  if (obj === null || obj === undefined) return obj;

  // Date object
  if (obj instanceof Date) {
    return {
      utc: obj.toISOString(),
      local: formatDate(obj, timezone),
      timezone,
    };
  }

  // Array
  if (Array.isArray(obj)) {
    return obj.map((item) => transformDates(item, timezone));
  }

  // Object
  if (typeof obj === 'object') {
    const transformed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      transformed[key] = transformDates(value, timezone);
    }
    return transformed;
  }

  return obj;
}

/**
 * Get business hours for timezone
 */
export function getBusinessHours(timezone: string): { start: number; end: number } {
  // Default: 9 AM - 6 PM
  return {
    start: 9,
    end: 18,
  };
}

/**
 * Check if current time is within business hours
 */
export function isBusinessHours(timezone: string): boolean {
  const now = new Date();
  const hours = parseInt(
    formatDate(now, timezone, 'en-US', {
      hour: '2-digit',
      hour12: false,
    }).split(':')[0]
  );

  const businessHours = getBusinessHours(timezone);
  return hours >= businessHours.start && hours < businessHours.end;
}

/**
 * Calculate next business day
 */
export function nextBusinessDay(timezone: string, date = new Date()): Date {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  // Skip weekends
  while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
    nextDay.setDate(nextDay.getDate() + 1);
  }

  return nextDay;
}
