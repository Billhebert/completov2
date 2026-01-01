/** Services Service - TODO: Monitorar serviços externos */
import api, { extractData } from '../../../core/utils/api';
import { ExternalService, ServiceCall } from '../types';

/** TODO: Listar serviços externos */
export const getServices = async (): Promise<ExternalService[]> => {
  const response = await api.get('/services');
  return extractData(response);
};

/** TODO: Verificar saúde de todos os serviços */
export const checkHealth = async (): Promise<Record<string, boolean>> => {
  const response = await api.get('/services/health');
  return extractData(response);
};

/** TODO: Buscar histórico de chamadas a serviços */
export const getServiceCalls = async (serviceId: string): Promise<ServiceCall[]> => {
  const response = await api.get(`/services/${serviceId}/calls`);
  return extractData(response);
};
