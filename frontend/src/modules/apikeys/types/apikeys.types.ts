/**
 * API Keys Types
 */

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  permissions: string[];
  expiresAt?: string;
  lastUsedAt?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface ApiKeyUsage {
  keyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  timestamp: string;
}
