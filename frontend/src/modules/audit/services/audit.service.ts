/**
 * Audit Service
 * Endpoints conforme seu arquivo atual:
 * - GET /audit/logs
 * - GET /audit/logs/:id
 * - GET /audit/stats
 * - GET /audit/export (blob)
 * - GET /audit/entity/:entityType/:entityId
 */

import api, { extractData } from '../../../core/utils/api';
import { AuditLog, AuditFilters, AuditStats } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAuditLogs = async (
  params?: PaginationParams & AuditFilters
): Promise<PaginatedResult<AuditLog>> => {
  const response = await api.get('/audit/logs', { params });
  return extractData(response);
};

/**
 * Alias para compatibilidade com a AuditListPage atual
 * (ela chama getAll()).
 */
export const getAll = getAuditLogs;

export const getAuditLogById = async (id: string): Promise<AuditLog> => {
  const response = await api.get(`/audit/logs/${id}`);
  return extractData(response);
};

export const getAuditStats = async (filters?: AuditFilters): Promise<AuditStats> => {
  const response = await api.get('/audit/stats', { params: filters });
  return extractData(response);
};

export const exportAuditLogs = async (filters?: AuditFilters): Promise<Blob> => {
  const response = await api.get('/audit/export', {
    params: filters,
    responseType: 'blob',
  });
  return response.data as Blob;
};

export const getEntityHistory = async (entityType: string, entityId: string): Promise<AuditLog[]> => {
  const response = await api.get(`/audit/entity/${entityType}/${entityId}`);
  return extractData(response);
};
