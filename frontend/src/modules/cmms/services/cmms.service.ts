/** CMMS Service - TODO: Gestão de manutenção */
import api, { extractData } from '../../../core/utils/api';
import { Asset, MaintenanceOrder } from '../types';

/** TODO: Listar ativos */
export const getAssets = async (): Promise<Asset[]> => {
  const response = await api.get('/cmms/assets');
  return extractData(response);
};

/** TODO: Criar ordem de manutenção */
export const createOrder = async (data: Partial<MaintenanceOrder>): Promise<MaintenanceOrder> => {
  const response = await api.post('/cmms/orders', data);
  return extractData(response);
};

/** TODO: Buscar ordens pendentes */
export const getPendingOrders = async (): Promise<MaintenanceOrder[]> => {
  const response = await api.get('/cmms/orders', { params: { status: 'open,in_progress' } });
  return extractData(response);
};
