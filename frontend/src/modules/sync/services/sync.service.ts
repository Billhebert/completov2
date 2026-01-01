/** Sync Service - TODO: Sincronização entre sistemas */
import api, { extractData } from '../../../core/utils/api';
import { SyncConfig, SyncExecution } from '../types';

/** TODO: Listar configurações de sync */
export const getConfigs = async (): Promise<SyncConfig[]> => {
  const response = await api.get('/sync/configs');
  return extractData(response);
};

/** TODO: Executar sync manualmente */
export const executeSync = async (configId: string): Promise<SyncExecution> => {
  const response = await api.post(`/sync/configs/${configId}/execute`);
  return extractData(response);
};

/** TODO: Buscar histórico de execuções */
export const getExecutions = async (configId: string): Promise<SyncExecution[]> => {
  const response = await api.get(`/sync/configs/${configId}/executions`);
  return extractData(response);
};
