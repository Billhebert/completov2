// src/modules/sync/connectors/pipefy.ts
import axios, { AxiosInstance } from 'axios';
import { BaseConnector, SyncEntity, SyncResult } from './base';

export class PipefyConnector extends BaseConnector {
  private client: AxiosInstance;

  constructor(prisma: any, companyId: string, config: any) {
    super(prisma, companyId, config);

    this.client = axios.create({
      baseURL: 'https://api.pipefy.com/graphql',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  getProviderName(): string {
    return 'pipefy';
  }

  async fetchEntities(entityType: string, since?: Date): Promise<SyncEntity[]> {
    if (entityType !== 'deal') {
      throw new Error('Pipefy connector only supports deal sync');
    }

    try {
      const pipeId = this.config.customFields?.pipeId;
      if (!pipeId) {
        throw new Error('Pipefy pipeId not configured in customFields');
      }

      const query = `
        query {
          pipe(id: ${pipeId}) {
            cards(first: 100) {
              edges {
                node {
                  id
                  title
                  current_phase {
                    name
                    id
                  }
                  fields {
                    name
                    value
                  }
                  assignees {
                    id
                    email
                    name
                  }
                  created_at
                  updated_at
                }
              }
            }
          }
        }
      `;

      const response = await this.client.post('', { query });

      const cards = response.data.data.pipe.cards.edges.map((edge: any) => edge.node);

      return cards
        .filter((card: any) => !since || new Date(card.updated_at) > since)
        .map((card: any) => ({
          externalId: card.id,
          type: 'deal',
          data: card,
          fingerprint: this.generateFingerprint(card),
        }));
    } catch (error: any) {
      this.logger.error({ error }, 'Failed to fetch Pipefy cards');
      throw error;
    }
  }

  async pushEntity(entityType: string, internalId: string): Promise<SyncResult> {
    if (entityType !== 'deal') {
      throw new Error('Pipefy connector only supports deal sync');
    }

    try {
      const deal = await this.prisma.deal.findUnique({
        where: { id: internalId },
        include: { contact: true },
      });

      if (!deal) throw new Error('Deal not found');

      const pipeId = this.config.customFields?.pipeId;
      if (!pipeId) {
        throw new Error('Pipefy pipeId not configured in customFields');
      }

      const mutation = `
        mutation {
          createCard(input: {
            pipe_id: ${pipeId}
            title: "${deal.title}"
            fields_attributes: [
              { field_id: "email", field_value: "${deal.contact.email}" }
              { field_id: "value", field_value: "${deal.value}" }
            ]
          }) {
            card {
              id
              title
            }
          }
        }
      `;

      const response = await this.client.post('', { query: mutation });

      const cardId = response.data.data.createCard.card.id;

      await this.upsertMapping(
        'deal',
        cardId,
        internalId,
        this.generateFingerprint(response.data.data.createCard.card)
      );

      return {
        action: 'created',
        externalId: cardId,
        internalId,
      };
    } catch (error: any) {
      this.logger.error({ error, internalId }, 'Failed to push to Pipefy');
      return {
        action: 'skipped',
        externalId: '',
        internalId,
        error: error.message,
      };
    }
  }

  protected mapToInternal(entityType: string, external: any): any {
    const getFieldValue = (fields: any[], fieldName: string) => {
      const field = fields.find((f: any) => f.name === fieldName);
      return field?.value || null;
    };

    return {
      title: external.title,
      value: parseFloat(getFieldValue(external.fields, 'value') || 0),
      stage: this.mapPhaseToStage(external.current_phase?.name || 'New'),
      customFields: {
        pipefy_id: external.id,
        pipefy_phase_id: external.current_phase?.id,
        pipefy_data: external,
      },
    };
  }

  protected mapToExternal(entityType: string, internal: any): any {
    return {
      title: internal.title,
      value: internal.value,
      phase: this.mapStageToPhase(internal.stage),
    };
  }

  private mapPhaseToStage(phase: string): string {
    const phaseMap: Record<string, string> = {
      'New': 'lead',
      'Qualified': 'qualified',
      'Proposal': 'proposal',
      'Negotiation': 'negotiation',
      'Won': 'won',
      'Lost': 'lost',
    };
    return phaseMap[phase] || 'lead';
  }

  private mapStageToPhase(stage: string): string {
    const stageMap: Record<string, string> = {
      'lead': 'New',
      'qualified': 'Qualified',
      'proposal': 'Proposal',
      'negotiation': 'Negotiation',
      'won': 'Won',
      'lost': 'Lost',
    };
    return stageMap[stage] || 'New';
  }
}
