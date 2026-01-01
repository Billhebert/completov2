/**
 * AI Service
 *
 * Fornece métodos para interagir com as rotas de inteligência artificial
 * (RAG e chat) do backend. Os endpoints permitem realizar consultas
 * semanticamente enriquecidas em uma base de conhecimento, ingerir novos
 * nodes para indexação, gerar respostas de chat com IA genérica e
 * consultar/definir o modo de funcionamento da IA【282032691130219†L16-L124】.
 */

import api, { extractData } from '../../../core/utils/api';

// ----------------------------
// RAG (Retrieve-Augmented Generation)
// ----------------------------

/**
 * Executa uma consulta RAG sobre a base de conhecimento da empresa【282032691130219†L20-L26】.
 *
 * @param question Pergunta em linguagem natural.
 * @returns Resposta da IA contendo texto e possivelmente fontes utilizadas.
 */
export const ragQuery = async (question: string): Promise<any> => {
  const response = await api.post('/ai/rag/query', { question });
  return extractData(response);
};

/**
 * Ingesta (indexa) um node de conhecimento para torná-lo disponível na busca RAG【282032691130219†L31-L37】.
 *
 * @param nodeId ID do zettel a ser ingerido.
 */
export const ingestNode = async (nodeId: string): Promise<void> => {
  await api.post('/ai/rag/ingest', { nodeId });
};

/**
 * Realiza uma busca na base de conhecimento utilizando vetores de similaridade【282032691130219†L42-L53】.
 *
 * @param query Texto a pesquisar.
 * @param limit Número máximo de resultados a retornar (padrão: 5).
 * @returns Array de resultados com trechos de contexto e pontuação.
 */
export const searchRAG = async (query: string, limit: number = 5): Promise<any[]> => {
  const response = await api.get('/ai/rag/search', { params: { q: query, limit } });
  return extractData(response);
};

// ----------------------------
// AI Chat
// ----------------------------

/**
 * Gera uma resposta da IA para uma mensagem simples (sem RAG)【282032691130219†L59-L88】.
 *
 * @param message Mensagem do usuário.
 * @param systemMessage Mensagem de sistema opcional para orientar o comportamento da IA.
 * @param temperature Aleatoriedade da geração (0–1). Padrão: 0.7.
 * @returns Objeto contendo a mensagem de resposta, modelo, provedor, tokens usados e custo.
 */
export const aiChat = async (
  message: string,
  systemMessage?: string,
  temperature?: number
): Promise<any> => {
  const payload: any = { message };
  if (systemMessage) payload.systemMessage = systemMessage;
  if (temperature !== undefined) payload.temperature = temperature;
  const response = await api.post('/ai/chat', payload);
  return extractData(response);
};

// ----------------------------
// AI Mode
// ----------------------------

/**
 * Obtém o modo atual de operação da IA (full, auto ou economico)【282032691130219†L94-L106】.
 *
 * @returns Objeto contendo a propriedade `mode`.
 */
export const getAIMode = async (): Promise<{ mode: string }> => {
  const response = await api.get('/ai/mode');
  return extractData(response);
};

/**
 * Define o modo de operação da IA. Valores permitidos: 'full', 'auto' e 'economico'【282032691130219†L111-L124】.
 *
 * @param mode Modo a ser configurado.
 * @returns Novo modo configurado.
 */
export const setAIMode = async (mode: 'full' | 'auto' | 'economico'): Promise<{ mode: string }> => {
  const response = await api.post('/ai/mode', { mode });
  return extractData(response);
};