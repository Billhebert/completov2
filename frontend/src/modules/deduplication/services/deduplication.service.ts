/** Deduplication Service - TODO: Detecção e merge de duplicatas */
import api, { extractData } from '../../../core/utils/api';
import { Duplicate } from '../types';

/** TODO: Detectar duplicatas */
export const findDuplicates = async (entity: string): Promise<Duplicate[]> => {
  const response = await api.post('/deduplication/find', { entity });
  return extractData(response);
};

/** TODO: Mesclar registros */
export const mergeDuplicates = async (duplicateId: string, masterId: string): Promise<void> => {
  await api.post(`/deduplication/${duplicateId}/merge`, { masterId });
};

/** TODO: Descartar como falso positivo */
export const dismissDuplicate = async (duplicateId: string): Promise<void> => {
  await api.post(`/deduplication/${duplicateId}/dismiss`);
};
