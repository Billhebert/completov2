/**
 * Background Jobs Service
 * Gerenciamento de tarefas agendadas e processamento assíncrono
 */

import api, { extractData } from '../../../core/utils/api';
import { Job, JobExecution, JobSchedule } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

/**
 * Lista jobs agendados
 * TODO: Implementar gestão de jobs
 * - Listar todos jobs (ativos/inativos)
 * - Próxima execução agendada
 * - Última execução e status
 * - Estatísticas (success rate, avg duration)
 * - Filtrar por tipo ou status
 */
export const getJobs = async (params?: PaginationParams): Promise<PaginatedResult<Job>> => {
  const response = await api.get('/jobs', { params });
  return extractData(response);
};

/**
 * Criar novo job agendado
 * TODO: Implementar agendamento flexível
 * - Cron expression para agendamento
 * - Helper para configurar schedules comuns
 * - Validar cron syntax
 * - Timezone support
 * - Retry policy configurável
 */
export const createJob = async (data: Partial<Job>): Promise<Job> => {
  const response = await api.post('/jobs', data);
  return extractData(response);
};

/**
 * Executar job imediatamente
 * TODO: Implementar execução manual
 * - Executar job fora do agendamento
 * - Passar parâmetros customizados
 * - Não afetar próximo agendamento
 * - Retornar jobId para tracking
 */
export const runJobNow = async (jobId: string, params?: Record<string, unknown>): Promise<JobExecution> => {
  const response = await api.post(\`/jobs/\${jobId}/run\`, { params });
  return extractData(response);
};

/**
 * Buscar histórico de execuções
 * TODO: Implementar logs detalhados
 * - Histórico de execuções
 * - Status e duração
 * - Logs de stdout/stderr
 * - Erros e stack traces
 * - Métricas de performance
 */
export const getJobExecutions = async (jobId: string, params?: PaginationParams): Promise<PaginatedResult<JobExecution>> => {
  const response = await api.get(\`/jobs/\${jobId}/executions\`, { params });
  return extractData(response);
};

/**
 * Pausar/resumir job
 * TODO: Implementar controle de execução
 * - Pausar job temporariamente
 * - Não executar enquanto pausado
 * - Resumir preservando schedule
 * - Não perder execuções perdidas (catch-up)
 */
export const toggleJobStatus = async (jobId: string, paused: boolean): Promise<Job> => {
  const response = await api.patch(\`/jobs/\${jobId}\`, { paused });
  return extractData(response);
};
