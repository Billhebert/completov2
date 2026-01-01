/**
 * API Keys Service
 * Usa somente endpoints existentes no backend:
 * - GET    /apikeys
 * - POST   /apikeys
 * - DELETE /apikeys/:id
 * - GET    /apikeys/:id/usage
 */

import api, { extractData } from '../../../core/utils/api';
import type { ApiKey, ApiKeyUsage, CreateApiKeyPayload, CreateApiKeyResponse } from '../types';

/**
 * LISTAR
 */
export const getApiKeys = async (): Promise<ApiKey[]> => {
  const response = await api.get('/apikeys');
  return extractData(response);
};

/**
 * Alias para compatibilidade (se algum lugar chamar getAll)
 */
export const getAll = getApiKeys;

/**
 * CRIAR (schema: name + scopes + expiresAt)
 */
export const createApiKey = async (payload: CreateApiKeyPayload): Promise<CreateApiKeyResponse> => {
  const response = await api.post('/apikeys', payload);
  return extractData(response);
};

/**
 * REVOGAR / DELETAR
 */
export const revokeApiKey = async (id: string): Promise<void> => {
  await api.delete(`/apikeys/${id}`);
};

/**
 * USO / AUDITORIA
 */
export const getKeyUsage = async (keyId: string): Promise<ApiKeyUsage[]> => {
  const response = await api.get(`/apikeys/${keyId}/usage`);
  return extractData(response);
};
