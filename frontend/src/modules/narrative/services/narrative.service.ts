/** Narrative Service - TODO: Insights narrativos gerados por IA */
import api, { extractData } from '../../../core/utils/api';
import { Narrative } from '../types';

/** TODO: Buscar narrativas */
export const getNarratives = async (entityType?: string): Promise<Narrative[]> => {
  const response = await api.get('/narratives', { params: { entityType } });
  return extractData(response);
};

/** TODO: Gerar narrativa para entidade */
export const generateNarrative = async (entityType: string, entityId: string): Promise<Narrative> => {
  const response = await api.post('/narratives/generate', { entityType, entityId });
  return extractData(response);
};
