// src/core/ai/ai.service.ts
import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../logger';
import { PrismaClient } from '@prisma/client';

export enum AIMode {
  FULL = 'full',           // OpenAI apenas (melhor qualidade, pago)
  AUTO = 'auto',           // IA decide (híbrido inteligente)
  ECONOMICO = 'economico', // Ollama apenas (grátis, local)
}

export enum TaskComplexity {
  SIMPLE = 'simple',       // Tarefas simples (Ollama suficiente)
  MEDIUM = 'medium',       // Tarefas médias (Ollama ou OpenAI)
  COMPLEX = 'complex',     // Tarefas complexas (preferir OpenAI)
}

interface AIRequest {
  prompt: string;
  systemMessage?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

interface AIResponse {
  content: string;
  model: string;
  provider: 'openai' | 'ollama';
  tokensUsed?: number;
  cost?: number;
}

export class AIService {
  private mode: AIMode;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient, mode?: AIMode) {
    this.prisma = prisma;
    this.mode = mode || (env.AI_MODE as AIMode) || AIMode.AUTO;
  }

  /**
   * Analisa a complexidade da tarefa para o modo AUTO
   */
  private analyzeComplexity(prompt: string, context?: any): TaskComplexity {
    const promptLower = prompt.toLowerCase();

    // Palavras-chave que indicam complexidade
    const complexKeywords = [
      'analyze', 'analisar', 'complex', 'complexo', 'detailed', 'detalhado',
      'professional', 'profissional', 'technical', 'técnico', 'legal',
      'financial', 'financeiro', 'medical', 'médico', 'scientific', 'científico',
    ];

    const simpleKeywords = [
      'summarize', 'resumir', 'translate', 'traduzir', 'simple', 'simples',
      'basic', 'básico', 'quick', 'rápido', 'short', 'curto',
    ];

    // Verificar comprimento do prompt
    if (prompt.length > 1000) return TaskComplexity.COMPLEX;
    if (prompt.length < 100) return TaskComplexity.SIMPLE;

    // Verificar palavras-chave
    const hasComplexKeywords = complexKeywords.some(k => promptLower.includes(k));
    const hasSimpleKeywords = simpleKeywords.some(k => promptLower.includes(k));

    if (hasComplexKeywords) return TaskComplexity.COMPLEX;
    if (hasSimpleKeywords) return TaskComplexity.SIMPLE;

    // Default: médio
    return TaskComplexity.MEDIUM;
  }

  /**
   * Decide qual provider usar baseado no modo e complexidade
   */
  private async decideProvider(complexity: TaskComplexity): Promise<'openai' | 'ollama'> {
    switch (this.mode) {
      case AIMode.FULL:
        // Sempre OpenAI
        if (!env.OPENAI_API_KEY) {
          logger.warn('OpenAI API key not set, falling back to Ollama');
          return 'ollama';
        }
        return 'openai';

      case AIMode.ECONOMICO:
        // Sempre Ollama
        return 'ollama';

      case AIMode.AUTO:
        // Decisão inteligente
        if (!env.OPENAI_API_KEY) {
          logger.info('OpenAI not available, using Ollama');
          return 'ollama';
        }

        // Tarefas simples: sempre Ollama (economizar)
        if (complexity === TaskComplexity.SIMPLE) {
          return 'ollama';
        }

        // Tarefas complexas: preferir OpenAI (melhor qualidade)
        if (complexity === TaskComplexity.COMPLEX) {
          return 'openai';
        }

        // Tarefas médias: usar Ollama 70% do tempo, OpenAI 30%
        // (balancear custo e qualidade)
        return Math.random() < 0.7 ? 'ollama' : 'openai';

      default:
        return 'ollama';
    }
  }

  /**
   * Chamada para OpenAI
   */
  private async callOpenAI(request: AIRequest): Promise<AIResponse> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: request.model || env.OPENAI_MODEL || 'gpt-4',
          messages: [
            ...(request.systemMessage ? [{ role: 'system', content: request.systemMessage }] : []),
            { role: 'user', content: request.prompt },
          ],
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const content = response.data.choices[0].message.content;
      const tokensUsed = response.data.usage.total_tokens;

      // Calcular custo aproximado (GPT-4: $0.03/1k tokens input, $0.06/1k tokens output)
      const cost = (tokensUsed / 1000) * 0.045; // Média

