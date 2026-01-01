/**
 * Gatekeeper Service
 *
 * Este serviço encapsula as chamadas ao Gatekeeper, responsável por gerenciar
 * perfis de atenção, políticas de autonomia e logs de auditoria. Ele permite
 * recuperar e atualizar perfis do usuário, consultar e alterar políticas
 * corporativas (somente admins), listar logs, verificar ações pendentes de
 * aprovação e testar decisões do Gatekeeper para ações específicas【311826376132406†L55-L88】【311826376132406†L169-L233】.
 */

import api, { extractData } from '../../../core/utils/api';

// =========================================
// Perfis de atenção
// =========================================

/**
 * Recupera o perfil de atenção do usuário logado【311826376132406†L55-L88】.
 */
export const getAttentionProfile = async (): Promise<any> => {
  const response = await api.get('/gatekeeper/profile');
  return extractData(response);
};

/**
 * Atualiza o perfil de atenção do usuário logado【311826376132406†L94-L129】.
 *
 * @param data Objeto com campos opcionais: `level`, `quietHours`, `channels`, `vipList` e `autonomy`.
 */
export const updateAttentionProfile = async (data: any): Promise<any> => {
  const response = await api.patch('/gatekeeper/profile', data);
  return extractData(response);
};

// =========================================
// Logs e ações
// =========================================

/**
 * Lista logs de decisões do Gatekeeper para o usuário atual. É possível
 * filtrar por ação e decisão, além de paginar com `limit` e `offset`【311826376132406†L136-L162】.
 *
 * @param params Query params como `limit`, `offset`, `action` e `decision`.
 */
export const getGatekeeperLogs = async (
  params?: Record<string, string | number>
): Promise<{ data: any[]; pagination: { total: number; limit: number; offset: number } }> => {
  const response = await api.get('/gatekeeper/logs', { params });
  return extractData(response);
};

/**
 * Recupera as ações pendentes de aprovação (decisões `SUGGEST`) do Gatekeeper【311826376132406†L236-L257】.
 */
export const getPendingActions = async (): Promise<any[]> => {
  const response = await api.get('/gatekeeper/pending-actions');
  return extractData(response);
};

// =========================================
// Política corporativa (admin)
// =========================================

/**
 * Obtém a política de Gatekeeper da empresa. Apenas admins podem acessar【311826376132406†L169-L186】.
 */
export const getCompanyPolicy = async (): Promise<any> => {
  const response = await api.get('/gatekeeper/policy');
  return extractData(response);
};

/**
 * Atualiza a política do Gatekeeper da empresa. Apenas admins/super admins podem atualizar【311826376132406†L194-L231】.
 *
 * @param data Objeto contendo campos opcionais `maxAutonomy`, `forbidden`, `auditRules` e `rateLimits`.
 */
export const updateCompanyPolicy = async (data: any): Promise<any> => {
  const response = await api.patch('/gatekeeper/policy', data);
  return extractData(response);
};

// =========================================
// Teste de decisão
// =========================================

/**
 * Testa uma ação no Gatekeeper e retorna a decisão (EXECUTE, SUGGEST, LOG_ONLY, BLOCK) com a razão【311826376132406†L265-L289】.
 *
 * @param payload Objeto contendo `action` e contexto opcional (`context`).
 */
export const testGatekeeper = async (payload: { action: string; context?: any }): Promise<any> => {
  const response = await api.post('/gatekeeper/test', payload);
  return extractData(response);
};
