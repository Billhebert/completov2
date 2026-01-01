/**
 * Feature Flags Service (Gatekeeper)
 * Gerenciamento de feature flags e rollout gradual
 */

import api, { extractData } from '../../../core/utils/api';
import { Feature, FeatureEvaluation, RolloutRule } from '../types';

/**
 * Lista todas as features
 * TODO: Implementar gestão completa de feature flags
 * - Listar todas features configuradas
 * - Status de cada feature (enabled/disabled/rollout)
 * - Porcentagem de rollout
 * - Targeting rules
 * - Histórico de mudanças
 */
export const getFeatures = async (): Promise<Feature[]> => {
  const response = await api.get('/gatekeeper/features');
  return extractData(response);
};

/**
 * Criar nova feature flag
 * TODO: Implementar criação com regras
 * - Nome e descrição da feature
 * - Status inicial (disabled por padrão)
 * - Definir targeting (user segments, %)
 * - Kill switch configurável
 * - Validar nome único
 */
export const createFeature = async (data: Partial<Feature>): Promise<Feature> => {
  const response = await api.post('/gatekeeper/features', data);
  return extractData(response);
};

/**
 * Avaliar feature para usuário
 * TODO: Implementar avaliação com regras
 * - Verificar se feature está habilitada
 * - Aplicar rollout percentage
 * - Aplicar targeting rules (user attrs, segments)
 * - Cachear resultado (1 minuto)
 * - Registrar avaliação para analytics
 */
export const evaluateFeature = async (featureKey: string, userId?: string): Promise<FeatureEvaluation> => {
  const response = await api.get(\`/gatekeeper/features/\${featureKey}/evaluate\`, {
    params: { userId }
  });
  return extractData(response);
};

/**
 * Atualizar configuração de feature
 * TODO: Implementar updates com rollback
 * - Habilitar/desabilitar instantaneamente
 * - Ajustar rollout percentage gradualmente
 * - Modificar targeting rules
 * - Manter histórico de mudanças
 * - Permitir rollback rápido
 */
export const updateFeature = async (featureKey: string, updates: Partial<Feature>): Promise<Feature> => {
  const response = await api.patch(\`/gatekeeper/features/\${featureKey}\`, updates);
  return extractData(response);
};
