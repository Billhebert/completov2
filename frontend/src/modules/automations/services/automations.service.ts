/** Automations Service - TODO: Workflow automation */
import api, { extractData } from '../../../core/utils/api';
import { Automation, AutomationExecution } from '../types';

/** TODO: Listar automações */
export const getAutomations = async (): Promise<Automation[]> => {
  const response = await api.get('/automations');
  return extractData(response);
};

/** TODO: Criar automação */
export const createAutomation = async (data: Partial<Automation>): Promise<Automation> => {
  const response = await api.post('/automations', data);
  return extractData(response);
};

/** TODO: Testar automação */
export const testAutomation = async (id: string, testData?: Record<string, unknown>): Promise<AutomationExecution> => {
  const response = await api.post(`/automations/${id}/test`, testData);
  return extractData(response);
};

/** TODO: Buscar execuções */
export const getExecutions = async (automationId: string): Promise<AutomationExecution[]> => {
  const response = await api.get(`/automations/${automationId}/executions`);
  return extractData(response);
};
