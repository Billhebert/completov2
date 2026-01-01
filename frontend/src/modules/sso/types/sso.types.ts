/**
 * SSO Types
 */

export interface SSOProvider {
  id: string;
  name: string;
  type: 'oauth2' | 'saml' | 'ldap';
  isActive: boolean;
  config: Record<string, unknown>;
  usersCount: number;
  createdAt: string;
}

export interface SSOConnection {
  id: string;
  providerId: string;
  providerName: string;
  userId: string;
  externalId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
