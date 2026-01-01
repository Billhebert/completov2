/** Gatekeeper Service - TODO: Feature flags e controle de acesso */
import api, { extractData } from '../../../core/utils/api';
import { Feature, FeatureUsage } from '../types';

/** TODO: Listar feature flags */
export const getFeatures = async (): Promise<Feature[]> => {
  const response = await api.get('/gatekeeper/features');
  return extractData(response);
};

/** TODO: Verificar se feature está habilitada para usuário */
export const isFeatureEnabled = async (featureKey: string): Promise<boolean> => {
  const response = await api.get(`/gatekeeper/features/${featureKey}/check`);
  return extractData(response);
};

/** TODO: Atualizar feature flag */
export const updateFeature = async (id: string, data: Partial<Feature>): Promise<Feature> => {
  const response = await api.put(`/gatekeeper/features/${id}`, data);
  return extractData(response);
};
