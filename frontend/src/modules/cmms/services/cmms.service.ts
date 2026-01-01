/**
 * CMMS Service
 * Computerized Maintenance Management System
 */

import api, { extractData } from '../../../core/utils/api';
import { Asset, MaintenanceOrder, PreventivePlan } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

/**
 * Lista ativos
 * TODO: Implementar gestão de ativos
 * - Cadastro completo de equipamentos
 * - Hierarquia de ativos (localização, sistema)
 * - Status operacional em tempo real
 * - Histórico de manutenções
 * - Documentação técnica
 * - QR codes para identificação
 */
export const getAssets = async (params?: PaginationParams): Promise<PaginatedResult<Asset>> => {
  const response = await api.get('/cmms/assets', { params });
  return extractData(response);
};

/**
 * Criar ordem de manutenção
 * TODO: Implementar ordens de serviço
 * - Manutenção corretiva (breakdown)
 * - Manutenção preventiva (scheduled)
 * - Manutenção preditiva (condition-based)
 * - Atribuir técnicos
 * - Peças e materiais necessários
 * - SLA e priorização
 */
export const createMaintenanceOrder = async (data: Partial<MaintenanceOrder>): Promise<MaintenanceOrder> => {
  const response = await api.post('/cmms/maintenance-orders', data);
  return extractData(response);
};

/**
 * Buscar ordens de manutenção
 * TODO: Implementar dashboard de manutenção
 * - Ordens abertas/em andamento/concluídas
 * - Filtros por ativo, técnico, prioridade
 * - Métricas: MTBF, MTTR, disponibilidade
 * - Agenda de manutenções preventivas
 */
export const getMaintenanceOrders = async (params?: PaginationParams): Promise<PaginatedResult<MaintenanceOrder>> => {
  const response = await api.get('/cmms/maintenance-orders', { params });
  return extractData(response);
};

/**
 * Gerenciar planos preventivos
 * TODO: Implementar manutenção preventiva
 * - Planos baseados em tempo (mensal, anual)
 * - Planos baseados em uso (horas, ciclos)
 * - Checklists de inspeção
 * - Geração automática de ordens
 * - Histórico de execuções
 */
export const getPreventivePlans = async (): Promise<PreventivePlan[]> => {
  const response = await api.get('/cmms/preventive-plans');
  return extractData(response);
};

/**
 * Registrar leitura de medidor
 * TODO: Implementar tracking de medidores
 * - Registrar leituras (horímetro, odômetro)
 * - Calcular uso desde última manutenção
 * - Alertar quando atingir threshold
 * - Gráficos de evolução
 */
export const recordMeterReading = async (assetId: string, meterId: string, value: number): Promise<void> => {
  await api.post(\`/cmms/assets/\${assetId}/meters/\${meterId}/readings\`, { value });
};
