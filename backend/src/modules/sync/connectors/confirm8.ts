// src/modules/sync/connectors/confirm8.ts
import axios, { AxiosInstance } from 'axios';
import { BaseConnector, SyncEntity, SyncResult } from './base';

export class Confirm8Connector extends BaseConnector {
  private client: AxiosInstance;

  constructor(prisma: any, companyId: string, config: any) {
    super(prisma, companyId, config);

    this.client = axios.create({
      baseURL: config.apiUrl || 'https://api.confirm8.com',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  getProviderName(): string {
    return 'confirm8';
  }

  async fetchEntities(entityType: string, since?: Date): Promise<SyncEntity[]> {
    try {
      let endpoint: string;
      
      switch (entityType) {
        case 'contact':
          endpoint = '/contacts';
          break;
        case 'deal':
          endpoint = '/opportunities';
          break;
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }

      const response = await this.client.get(endpoint, {
        params: {
          limit: 100,
          ...(since && { updated_after: since.toISOString() }),
        },
      });

      return response.data.data.map((item: any) => ({
        externalId: item.id.toString(),
        type: entityType,
        data: item,
        fingerprint: this.generateFingerprint(item),
      }));
    } catch (error: any) {
      this.logger.error({ error, entityType }, 'Failed to fetch Confirm8 entities');
      throw error;
    }
  }

  async pushEntity(entityType: string, internalId: string): Promise<SyncResult> {
    try {
      let entity: any;
      let endpoint: string;

      switch (entityType) {
        case 'contact':
          entity = await this.prisma.contact.findUnique({
            where: { id: internalId },
          });
          endpoint = '/contacts';
          break;
        case 'deal':
          entity = await this.prisma.deal.findUnique({
            where: { id: internalId },
            include: { contact: true },
          });
          endpoint = '/opportunities';
          break;
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }

      if (!entity) throw new Error(`${entityType} not found`);

      const externalData = this.mapToExternal(entityType, entity);

      const response = await this.client.post(endpoint, externalData);

      await this.upsertMapping(
        entityType,
        response.data.id.toString(),
        internalId,
        this.generateFingerprint(response.data)
      );

      return {
        action: 'created',
        externalId: response.data.id.toString(),
        internalId,
      };
    } catch (error: any) {
      this.logger.error({ error, internalId, entityType }, 'Failed to push to Confirm8');
      return {
        action: 'skipped',
        externalId: '',
        internalId,
        error: error.message,
      };
    }
  }

  protected mapToInternal(entityType: string, external: any): any {
    switch (entityType) {
      case 'contact':
        return {
          name: external.name || 'Unknown',
          email: external.email,
          phone: external.phone,
          companyName: external.company_name,
          position: external.job_title,
          tags: external.tags || [],
          customFields: {
            confirm8_id: external.id,
            confirm8_data: external,
          },
        };
      case 'deal':
        return {
          title: external.name || 'Untitled Deal',
          value: parseFloat(external.value || 0),
          stage: this.mapStage(external.stage),
          expectedCloseDate: external.expected_close_date ? new Date(external.expected_close_date) : null,
          customFields: {
            confirm8_id: external.id,
            confirm8_data: external,
          },
        };
      default:
        return external;
    }
  }

  protected mapToExternal(entityType: string, internal: any): any {
    switch (entityType) {
      case 'contact':
        return {
          name: internal.name,
          email: internal.email,
          phone: internal.phone,
          company_name: internal.companyName,
          job_title: internal.position,
          tags: internal.tags,
        };
      case 'deal':
        return {
          name: internal.title,
          value: internal.value,
          stage: this.mapStageToExternal(internal.stage),
          expected_close_date: internal.expectedCloseDate?.toISOString(),
          contact_id: internal.contactId,
        };
      default:
        return internal;
    }
  }

  private mapStage(externalStage: string): string {
    const stageMap: Record<string, string> = {
      'prospecting': 'lead',
      'qualification': 'qualified',
      'proposal': 'proposal',
      'negotiation': 'negotiation',
      'closed_won': 'won',
      'closed_lost': 'lost',
    };
    return stageMap[externalStage] || 'lead';
  }

  private mapStageToExternal(internalStage: string): string {
    const stageMap: Record<string, string> = {
      'lead': 'prospecting',
      'qualified': 'qualification',
      'proposal': 'proposal',
      'negotiation': 'negotiation',
      'won': 'closed_won',
      'lost': 'closed_lost',
    };
    return stageMap[internalStage] || 'prospecting';
  }
}
