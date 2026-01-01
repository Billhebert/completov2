/**
 * Partnerships Service
 * Gerenciamento de parcerias e canal de vendas
 */

import api, { extractData } from '../../../core/utils/api';
import { Partner, PartnerDeal, PartnerProgram } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

/**
 * Lista parceiros
 * TODO: Implementar gestão de parceiros
 * - Cadastro completo de parceiros
 * - Tier/nível do parceiro (bronze, silver, gold)
 * - Área de atuação geográfica
 * - Especialização e certificações
 * - Performance e métricas
 */
export const getPartners = async (params?: PaginationParams): Promise<PaginatedResult<Partner>> => {
  const response = await api.get('/partnerships/partners', { params });
  return extractData(response);
};

/**
 * Criar novo parceiro
 * TODO: Implementar onboarding de parceiros
 * - Processo de aprovação
 * - Assinatura de contrato digital
 * - Configuração de comissões
 * - Treinamento e certificação
 * - Portal do parceiro (credenciais)
 */
export const createPartner = async (data: Partial<Partner>): Promise<Partner> => {
  const response = await api.post('/partnerships/partners', data);
  return extractData(response);
};

/**
 * Gerenciar deals de parceiros
 * TODO: Implementar pipeline de canal
 * - Deals originados por parceiros
 * - Registro de oportunidades
 * - Aprovação e co-venda
 * - Tracking de comissões
 * - Proteção de território
 */
export const getPartnerDeals = async (partnerId: string, params?: PaginationParams): Promise<PaginatedResult<PartnerDeal>> => {
  const response = await api.get(\`/partnerships/partners/\${partnerId}/deals\`, { params });
  return extractData(response);
};

/**
 * Calcular comissões
 * TODO: Implementar engine de comissões
 * - Regras de comissionamento configuráveis
 * - Tiers com % diferentes
 * - Bônus por volume/meta
 * - Split entre parceiros
 * - Relatório de comissões
 * - Integração com financeiro
 */
export const calculateCommissions = async (period: string): Promise<unknown> => {
  const response = await api.post('/partnerships/commissions/calculate', { period });
  return extractData(response);
};
