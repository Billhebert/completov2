/**
 * Search Service
 * TODO: Implementar serviço de busca global
 */

import api, { extractData } from '../../../core/utils/api';
import { SearchResult, SearchFilters } from '../types';

/**
 * TODO: Implementar busca global
 * - Buscar em múltiplas entidades (contacts, deals, companies, etc)
 * - Suportar filtros por tipo, data, autor
 * - Retornar resultados ordenados por relevância
 * - Destacar termos encontrados (highlights)
 */
export const search = async (
  query: string,
  filters?: SearchFilters
): Promise<SearchResult[]> => {
  const response = await api.get('/search', {
    params: { q: query, ...filters },
  });
  return extractData(response);
};

/**
 * TODO: Buscar sugestões enquanto digita
 * - Retornar rapidamente (autocomplete)
 * - Limitar resultados (5-10)
 */
export const getSuggestions = async (query: string): Promise<SearchResult[]> => {
  const response = await api.get('/search/suggestions', {
    params: { q: query },
  });
  return extractData(response);
};

/**
 * TODO: Registrar busca para analytics
 */
export const logSearch = async (query: string, resultsCount: number): Promise<void> => {
  await api.post('/search/log', { query, resultsCount });
};
