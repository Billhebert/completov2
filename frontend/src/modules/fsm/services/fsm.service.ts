/**
 * FSM Service
 * Field Service Management - Gestão de Serviços de Campo
 */

import api, { extractData } from '../../../core/utils/api';
import { ServiceOrder, Technician, Route } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

/**
 * Lista ordens de serviço
 * TODO: Implementar gestão de OS
 * - Criar OS de campo
 * - Agendar visitas técnicas
 * - Atribuir técnicos
 * - Status em tempo real
 * - Checkins e fotos
 * - Assinaturas digitais
 */
export const getServiceOrders = async (params?: PaginationParams): Promise<PaginatedResult<ServiceOrder>> => {
  const response = await api.get('/fsm/service-orders', { params });
  return extractData(response);
};

/**
 * Criar ordem de serviço
 * TODO: Implementar criação com validações
 * - Dados do cliente e local
 * - Tipo de serviço e SLA
 * - Peças e equipamentos necessários
 * - Skill requirements
 * - Janela de atendimento preferida
 */
export const createServiceOrder = async (data: Partial<ServiceOrder>): Promise<ServiceOrder> => {
  const response = await api.post('/fsm/service-orders', data);
  return extractData(response);
};

/**
 * Otimizar rotas de técnicos
 * TODO: Implementar otimização de rotas
 * - Algoritmo de roteamento (TSP, VRP)
 * - Considerar tráfego em tempo real
 * - Minimizar tempo/distância
 * - Respeitar skills e disponibilidade
 * - Reotimizar ao adicionar urgências
 */
export const optimizeRoutes = async (date: string, technicianIds?: string[]): Promise<Route[]> => {
  const response = await api.post('/fsm/routes/optimize', { date, technicianIds });
  return extractData(response);
};

/**
 * Tracking de técnicos
 * TODO: Implementar rastreamento em tempo real
 * - GPS tracking de técnicos em campo
 * - ETA para próximos atendimentos
 * - Notificar cliente sobre chegada
 * - Registrar checkin/checkout
 * - Fotos e evidências
 */
export const getTechnicianLocation = async (technicianId: string): Promise<{ lat: number; lng: number; timestamp: string }> => {
  const response = await api.get(\`/fsm/technicians/\${technicianId}/location\`);
  return extractData(response);
};

/**
 * Gerenciar agenda de técnicos
 * TODO: Implementar calendário inteligente
 * - Visualização de agenda (dia, semana)
 * - Drag-and-drop para reagendar
 * - Bloqueios (férias, treinamento)
 * - Capacidade por skill
 * - SLA warnings
 */
export const getTechnicianSchedule = async (technicianId: string, startDate: string, endDate: string): Promise<ServiceOrder[]> => {
  const response = await api.get(\`/fsm/technicians/\${technicianId}/schedule\`, {
    params: { startDate, endDate }
  });
  return extractData(response);
};
