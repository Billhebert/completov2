// src/modules/ai/rag.service.ts
import { QdrantClient } from '@qdrant/js-client-rest';
import { PrismaClient } from '@prisma/client';
import { env } from '../../core/config/env';
import { logger } from '../../core/logger';
import axios from 'axios';

export class RAGService {
  private qdrant: QdrantClient;
  private collectionName = 'knowledge';

  constructor(private prisma: PrismaClient) {
    this.qdrant = new QdrantClient({
      url: env.QDRANT_URL,
      apiKey: env.QDRANT_API_KEY,
    });
    this.initCollection();
  }

  private async initCollection() {
    try {
      const collections = await this.qdrant.getCollections();
      const exists = collections.collections.some(c => c.name === this.collectionName);
      
      if (!exists) {
        await this.qdrant.createCollection(this.collectionName, {
          vectors: {
            size: 1536, // OpenAI embedding size
            distance: 'Cosine',
          },
        });
        logger.info('Qdrant collection created');
      }
    } catch (error) {
      logger.warn({ error }, 'Failed to initialize Qdrant collection');
    }
  }

  /**
   * Generate embeddings (OpenAI or Ollama)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (env.OPENAI_API_KEY) {
        // Use OpenAI
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
        // Use Ollama (fallback)
        const response = await axios.post(`${env.OLLAMA_URL}/api/embeddings`, {
          model: env.OLLAMA_MODEL,
          prompt: text,
        });
        return response.data.embedding;
      }
    } catch (error) {
      logger.error({ error }, 'Failed to generate embedding');
      throw error;
    }
  }

  /**
   * Ingest knowledge node
   */
  async ingestNode(nodeId: string, companyId: string) {
    const node = await this.prisma.knowledgeNode.findUnique({
      where: { id: nodeId },
    });

    if (!node) throw new Error('Node not found');

    const text = `${node.title}\n\n${node.content}`;
    const embedding = await this.generateEmbedding(text);

    // Store in Qdrant
    await this.qdrant.upsert(this.collectionName, {
      points: [
        {
          id: nodeId,
          vector: embedding,
          payload: {
            nodeId,
            companyId,
            title: node.title,
            nodeType: node.nodeType,
            tags: node.tags,
          },
        },
      ],
    });

    // Store embedding reference
    await this.prisma.knowledgeEmbedding.create({
      data: {
        companyId,
        nodeId,
        embeddingModel: env.OPENAI_API_KEY ? 'openai-ada-002' : 'ollama',
        vectorId: nodeId,
      },
    });

    logger.info({ nodeId }, 'Knowledge node ingested');
  }

  /**
   * Search knowledge base
   */
  async search(query: string, companyId: string, limit = 5) {
    const embedding = await this.generateEmbedding(query);

    const results = await this.qdrant.search(this.collectionName, {
      vector: embedding,
      limit,
      filter: {
        must: [
          {
            key: 'companyId',
            match: { value: companyId },
          },
        ],
      },
    });

    // Get full nodes
    const nodeIds = results.map(r => r.id as string);
    const nodes = await this.prisma.knowledgeNode.findMany({
      where: {
        id: { in: nodeIds },
        companyId,
      },
    });

    return results.map(result => ({
      score: result.score,
      node: nodes.find(n => n.id === result.id),
    }));
  }

  /**
   * RAG Query - Retrieve + Generate
   */
  async query(question: string, companyId: string) {
    // 1. Search knowledge base
    const searchResults = await this.search(question, companyId, 3);

    if (searchResults.length === 0) {
      return {
        answer: 'I don\'t have enough information to answer this question.',
        sources: [],
      };
    }

    // 2. Build context
    const context = searchResults
      .map(r => `${r.node?.title}\n${r.node?.content}`)
      .join('\n\n---\n\n');

    // 3. Generate answer using LLM
    const prompt = `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer:`;

    let answer: string;

    try {
      if (env.OPENAI_API_KEY) {
        // Use OpenAI
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: env.OPENAI_MODEL,
            messages: [
              { role: 'system', content: 'You are a helpful assistant. Answer based on the provided context.' },
              { role: 'user', content: prompt },
            ],
            max_tokens: 500,
          },
          {
            headers: {
              'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );
        answer = response.data.choices[0].message.content;
      } else {
        // Use Ollama
        const response = await axios.post(`${env.OLLAMA_URL}/api/generate`, {
          model: env.OLLAMA_MODEL,
          prompt,
          stream: false,
        });
        answer = response.data.response;
      }
    } catch (error) {
      logger.error({ error }, 'Failed to generate answer');
      answer = 'Sorry, I encountered an error generating the answer.';
    }

    return {
      answer,
      sources: searchResults.map(r => ({
        id: r.node?.id,
        title: r.node?.title,
        score: r.score,
      })),
    };
  }
}
