// Type definitions for Express Request extensions
import { AuthenticatedUser } from '../../core/types';

declare global {
  namespace Express {
    interface Request {
      // Authentication
      user?: AuthenticatedUser & {
        timezone?: string;
      };
      companyId?: string;

      // API Key
      apiKeyScopes?: string[];

      // Internationalization
      locale?: string;
      t?: (key: string, params?: Record<string, any>) => string;

      // Timezone
      timezone?: string;
      toUserTimezone?: (date: Date) => Date;
      toUTC?: (date: Date) => Date;
      formatDate?: (date: Date, options?: Intl.DateTimeFormatOptions) => string;

      // Logging & Tracing
      traceId?: string;
      log?: any;
    }
  }
}

export {};
