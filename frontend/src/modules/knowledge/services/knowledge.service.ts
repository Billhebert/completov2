/**
 * Knowledge Service
 * TODO: Implementar serviço de base de conhecimento
 */

import api, { extractData } from '../../../core/utils/api';
import { Article, Category, ArticleFilters } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

/**
 * TODO: Implementar busca de artigos
 * - Suportar busca full-text no título e conteúdo
 * - Filtrar por categoria, status, tags, autor
 * - Ordenar por relevância, data, visualizações
 */
export const getArticles = async (
  params?: PaginationParams & ArticleFilters
): Promise<PaginatedResult<Article>> => {
  const response = await api.get('/knowledge/articles', { params });
  return extractData(response);
};

/**
 * TODO: Implementar criação de artigo
 * - Validar categoria existe
 * - Processar markdown/HTML
 * - Gerar summary automático se não fornecido
 */
export const createArticle = async (data: Partial<Article>): Promise<Article> => {
  const response = await api.post('/knowledge/articles', data);
  return extractData(response);
};

/**
 * TODO: Implementar atualização de artigo
 * - Manter histórico de versões
 * - Atualizar data de modificação
 */
export const updateArticle = async (id: string, data: Partial<Article>): Promise<Article> => {
  const response = await api.put(`/knowledge/articles/${id}`, data);
  return extractData(response);
};

/**
 * TODO: Implementar publicação de artigo
 * - Mudar status de draft para published
 * - Definir publishedAt
 * - Enviar notificações se configurado
 */
export const publishArticle = async (id: string): Promise<Article> => {
  const response = await api.post(`/knowledge/articles/${id}/publish`);
  return extractData(response);
};

/**
 * TODO: Implementar feedback em artigo
 * - Registrar se foi útil ou não
 * - Incrementar contador helpful/notHelpful
 */
export const rateArticle = async (id: string, helpful: boolean): Promise<void> => {
  await api.post(`/knowledge/articles/${id}/rate`, { helpful });
};

/**
 * TODO: Implementar gestão de categorias
 * - Estrutura hierárquica
 * - Ordenação customizada
 */
export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get('/knowledge/categories');
  return extractData(response);
};

export const createCategory = async (data: Partial<Category>): Promise<Category> => {
  const response = await api.post('/knowledge/categories', data);
  return extractData(response);
};
