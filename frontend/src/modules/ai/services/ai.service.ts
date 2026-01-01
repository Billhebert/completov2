/** AI Service - TODO: Modelos de IA e predições */
import api, { extractData } from '../../../core/utils/api';
import { AIModel, Prediction } from '../types';

/** TODO: Listar modelos */
export const getModels = async (): Promise<AIModel[]> => {
  const response = await api.get('/ai/models');
  return extractData(response);
};

/** TODO: Fazer predição */
export const predict = async (modelId: string, input: Record<string, unknown>): Promise<Prediction> => {
  const response = await api.post(`/ai/models/${modelId}/predict`, { input });
  return extractData(response);
};

/** TODO: Treinar modelo */
export const trainModel = async (modelId: string, trainingData: unknown[]): Promise<AIModel> => {
  const response = await api.post(`/ai/models/${modelId}/train`, { trainingData });
  return extractData(response);
};
