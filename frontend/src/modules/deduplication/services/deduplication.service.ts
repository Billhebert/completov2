/**
 * Data Deduplication Service
 * Detecção e merge de registros duplicados
 */

import api, { extractData } from '../../../core/utils/api';
import { DuplicateGroup, MergeResult, DeduplicationRule } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

/**
 * Detectar duplicatas
 * TODO: Implementar detecção inteligente
 * - Algoritmos de similaridade (Levenshtein, Soundex, Metaphone)
 * - Fuzzy matching em nome, email, telefone
 * - Machine learning para aprender padrões
 * - Configurar threshold de similaridade
 * - Detectar duplicatas em batch ou tempo real
 */
export const detectDuplicates = async (entityType: string, params?: Record<string, unknown>): Promise<PaginatedResult<DuplicateGroup>> => {
  const response = await api.post(\`/deduplication/\${entityType}/detect\`, params);
  return extractData(response);
};

/**
 * Buscar grupos de duplicatas
 * TODO: Implementar revisão de duplicatas
 * - Listar grupos detectados
 * - Score de confiança
 * - Campos diferentes destacados
 * - Sugestão de master record
 * - Filtrar por status (pending, reviewed, merged)
 */
export const getDuplicateGroups = async (entityType: string, params?: PaginationParams): Promise<PaginatedResult<DuplicateGroup>> => {
  const response = await api.get(\`/deduplication/\${entityType}/groups\`, { params });
  return extractData(response);
};

/**
 * Fazer merge de duplicatas
 * TODO: Implementar merge inteligente
 * - Escolher master record
 * - Mesclar campos (keep newest, longest, most complete)
 * - Mover relacionamentos (deals, tasks, notes)
 * - Manter histórico de merge
 * - Permitir undo do merge
 * - Validar antes de merge
 */
export const mergeDuplicates = async (entityType: string, groupId: string, masterId: string): Promise<MergeResult> => {
  const response = await api.post(\`/deduplication/\${entityType}/groups/\${groupId}/merge\`, { masterId });
  return extractData(response);
};

/**
 * Configurar regras de deduplicação
 * TODO: Implementar regras customizáveis
 * - Definir campos para comparação
 * - Peso de cada campo
 * - Threshold de similaridade
 * - Auto-merge se confiança > X%
 * - Ignorar certos padrões
 */
export const getRules = async (entityType: string): Promise<DeduplicationRule[]> => {
  const response = await api.get(\`/deduplication/\${entityType}/rules\`);
  return extractData(response);
};