      return {
        content,
        model: response.data.model,
        provider: 'openai',
        tokensUsed,
        cost,
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'OpenAI API call failed');
      throw new Error(`OpenAI error: ${error.message}`);
    }
  }

  /**
   * Chamada para Ollama
   */
  private async callOllama(request: AIRequest): Promise<AIResponse> {
    try {
      const response = await axios.post(
        `${env.OLLAMA_URL}/api/generate`,
        {
          model: request.model || env.OLLAMA_MODEL || 'llama2',
          prompt: request.systemMessage
            ? `${request.systemMessage}\n\n${request.prompt}`
            : request.prompt,
          stream: false,
          options: {
            temperature: request.temperature || 0.7,
            num_predict: request.maxTokens || 1000,
          },
        },
        {
          timeout: 60000, // Ollama pode ser mais lento
        }
      );

      return {
        content: response.data.response,
        model: response.data.model,
        provider: 'ollama',
        tokensUsed: response.data.total_duration ? Math.floor(response.data.total_duration / 1000000) : undefined,
        cost: 0, // Ollama é grátis
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Ollama API call failed');
      throw new Error(`Ollama error: ${error.message}`);
    }
  }

  /**
   * Gerar completions (chat, texto, etc)
   */
  async complete(request: AIRequest): Promise<AIResponse> {
    const complexity = this.analyzeComplexity(request.prompt);
    const provider = await this.decideProvider(complexity);

    logger.info({
      mode: this.mode,
      complexity,
      provider,
      promptLength: request.prompt.length,
    }, 'AI completion request');

    if (provider === 'openai') {
      return this.callOpenAI(request);
    } else {
      return this.callOllama(request);
    }
  }

  /**
   * Gerar embeddings
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const complexity = this.analyzeComplexity(text);
    const provider = await this.decideProvider(complexity);

    try {
      if (provider === 'openai' && env.OPENAI_API_KEY) {
        const response = await axios.post(
          'https://api.openai.com/v1/embeddings',
          {
            model: 'text-embedding-ada-002',
            input: text,
          },
          {
            headers: {
              'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );
        return response.data.data[0].embedding;
      } else {
        // Ollama embeddings
        const response = await axios.post(`${env.OLLAMA_URL}/api/embeddings`, {
          model: env.OLLAMA_MODEL || 'llama2',
          prompt: text,
        });
        return response.data.embedding;
      }
    } catch (error: any) {
      logger.error({ error: error.message }, 'Embedding generation failed');
      throw error;
    }
  }

  /**
   * Análise de sentimento
   */
  async analyzeSentiment(text: string): Promise<{ sentiment: 'positive' | 'negative' | 'neutral'; score: number }> {
    const result = await this.complete({
      prompt: `Analyze the sentiment of this text. Return ONLY a JSON object with "sentiment" (positive/negative/neutral) and "score" (0-1):\n\n${text}`,
      systemMessage: 'You are a sentiment analysis expert. Always return valid JSON.',
      temperature: 0.3,
    });

    try {
      const parsed = JSON.parse(result.content);
      return parsed;
    } catch {
      // Fallback
      return { sentiment: 'neutral', score: 0.5 };
    }
  }

  /**
   * Sumarização inteligente
   */
  async summarize(text: string, maxLength: number = 200): Promise<string> {
    const result = await this.complete({
      prompt: `Summarize this text in ${maxLength} characters or less:\n\n${text}`,
      systemMessage: 'You are an expert at creating concise summaries.',
      temperature: 0.5,
      maxTokens: Math.floor(maxLength / 2),
    });

    return result.content;
  }

  /**
   * Sugestões inteligentes
   */
  async generateSuggestions(context: string, type: string): Promise<string[]> {
    const result = await this.complete({
      prompt: `Based on this context, generate 5 relevant suggestions for ${type}:\n\n${context}\n\nReturn ONLY a JSON array of strings.`,
      systemMessage: 'You are a helpful assistant that generates practical suggestions.',
      temperature: 0.8,
    });

    try {
      const parsed = JSON.parse(result.content);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Obter estatísticas de uso
   */
  async getUsageStats(companyId: string, startDate: Date, endDate: Date) {
    // TODO: Implementar tracking de uso no banco
    return {
      totalRequests: 0,
      openaiRequests: 0,
      ollamaRequests: 0,
      totalCost: 0,
      tokensUsed: 0,
    };
  }

  /**
   * Mudar modo de IA
   */
  setMode(mode: AIMode) {
    this.mode = mode;
    logger.info({ mode }, 'AI mode changed');
  }

  /**
   * Obter modo atual
   */
  getMode(): AIMode {
    return this.mode;
  }
}

// Export singleton para uso global
let aiServiceInstance: AIService | null = null;

export function getAIService(prisma: PrismaClient, mode?: AIMode): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService(prisma, mode);
  }
  return aiServiceInstance;
}
