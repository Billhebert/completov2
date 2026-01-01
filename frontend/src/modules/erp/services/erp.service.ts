/** ERP Service - TODO: Implementar integração com ERP (SAP, Oracle, TOTVS) */
import api, { extractData } from '../../../core/utils/api';
import { ERPIntegration, ERPSync } from '../types';

/** TODO: Listar integrações ERP configuradas */
export const getIntegrations = async (): Promise<ERPIntegration[]> => {
  const response = await api.get('/erp/integrations');
  return extractData(response);
};

/** TODO: Iniciar sincronização manual - importar/exportar dados */
export const startSync = async (entity: string, action: 'import' | 'export'): Promise<ERPSync> => {
  const response = await api.post('/erp/sync', { entity, action });
  return extractData(response);
};

/** TODO: Buscar histórico de sincronizações */
export const getSyncHistory = async (): Promise<ERPSync[]> => {
  const response = await api.get('/erp/sync/history');
  return extractData(response);
};
