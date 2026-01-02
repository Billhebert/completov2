/**
 * AI Service
 *
 * Fornece métodos para interagir com as rotas de inteligência artificial
 * (RAG e chat) do backend. Os endpoints permitem realizar consultas
 * semanticamente enriquecidas em uma base de conhecimento, ingerir novos
 * nodes para indexação, gerar respostas de chat com IA genérica e
 * consultar/definir o modo de funcionamento da IA【282032691130219†L16-L124】.
 */

import api, { extractData } from "../../../core/utils/api";

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
  const response = await api.post("/ai/rag/query", { question });
  return extractData(response);
};

/**
 * Ingesta (indexa) um node de conhecimento para torná-lo disponível na busca RAG【282032691130219†L31-L37】.
 *
 * @param nodeId ID do zettel a ser ingerido.
 */
export const ingestNode = async (nodeId: string): Promise<void> => {
  await api.post("/ai/rag/ingest", { nodeId });
};

/**
 * Realiza uma busca na base de conhecimento utilizando vetores de similaridade【282032691130219†L42-L53】.
 *
 * @param query Texto a pesquisar.
 * @param limit Número máximo de resultados a retornar (padrão: 5).
 * @returns Array de resultados com trechos de contexto e pontuação.
 */
export const searchRAG = async (
  query: string,
  limit: number = 5
): Promise<any[]> => {
  const response = await api.get("/ai/rag/search", {
    params: { q: query, limit },
  });
  return extractData(response);
};
// frontend/src/modules/ai/services/ai.service.ts

// ... funções existentes ragQuery, ingestNode, aiChat, getAIMode, setAIMode ...

/**
 * Stream de completions de chat (SSE).
 * Como não há endpoint de streaming, usamos aiChat() e retornamos o texto completo via callback.
 */
export const chatCompletionStream = async (
  payload: { messages: { role: string; content: string }[] },
  onChunk: (chunk: string) => void
): Promise<any> => {
  const message = payload.messages[0]?.content ?? "";
  const res = await aiChat(message);
  const text = typeof res === "string" ? res : JSON.stringify(res);
  onChunk(text);
  return res;
};

/** Resumir texto (stub) */
export const summarize = async (payload: {
  text: string;
}): Promise<{ summary: string }> => {
  // Retorna apenas os primeiros 200 caracteres como "resumo"
  return {
    summary:
      payload.text?.slice(0, 200) + (payload.text.length > 200 ? "…" : ""),
  };
};

/** Analisar sentimento (stub) */
export const sentiment = async (payload: {
  text: string;
}): Promise<{ sentiment: string }> => {
  // Sempre retorna neutro para fins de demonstração
  return { sentiment: "neutral" };
};

/** Extrair entidades (stub) */
export const extract = async (payload: {
  text: string;
}): Promise<{ entities: string[] }> => {
  // Retorna palavras separadas por espaço como entidades
  return { entities: payload.text?.split(" ") ?? [] };
};

/** Executar agente (stub) */
export const executeAgent = async (payload: {
  agentId: string;
  input: any;
}): Promise<any> => {
  // Retorna simplesmente o input recebido
  return { output: payload.input, agentId: payload.agentId };
};

/** Conversas (stub) */
export const getConversations = async (): Promise<any[]> => {
  // Retorna lista vazia; backend não implementado
  return [];
};

/** Uso / estatísticas (stub) */
export const getUsageStats = async (): Promise<any> => {
  return { message: "Uso não disponível." };
};

/** Documentos RAG (stub) */
export const getDocuments = async (): Promise<any[]> => {
  return [];
};

/** Estatísticas RAG (stub) */
export const getRagStats = async (): Promise<any> => {
  return { message: "RAG stats indisponível." };
};

/** Upload de documento (stub) */
export const uploadDocument = async (form: FormData): Promise<void> => {
  throw new Error("Endpoint /knowledge/rag/upload não disponível no momento.");
};

/** Reprocessar documento (stub) */
export const reprocessDocument = async (id: string): Promise<void> => {
  throw new Error("Endpoint de reprocessamento não disponível.");
};

/** Remover documento (stub) */
export const deleteDocument = async (id: string): Promise<void> => {
  throw new Error("Endpoint de remoção não disponível.");
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
  const response = await api.post("/ai/chat", payload);
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
  const response = await api.get("/ai/mode");
  return extractData(response);
};

/**
 * Define o modo de operação da IA. Valores permitidos: 'full', 'auto' e 'economico'【282032691130219†L111-L124】.
 *
 * @param mode Modo a ser configurado.
 * @returns Novo modo configurado.
 */
export const setAIMode = async (
  mode: "full" | "auto" | "economico"
): Promise<{ mode: string }> => {
  const response = await api.post("/ai/mode", { mode });
  return extractData(response);
};
