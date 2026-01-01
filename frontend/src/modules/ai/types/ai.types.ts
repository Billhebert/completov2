/**
 * AI Types
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  stream?: boolean;
  tools?: unknown[];
  tool_choice?: unknown;
}

export interface ChatCompletionChunk {
  content?: string;
  done?: boolean;
}

export interface Conversation {
  id: string;
  title?: string;
  createdAt: string;
}

export interface UsageStats {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  costUSD: number;
}

export interface GenerateEmailPayload {
  subject: string;
  context: string;
}

export interface AnalyzePayload {
  text: string;
}

export interface ClassifyPayload {
  text: string;
  labels: string[];
}

export interface AgentExecutePayload {
  agentId: string;
  input: Record<string, unknown>;
}
