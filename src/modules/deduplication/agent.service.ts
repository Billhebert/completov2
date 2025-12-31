// src/modules/deduplication/agent.service.ts
import { PrismaClient } from '@prisma/client';
import { logger } from '../../core/logger';
import axios from 'axios';
import { env } from '../../core/config/env';

/**
 * Agente Inteligente de Deduplicação
 *
 * Usa IA para detectar e unificar duplicatas de qualquer origem:
 * - RDStation, Chatwoot, Confirm8, manual, etc.
 * - Fuzzy matching de nomes, emails, telefones
 * - Aprendizado com feedback do usuário
 */
export class DeduplicationAgent {
  constructor(private prisma: PrismaClient) {}

  /**
   * Detecta duplicatas potenciais usando IA
   */
  async detectDuplicates(
    entityType: 'contact' | 'deal' | 'company',
    companyId: string,
    minSimilarity = 0.85
  ) {
    logger.info({ entityType, companyId }, 'Starting intelligent duplicate detection');

    const candidates = await this.findCandidates(entityType, companyId);
    const duplicates: DuplicateGroup[] = [];

    // Comparar cada par de candidatos
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const similarity = await this.calculateSimilarity(
          entityType,
          candidates[i],
          candidates[j]
        );

        if (similarity >= minSimilarity) {
          duplicates.push({
            primary: candidates[i],
            duplicate: candidates[j],
            similarity,
            reasons: this.getSimilarityReasons(candidates[i], candidates[j]),
          });
        }
      }
    }

    // Agrupar duplicatas relacionadas
    const groups = this.groupDuplicates(duplicates);

    // Salvar detecções para review
    await this.saveDuplicateDetections(companyId, entityType, groups);

    return groups;
  }

  /**
   * Busca candidatos potenciais (otimizado)
   */
  private async findCandidates(entityType: string, companyId: string) {
    if (entityType === 'contact') {
      return this.prisma.contact.findMany({
        where: {
          companyId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          companyName: true,
          position: true,
          leadSource: true,
          customFields: true,
        },
      });
    } else if (entityType === 'deal') {
      return this.prisma.deal.findMany({
        where: { companyId },
        include: { contact: true },
      });
    }

    return [];
  }

  /**
   * Calcula similaridade usando IA e regras
   */
  private async calculateSimilarity(
    entityType: string,
    entity1: any,
    entity2: any
  ): Promise<number> {
    const scores: number[] = [];

    // 1. Email exato = 100%
    if (entity1.email && entity2.email) {
      if (this.normalizeEmail(entity1.email) === this.normalizeEmail(entity2.email)) {
        return 1.0;
      }
      scores.push(0);
    }

    // 2. Telefone exato = 95%
    if (entity1.phone && entity2.phone) {
      if (this.normalizePhone(entity1.phone) === this.normalizePhone(entity2.phone)) {
        return 0.95;
      }
      scores.push(0);
    }

    // 3. Nome fuzzy matching
    if (entity1.name && entity2.name) {
      const nameSimilarity = this.fuzzyMatch(
        this.normalizeName(entity1.name),
        this.normalizeName(entity2.name)
      );
      scores.push(nameSimilarity * 0.7); // Peso 70% para nome
    }

    // 4. Empresa similar
    if (entity1.companyName && entity2.companyName) {
      const companySimilarity = this.fuzzyMatch(
        this.normalizeName(entity1.companyName),
        this.normalizeName(entity2.companyName)
      );
      scores.push(companySimilarity * 0.3); // Peso 30% para empresa
    }

    // 5. IA Semântica (se disponível OpenAI/Ollama)
    if (env.OPENAI_API_KEY || env.OLLAMA_URL) {
      const aiSimilarity = await this.calculateAISimilarity(entity1, entity2);
      scores.push(aiSimilarity * 0.5); // Peso 50% para IA
    }

    // 6. Verificar origens diferentes (mesma pessoa de fontes diferentes)
    const source1 = entity1.leadSource || this.getSourceFromCustomFields(entity1);
    const source2 = entity2.leadSource || this.getSourceFromCustomFields(entity2);

    if (source1 && source2 && source1 !== source2) {
      // Mesma pessoa de fontes diferentes? Boost na similaridade
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      return Math.min(avgScore * 1.2, 1.0); // Boost de 20%
    }

    return scores.length > 0 ? Math.max(...scores) : 0;
  }

  /**
   * Calcula similaridade semântica usando IA
   */
  private async calculateAISimilarity(entity1: any, entity2: any): Promise<number> {
    try {
      const text1 = this.entityToText(entity1);
      const text2 = this.entityToText(entity2);

      if (env.OPENAI_API_KEY) {
        // Usar OpenAI para comparar semanticamente
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a duplicate detection expert. Compare two entities and return a similarity score from 0 to 1.',
              },
              {
                role: 'user',
                content: `Entity 1: ${text1}\n\nEntity 2: ${text2}\n\nAre these the same person/entity? Return only a number from 0 to 1.`,
              },
            ],
            temperature: 0,
          },
          {
            headers: {
              'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const score = parseFloat(response.data.choices[0].message.content.trim());
        return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1);
      }
    } catch (error) {
      logger.error({ error }, 'Failed to calculate AI similarity');
    }

    return 0;
  }

  /**
   * Unifica duplicatas (merge inteligente)
   */
  async mergeDuplicates(
    companyId: string,
    primaryId: string,
    duplicateIds: string[],
    entityType: 'contact' | 'deal'
  ) {
    logger.info({ primaryId, duplicateIds }, 'Merging duplicates');

    if (entityType === 'contact') {
      return this.mergeContacts(companyId, primaryId, duplicateIds);
    }

    throw new Error(`Merge not implemented for ${entityType}`);
  }

  /**
   * Merge inteligente de contatos
   */
  private async mergeContacts(companyId: string, primaryId: string, duplicateIds: string[]) {
    const primary = await this.prisma.contact.findFirst({
      where: { id: primaryId, companyId },
    });

    if (!primary) throw new Error('Primary contact not found');

    const duplicates = await this.prisma.contact.findMany({
      where: { id: { in: duplicateIds }, companyId },
    });

    // Merge de dados (melhor de cada)
    const mergedData = this.intelligentMerge(primary, duplicates);

    // Atualizar contato principal
    await this.prisma.contact.update({
      where: { id: primaryId },
      data: mergedData,
    });

    // Transferir relacionamentos
    await Promise.all([
      // Transferir deals
      this.prisma.deal.updateMany({
        where: { contactId: { in: duplicateIds } },
        data: { contactId: primaryId },
      }),

      // Transferir messages
      this.prisma.message.updateMany({
        where: { senderId: { in: duplicateIds } },
        data: { senderId: primaryId },
      }),

      // Transferir activities
      this.prisma.activity.updateMany({
        where: { contactId: { in: duplicateIds } },
        data: { contactId: primaryId },
      }),
    ]);

    // Manter histórico de merge
    await this.prisma.mergeHistory.createMany({
      data: duplicateIds.map(dupId => {
        const duplicate = duplicates.find(d => d.id === dupId);
        return {
          companyId,
          entityType: 'contact',
          primaryId,
          mergedId: dupId,
          mergedData: duplicate || {},
        };
      }),
    });

    // Delete duplicatas (hard delete since Contact doesn't have soft delete)
    await this.prisma.contact.deleteMany({
      where: { id: { in: duplicateIds } },
    });

    // Salvar feedback para aprendizado
    await this.saveMergeFeedback(companyId, primaryId, duplicateIds, 'accepted');

    logger.info({ primaryId, count: duplicateIds.length }, 'Contacts merged successfully');

    return { primaryId, mergedCount: duplicateIds.length };
  }

  /**
   * Merge inteligente de dados (pega o melhor de cada campo)
   */
  private intelligentMerge(primary: any, duplicates: any[]) {
    const all = [primary, ...duplicates];

    return {
      // Nome: maior ou mais completo
      name: this.pickBestValue(all, 'name', (a, b) => (a?.length || 0) - (b?.length || 0)),

      // Email: primeiro não nulo
      email: this.pickBestValue(all, 'email', (a, b) => (a ? 1 : 0) - (b ? 1 : 0)),

      // Telefone: primeiro não nulo
      phone: this.pickBestValue(all, 'phone', (a, b) => (a ? 1 : 0) - (b ? 1 : 0)),

      // Empresa: maior
      companyName: this.pickBestValue(all, 'companyName', (a, b) => (a?.length || 0) - (b?.length || 0)),

      // Tags: união de todas
      tags: [...new Set(all.flatMap(e => e.tags || []))],

      // CustomFields: merge profundo
      customFields: this.deepMerge(...all.map(e => e.customFields || {})),

      // Datas: mais antiga
      createdAt: new Date(Math.min(...all.map(e => new Date(e.createdAt).getTime()))),

      // Lead score: maior
      leadScore: Math.max(...all.map(e => e.leadScore || 0)),
    };
  }

  /**
   * Escolhe o melhor valor usando comparador
   */
  private pickBestValue(entities: any[], field: string, comparator: (a: any, b: any) => number) {
    const values = entities.map(e => e[field]).filter(v => v != null);
    if (values.length === 0) return null;
    return values.sort(comparator).pop();
  }

  /**
   * Merge profundo de objetos
   */
  private deepMerge(...objects: any[]) {
    return objects.reduce((acc, obj) => {
      Object.keys(obj || {}).forEach(key => {
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          acc[key] = this.deepMerge(acc[key] || {}, obj[key]);
        } else {
          acc[key] = obj[key];
        }
      });
      return acc;
    }, {});
  }

  /**
   * Fuzzy matching (Levenshtein distance)
   */
  private fuzzyMatch(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : 1 - distance / maxLen;
  }

  // Utilitários de normalização
  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, ''); // Remove tudo exceto números
  }

  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z\s]/g, '') // Remove caracteres especiais
      .trim();
  }

  private entityToText(entity: any): string {
    return `Name: ${entity.name || 'N/A'}, Email: ${entity.email || 'N/A'}, Phone: ${entity.phone || 'N/A'}, Company: ${entity.companyName || 'N/A'}`;
  }

  private getSourceFromCustomFields(entity: any): string | null {
    const fields = entity.customFields || {};
    if (fields.rdstation_id) return 'rdstation';
    if (fields.chatwoot_id) return 'chatwoot';
    if (fields.confirm8_id) return 'confirm8';
    return null;
  }

  private getSimilarityReasons(entity1: any, entity2: any): string[] {
    const reasons: string[] = [];

    if (entity1.email === entity2.email) reasons.push('Same email');
    if (entity1.phone === entity2.phone) reasons.push('Same phone');
    if (this.fuzzyMatch(entity1.name, entity2.name) > 0.9) reasons.push('Similar name');
    if (entity1.companyName === entity2.companyName) reasons.push('Same company');

    return reasons;
  }

  private groupDuplicates(duplicates: DuplicateGroup[]): DuplicateGroup[][] {
    // Agrupa duplicatas relacionadas
    const groups: Map<string, Set<string>> = new Map();

    duplicates.forEach(dup => {
      const primaryId = dup.primary.id;
      const dupId = dup.duplicate.id;

      if (!groups.has(primaryId)) {
        groups.set(primaryId, new Set([primaryId]));
      }
      groups.get(primaryId)!.add(dupId);
    });

    return Array.from(groups.values()).map(group =>
      duplicates.filter(d => group.has(d.primary.id) || group.has(d.duplicate.id))
    );
  }

  private async saveDuplicateDetections(
    companyId: string,
    entityType: string,
    groups: DuplicateGroup[][]
  ) {
    for (const group of groups) {
      await this.prisma.duplicateDetection.create({
        data: {
          companyId,
          entityType,
          status: 'pending',
          candidates: group.map(g => ({
            primary: g.primary.id,
            duplicate: g.duplicate.id,
            similarity: g.similarity,
            reasons: g.reasons,
          })),
        },
      });
    }
  }

  private async saveMergeFeedback(
    companyId: string,
    primaryId: string,
    mergedIds: string[],
    action: 'accepted' | 'rejected'
  ) {
    await this.prisma.deduplicationFeedback.create({
      data: {
        companyId,
        primaryId,
        mergedIds,
        action,
        timestamp: new Date(),
      },
    });
  }
}

interface DuplicateGroup {
  primary: any;
  duplicate: any;
  similarity: number;
  reasons: string[];
}
