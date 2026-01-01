/**
 * AI Frontend Service
 * Client direto das rotas reais do backend
 */

import api from '../../../core/utils/api';
import {
  ChatCompletionRequest,
  GenerateEmailPayload,
  AnalyzePayload,
  ClassifyPayload,
  AgentExecutePayload,
} from '../types';

/* ---------- CHAT ---------- */

export const chatCompletion = async (payload: ChatCompletionRequest) => {
  const response = await api.post('/ai/chat/completions', payload);
  return response.data;
};

export const chatCompletionStream = async (
  payload: ChatCompletionRequest,
  onChunk: (text: string) => void,
  onDone?: () => void
) => {
  const response = await fetch('/api/v1/ai/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, stream: true }),
  });

  if (!response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    chunk.split('\n').forEach((line) => {
      if (line.startsWith('data:')) {
        const data = JSON.parse(line.replace('data:', '').trim());
        if (data.done) {
          onDone?.();
        } else if (data.content) {
          onChunk(data.content);
        }
      }
    });
  }
};

/* ---------- TOOLS ---------- */

export const generateEmail = (payload: GenerateEmailPayload) =>
  api.post('/ai/generate/email', payload).then((r) => r.data);

export const summarize = (payload: AnalyzePayload) =>
  api.post('/ai/summarize', payload).then((r) => r.data);

export const sentiment = (payload: AnalyzePayload) =>
  api.post('/ai/sentiment', payload).then((r) => r.data);

export const extract = (payload: AnalyzePayload) =>
  api.post('/ai/extract', payload).then((r) => r.data);

export const classify = (payload: ClassifyPayload) =>
  api.post('/ai/classify', payload).then((r) => r.data);

/* ---------- AGENT ---------- */

export const executeAgent = (payload: AgentExecutePayload) =>
  api.post('/ai/agent/execute', payload).then((r) => r.data);

/* ---------- HISTORY & USAGE ---------- */

export const getConversations = () =>
  api.get('/ai/conversations').then((r) => r.data);

export const getUsageStats = () =>
  api.get('/ai/usage/stats').then((r) => r.data);

/* ---------- RAG ---------- */

export const uploadDocument = (formData: FormData) =>
  api.post('/knowledge/rag/upload', formData).then((r) => r.data);

export const uploadBatch = (formData: FormData) =>
  api.post('/knowledge/rag/upload-batch', formData).then((r) => r.data);

export const getDocuments = () =>
  api.get('/knowledge/rag/documents').then((r) => r.data);

export const reprocessDocument = (id: string) =>
  api.post(`/knowledge/rag/documents/${id}/reprocess`).then((r) => r.data);

export const deleteDocument = (id: string) =>
  api.delete(`/knowledge/rag/documents/${id}`).then((r) => r.data);

export const getRagStats = () =>
  api.get('/knowledge/rag/stats').then((r) => r.data);
