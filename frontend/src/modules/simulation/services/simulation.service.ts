/** Simulation Service - TODO: Simulações e projeções */
import api, { extractData } from '../../../core/utils/api';
import { Simulation } from '../types';

/** TODO: Criar simulação */
export const createSimulation = async (data: Partial<Simulation>): Promise<Simulation> => {
  const response = await api.post('/simulations', data);
  return extractData(response);
};

/** TODO: Executar simulação */
export const runSimulation = async (id: string): Promise<Simulation> => {
  const response = await api.post(`/simulations/${id}/run`);
  return extractData(response);
};

/** TODO: Buscar resultados */
export const getSimulation = async (id: string): Promise<Simulation> => {
  const response = await api.get(`/simulations/${id}`);
  return extractData(response);
};
