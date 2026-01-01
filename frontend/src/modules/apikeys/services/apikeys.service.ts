/**
 * API Keys Service
 * TODO: Implementar gestão de API keys
 */

import api, { extractData } from '../../../core/utils/api';
import { ApiKey, ApiKeyUsage } from '../types';

/**
 * TODO: Listar API keys do usuário
 * - Ocultar chave completa (mostrar apenas prefixo)
 * - Mostrar data de último uso
 */
export const getApiKeys = async (): Promise<ApiKey[]> => {
  const response = await api.get('/apikeys');
  return extractData(response);
};

/**
 * TODO: Criar nova API key
 * - Gerar chave aleatória segura
 * - Retornar chave completa apenas uma vez
 * - Validar permissões
 */
export const createApiKey = async (
  name: string,
  permissions: string[],
  expiresAt?: string
): Promise<{ apiKey: ApiKey; key: string }> => {
  const response = await api.post('/apikeys', { name, permissions, expiresAt });
  return extractData(response);
};

/**
 * TODO: Revogar API key
 */
export const revokeApiKey = async (id: string): Promise<void> => {
  await api.delete(`/apikeys/${id}`);
};

/**
 * TODO: Buscar uso da API key
 */
export const getKeyUsage = async (keyId: string): Promise<ApiKeyUsage[]> => {
  const response = await api.get(`/apikeys/${keyId}/usage`);
  return extractData(response);
};
