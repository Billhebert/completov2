/**
 * Search Service
 *
 * Este serviço oferece uma API unificada para pesquisas globais dentro da
 * plataforma. O backend suporta busca multi-entidade (contatos, negócios,
 * mensagens, conhecimento, usuários e produtos), sugestões automáticas e
 * gerenciamento de pesquisas recentes【385437886412116†L11-L25】【385437886412116†L174-L234】.
 */

import api, { extractData } from '../../../core/utils/api';

/**
 * Realiza uma busca global. Quando `type` não é especificado, todas as
 * entidades são pesquisadas. O limite padrão é 20 e o máximo é 100【385437886412116†L14-L25】.
 *
 * @param params Objeto com `q` (string de busca), `type` (ex.: 'contacts', 'deals', 'messages', 'knowledge', 'users', 'products') e `limit`.
 */
export const globalSearch = async (
  params: { q: string; type?: string; limit?: number }
): Promise<any> => {
  const response = await api.get('/search', { params });
  return extractData(response);
};

/**
 * Busca sugestões para autocompletar campos de pesquisa. Requer pelo menos 2 caracteres【385437886412116†L174-L185】.
 *
 * @param params Objeto com `q` (string de busca), `type` ('all', 'contacts' ou 'deals') e `limit`.
 */
export const getSuggestions = async (
  params: { q: string; type?: string; limit?: number }
): Promise<any[]> => {
  const response = await api.get('/search/suggest', { params });
  return extractData(response);
};

/**
 * Recupera as últimas pesquisas salvas do usuário【385437886412116†L236-L243】.
 */
export const getRecentSearches = async (): Promise<string[]> => {
  const response = await api.get('/search/recent');
  return extractData(response);
};

/**
 * Salva uma nova consulta de pesquisa no histórico do usuário【385437886412116†L248-L268】.
 *
 * @param query Texto da busca a ser registrada.
 */
export const saveSearch = async (query: string): Promise<string[]> => {
  const response = await api.post('/search/save', { query });
  return extractData(response);
};
