/**
 * People & Growth Service
 * RH, desenvolvimento de pessoas e gestão de performance
 */

import api, { extractData } from '../../../core/utils/api';
import { Employee, Goal, Review, TrainingProgram } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

/**
 * Lista colaboradores
 * TODO: Implementar gestão de pessoas
 * - Cadastro completo de colaboradores
 * - Organograma hierárquico
 * - Skills e competências
 * - Histórico de posições
 * - Documentos e contratos
 */
export const getEmployees = async (params?: PaginationParams): Promise<PaginatedResult<Employee>> => {
  const response = await api.get('/people/employees', { params });
  return extractData(response);
};

/**
 * Gerenciar metas (OKRs/KPIs)
 * TODO: Implementar sistema de metas
 * - Criar metas individuais e de time
 * - Framework OKR (Objectives & Key Results)
 * - Cascata de metas (empresa → time → indivíduo)
 * - Tracking de progresso
 * - Check-ins regulares
 * - Alignment com estratégia
 */
export const getGoals = async (employeeId: string): Promise<Goal[]> => {
  const response = await api.get(\`/people/employees/\${employeeId}/goals\`);
  return extractData(response);
};

/**
 * Criar meta
 * TODO: Implementar criação com validação
 * - Definir objetivo e key results
 * - Período (quarterly, annual)
 * - Owner e contributors
 * - Métricas e targets
 * - Alinhamento com metas superiores
 */
export const createGoal = async (employeeId: string, data: Partial<Goal>): Promise<Goal> => {
  const response = await api.post(\`/people/employees/\${employeeId}/goals\`, data);
  return extractData(response);
};

/**
 * Realizar avaliação de desempenho
 * TODO: Implementar ciclo de avaliação
 * - Reviews periódicas (90 dias, anual)
 * - Auto-avaliação
 * - Avaliação do gestor
 * - Feedback 360° (peers, subordinados)
 * - Calibração entre gestores
 * - PDI (Plano de Desenvolvimento Individual)
 */
export const conductReview = async (employeeId: string, data: Partial<Review>): Promise<Review> => {
  const response = await api.post(\`/people/employees/\${employeeId}/reviews\`, data);
  return extractData(response);
};

/**
 * Gerenciar treinamentos
 * TODO: Implementar LMS (Learning Management)
 * - Catálogo de treinamentos
 * - Inscrições e aprovações
 * - Tracking de conclusão
 * - Certificações
 * - Budget de treinamento
 * - Matriz de competências
 */
export const getTrainingPrograms = async (): Promise<TrainingProgram[]> => {
  const response = await api.get('/people/training-programs');
  return extractData(response);
};
