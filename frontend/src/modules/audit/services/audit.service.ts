/**
 * Audit Service
 * TODO: Implementar serviço de auditoria e logs
 */

import api, { extractData } from '../../../core/utils/api';
import { AuditLog, AuditFilters, AuditStats } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

/**
 * TODO: Implementar busca de logs de auditoria
 * - Suportar filtros por ação, entidade, usuário, data
 * - Ordenar por data (mais recentes primeiro)
 * - Suportar busca textual no conteúdo
 */
export const getAuditLogs = async (
  params?: PaginationParams & AuditFilters
): Promise<PaginatedResult<AuditLog>> => {
  const response = await api.get('/audit/logs', { params });
  return extractData(response);
};

/**
 * TODO: Implementar busca de log específico por ID
 * - Incluir detalhes completos das mudanças
 * - Incluir contexto adicional se disponível
 */
export const getAuditLogById = async (id: string): Promise<AuditLog> => {
  const response = await api.get(`/audit/logs/${id}`);
  return extractData(response);
};

/**
 * TODO: Implementar busca de estatísticas de auditoria
 * - Total de logs
 * - Ações mais comuns
 * - Usuários mais ativos
 * - Atividade recente
 */
export const getAuditStats = async (filters?: AuditFilters): Promise<AuditStats> => {
  const response = await api.get('/audit/stats', { params: filters });
  return extractData(response);
};

/**
 * TODO: Implementar exportação de logs
 * - Suportar formatos CSV e JSON
 * - Aplicar mesmos filtros da listagem
 * - Limitar tamanho da exportação
 */
export const exportAuditLogs = async (filters?: AuditFilters): Promise<Blob> => {
  const response = await api.get('/audit/export', {
    params: filters,
    responseType: 'blob',
  });
  return response.data;
};

/**
 * TODO: Implementar busca de histórico de uma entidade específica
 * - Mostrar todas as mudanças em uma entidade ao longo do tempo
 * - Incluir quem fez cada mudança
 */
export const getEntityHistory = async (
  entityType: string,
  entityId: string
): Promise<AuditLog[]> => {
  const response = await api.get(`/audit/entity/${entityType}/${entityId}`);
  return extractData(response);
};
