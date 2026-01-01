/**
 * SSO Service
 * TODO: Implementar Single Sign-On
 */

import api, { extractData } from '../../../core/utils/api';
import { SSOProvider, SSOConnection } from '../types';

/**
 * TODO: Listar provedores SSO configurados
 */
export const getProviders = async (): Promise<SSOProvider[]> => {
  const response = await api.get('/sso/providers');
  return extractData(response);
};

/**
 * TODO: Criar provedor SSO
 * - Validar configurações
 * - Testar conexão
 */
export const createProvider = async (data: Partial<SSOProvider>): Promise<SSOProvider> => {
  const response = await api.post('/sso/providers', data);
  return extractData(response);
};

/**
 * TODO: Iniciar fluxo SSO
 * - Redirecionar para provedor
 * - Retornar URL de callback
 */
export const initiateSSOLogin = async (providerId: string): Promise<{ redirectUrl: string }> => {
  const response = await api.post(`/sso/providers/${providerId}/initiate`);
  return extractData(response);
};

/**
 * TODO: Listar conexões SSO do usuário
 */
export const getUserConnections = async (userId: string): Promise<SSOConnection[]> => {
  const response = await api.get(`/sso/users/${userId}/connections`);
  return extractData(response);
};
