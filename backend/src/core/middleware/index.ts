// src/core/middleware/index.ts
export * from './auth';
export * from './validate';
export * from './error-handler';
export * from './rbac';
export * from './tenant';
export * from './rate-limit';

// Permissions
export {
  Permission,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  hasPermission,
} from './permissions';

// API Key Authentication
export {
  authenticateApiKey,
  requireScope,
} from './api-key';
