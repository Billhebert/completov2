/** FSM Service - TODO: Gestão de serviços em campo */
import api, { extractData } from '../../../core/utils/api';
import { ServiceOrder, Technician } from '../types';

/** TODO: Listar ordens de serviço */
export const getServiceOrders = async (): Promise<ServiceOrder[]> => {
  const response = await api.get('/fsm/orders');
  return extractData(response);
};

/** TODO: Atribuir técnico a ordem */
export const assignTechnician = async (orderId: string, technicianId: string): Promise<ServiceOrder> => {
  const response = await api.post(`/fsm/orders/${orderId}/assign`, { technicianId });
  return extractData(response);
};

/** TODO: Buscar técnicos disponíveis */
export const getAvailableTechnicians = async (): Promise<Technician[]> => {
  const response = await api.get('/fsm/technicians', { params: { availability: 'available' } });
  return extractData(response);
};

/** TODO: Otimizar rotas */
export const optimizeRoutes = async (technicianId: string): Promise<ServiceOrder[]> => {
  const response = await api.post(`/fsm/technicians/${technicianId}/optimize-routes`);
  return extractData(response);
};
