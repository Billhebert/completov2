/**
 * Knowledge Service
 *
 * Este serviço implementa uma API cliente para o módulo de base de conhecimento
 * (knowledge) definido no backend. O módulo de conhecimento permite criar e
 * gerenciar zettels (nodes), links entre zettels, gráficos de relacionamento,
 * conversão de entidades em zettels, sugestões inteligentes e pesquisa
 * semântica. Todas as rotas utilizadas aqui estão documentadas no arquivo
 * `backend/src/modules/knowledge/index.ts`.
 *
 * Principais endpoints suportados:
 * - Listar nodes com filtros (search, nodeType, tag, importância)【719758748300185†L32-L85】.
 * - Criar node com título, conteúdo, tipo e tags【719758748300185†L111-L152】.
 * - Obter, atualizar e excluir nodes【719758748300185†L157-L196】【719758748300185†L201-L247】.
 * - Criar e remover links entre nodes【719758748300185†L257-L276】【719758748300185†L281-L287】.
 * - Gerar visualização de gráfico (modo Obsidian)【719758748300185†L294-L413】.
 * - Converter entidades em zettels individuais ou em lote【719758748300185†L523-L577】【719758748300185†L583-L650】.
 * - Sugestões de nodes, tags e links baseadas em IA【719758748300185†L656-L731】【719758748300185†L737-L786】【719758748300185†L791-L865】.
 * - Listar tags e executar buscas semânticas【719758748300185†L873-L895】【719758748300185†L901-L968】.
 * - Perguntas e respostas (QA) utilizando RAG【719758748300185†L991-L1093】.
 */

import api, { extractData } from '../../../core/utils/api';

