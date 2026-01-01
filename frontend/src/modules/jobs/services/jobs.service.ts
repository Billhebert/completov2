/** Jobs Service - TODO: Scheduled jobs e background tasks */
import api, { extractData } from '../../../core/utils/api';
import { Job, JobExecution } from '../types';

/** TODO: Listar jobs agendados */
export const getJobs = async (): Promise<Job[]> => {
  const response = await api.get('/jobs');
  return extractData(response);
};

/** TODO: Executar job manualmente */
export const runJob = async (id: string): Promise<JobExecution> => {
  const response = await api.post(`/jobs/${id}/run`);
  return extractData(response);
};

/** TODO: Buscar histórico de execuções */
export const getJobExecutions = async (jobId: string): Promise<JobExecution[]> => {
  const response = await api.get(`/jobs/${jobId}/executions`);
  return extractData(response);
};

/** TODO: Pausar/retomar job */
export const toggleJob = async (id: string, isActive: boolean): Promise<Job> => {
  const response = await api.patch(`/jobs/${id}`, { isActive });
  return extractData(response);
};
