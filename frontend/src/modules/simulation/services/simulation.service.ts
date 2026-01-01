/**
 * Business Simulation Service
 * Simulação de cenários de negócio e what-if analysis
 */

import api, { extractData } from '../../../core/utils/api';
import { Simulation, SimulationResult, SimulationScenario } from '../types';

/**
 * Lista simulações criadas
 * TODO: Implementar gestão de simulações
 * - Listar simulações salvas
 * - Filtrar por tipo (revenue, churn, growth)
 * - Status (running, completed, failed)
 * - Resultados salvos
 */
export const getSimulations = async (): Promise<Simulation[]> => {
  const response = await api.get('/simulations');
  return extractData(response);
};

/**
 * Criar simulação
 * TODO: Implementar engine de simulação
 * - Definir parâmetros da simulação
 * - Múltiplos cenários (pessimista, realista, otimista)
 * - Variáveis e constraints
 * - Período de simulação
 * - Validar viabilidade
 */
export const createSimulation = async (data: Partial<Simulation>): Promise<Simulation> => {
  const response = await api.post('/simulations', data);
  return extractData(response);
};

/**
 * Executar simulação
 * TODO: Implementar processamento assíncrono
 * - Processar em background (pode demorar)
 * - Monte Carlo simulation para incertezas
 * - Calcular múltiplos cenários
 * - Gerar gráficos e visualizações
 * - Notificar quando completar
 */
export const runSimulation = async (id: string): Promise<SimulationResult> => {
  const response = await api.post(\`/simulations/\${id}/run\`);
  return extractData(response);
};

/**
 * Comparar cenários
 * TODO: Implementar comparação side-by-side
 * - Comparar resultados de múltiplos cenários
 * - Destacar diferenças principais
 * - Análise de sensibilidade
 * - Recomendações baseadas em dados
 */
export const compareScenarios = async (simulationId: string, scenarioIds: string[]): Promise<unknown> => {
  const response = await api.post(\`/simulations/\${simulationId}/compare\`, { scenarioIds });
  return extractData(response);
};