// Types para melhor documentação; use any se não houver definições locais
export interface KnowledgeNode {
  id: string;
  title: string;
  content: string;
  nodeType: string;
  tags: string[];
  importanceScore?: number;
  isCompanyWide?: boolean;
  ownerId?: string | null;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

/**
 * Lista zettels (knowledge nodes) com filtros opcionais. Por padrão
 * retornará apenas zettels acessíveis ao usuário: company-wide ou pessoais.
 *
 * @param params Objeto de consulta que pode incluir `search`, `nodeType`, `tag`,
 *               `minImportance`, `scope` (accessible, company, personal) e `limit`.
 */
export const getNodes = async (
  params?: Record<string, string | number | boolean>
): Promise<KnowledgeNode[]> => {
  const response = await api.get('/knowledge/nodes', { params });
  return extractData(response);
};

/**
 * Recupera os detalhes de um zettel específico【719758748300185†L157-L196】.
 *
 * @param id ID do node.
 */
export const getNode = async (id: string): Promise<KnowledgeNode> => {
  const response = await api.get(`/knowledge/nodes/${id}`);
  return extractData(response);
};

/**
 * Cria um novo zettel (node)【719758748300185†L111-L152】.
 *
 * @param data Objeto contendo `title`, `content`, `nodeType`, `tags`, `importanceScore`,
 *             `ownerId` e `isCompanyWide` conforme aplicável.
 */
export const createNode = async (data: Partial<KnowledgeNode>): Promise<KnowledgeNode> => {
  const response = await api.post('/knowledge/nodes', data);
  return extractData(response);
};

/**
 * Atualiza um zettel existente【719758748300185†L201-L234】.
 *
 * @param id ID do node a ser atualizado.
 * @param data Dados parciais para atualização (titulo, conteúdo, tags, etc.).
 */
export const updateNode = async (
  id: string,
  data: Partial<KnowledgeNode>
): Promise<KnowledgeNode> => {
  const response = await api.patch(`/knowledge/nodes/${id}`, data);
  return extractData(response);
};

/**
 * Remove um zettel (soft delete)【719758748300185†L240-L247】.
 *
 * @param id ID do node a ser removido.
 */
export const deleteNode = async (id: string): Promise<void> => {
  await api.delete(`/knowledge/nodes/${id}`);
};

/**
 * Cria um link entre um zettel e outro【719758748300185†L257-L276】.
 *
 * @param nodeId ID do node de origem.
 * @param data Objeto contendo `targetId`, `linkType` e opcionalmente `strength`.
 */
export const createLink = async (
  nodeId: string,
  data: { targetId: string; linkType: 'related' | 'derives' | 'supports' | 'contradicts'; strength?: number }
): Promise<any> => {
  const response = await api.post(`/knowledge/nodes/${nodeId}/links`, data);
  return extractData(response);
};

/**
 * Remove um link pelo seu ID【719758748300185†L281-L287】.
 *
 * @param linkId ID do link.
 */
export const deleteLink = async (linkId: string): Promise<void> => {
  await api.delete(`/knowledge/links/${linkId}`);
};

/**
 * Obtém dados para visualização de gráfico no estilo Obsidian【719758748300185†L294-L413】.
 * Retorna nós e arestas formatados para visualização.
 *
 * @param params Parâmetros como `scope`, `limit` e `companyId` (dev/admin).
 */
export const getGraph = async (
  params?: Record<string, string | number | boolean>
): Promise<any> => {
  const response = await api.get('/knowledge/graph/obsidian', { params });
  return extractData(response);
};

/**
 * Converte uma entidade (qualquer tipo) em um zettel【719758748300185†L523-L577】.
 *
 * @param data Objeto contendo `entityType`, `entityId`, `title`, `content`, `tags` e
 *             `isPersonal`.
 */
export const convertEntity = async (data: any): Promise<any> => {
  const response = await api.post('/knowledge/convert', data);
  return extractData(response);
};

/**
 * Converte várias entidades em zettels em lote【719758748300185†L583-L650】.
 *
 * @param entities Array de objetos entidade (cada um com `entityType`, `entityId`, `content`, etc.).
 */
export const convertEntitiesBatch = async (entities: any[]): Promise<any> => {
  const response = await api.post('/knowledge/convert/batch', { entities });
  return extractData(response);
};

/**
 * Sugere nós relacionados a um determinado zettel usando IA【719758748300185†L656-L731】.
 *
 * @param nodeId ID do zettel base.
 */
export const getNodeSuggestions = async (nodeId: string): Promise<any[]> => {
  const response = await api.get(`/knowledge/nodes/${nodeId}/suggestions`);
  return extractData(response);
};

/**
 * Sugere tags relevantes para um título e conteúdo de zettel【719758748300185†L737-L786】.
 *
 * @param data Objeto contendo `title` e `content`.
 */
export const suggestTags = async (data: { title: string; content: string }): Promise<{ tags: string[] }> => {
  const response = await api.post('/knowledge/nodes/suggest-tags', data);
  return extractData(response);
};

/**
 * Sugere links para um zettel base【719758748300185†L791-L865】.
 *
 * @param nodeId ID do zettel.
 */
export const suggestLinks = async (nodeId: string): Promise<any[]> => {
  const response = await api.get(`/knowledge/nodes/${nodeId}/suggest-links`);
  return extractData(response);
};

/**
 * Lista todos os tags existentes no conhecimento da empresa【719758748300185†L873-L895】.
 */
export const getTags = async (): Promise<{ tag: string; count: number }[]> => {
  const response = await api.get('/knowledge/tags');
  return extractData(response);
};

/**
 * Executa uma busca semântica na base de conhecimento usando RAG【719758748300185†L901-L968】.
 *
 * @param query Objeto contendo `query`, `limit` (padrão 10) e `minScore` (padrão 0.7).
 */
export const semanticSearch = async (query: { query: string; limit?: number; minScore?: number }): Promise<any> => {
  const response = await api.post('/knowledge/search/semantic', query);
  return extractData(response);
};

/**
 * Faz uma pergunta em linguagem natural e retorna uma resposta baseada na base de
 * conhecimento, citando as fontes【719758748300185†L991-L1093】.
 *
 * @param data Objeto contendo `question` e opcional `maxContext` (número de zettels para contexto).
 */
export const askQuestion = async (data: { question: string; maxContext?: number }): Promise<any> => {
  const response = await api.post('/knowledge/ask', data);
  return extractData(response);
};