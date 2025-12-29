// src/modules/sync/connectors/rdstation.ts
import axios, { AxiosInstance } from 'axios';
import { BaseConnector, SyncEntity, SyncResult } from './base';

export class RDStationConnector extends BaseConnector {
  private client: AxiosInstance;

  constructor(prisma: any, companyId: string, config: any) {
    super(prisma, companyId, config);

    this.client = axios.create({
      baseURL: 'https://api.rd.services',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  getProviderName(): string {
    return 'rdstation';
  }

  async fetchEntities(entityType: string, since?: Date): Promise<SyncEntity[]> {
    if (entityType !== 'contact') {
      throw new Error('RDStation only supports contact sync');
    }

    try {
      const response = await this.client.get('/platform/contacts', {
        params: {
          page_size: 100,
          ...(since && { updated_since: since.toISOString() }),
        },
      });

      return response.data.contacts.map((contact: any) => ({
        externalId: contact.uuid,
        type: 'contact',
        data: contact,
        fingerprint: this.generateFingerprint(contact),
      }));
    } catch (error: any) {
      this.logger.error({ error }, 'Failed to fetch RDStation contacts');
      throw error;
    }
  }

  async pushEntity(entityType: string, internalId: string): Promise<SyncResult> {
    if (entityType !== 'contact') {
      throw new Error('RDStation only supports contact sync');
    }

    try {
      const contact = await this.prisma.contact.findUnique({
        where: { id: internalId },
      });

      if (!contact) throw new Error('Contact not found');

      const externalData = this.mapToExternal('contact', contact);

      const response = await this.client.post('/platform/contacts', externalData);

      await this.upsertMapping(
        'contact',
        response.data.uuid,
        internalId,
        this.generateFingerprint(response.data)
      );

      return {
        action: 'created',
        externalId: response.data.uuid,
        internalId,
      };
    } catch (error: any) {
      this.logger.error({ error, internalId }, 'Failed to push to RDStation');
      return {
        action: 'skipped',
        externalId: '',
        internalId,
        error: error.message,
      };
    }
  }

  protected mapToInternal(entityType: string, external: any): any {
    return {
      name: external.name || 'Unknown',
      email: external.email,
      phone: external.personal_phone || external.mobile_phone,
      companyName: external.company,
      position: external.job_title,
      tags: external.tags || [],
      customFields: {
        rdstation_id: external.uuid,
        rdstation_data: external,
      },
    };
  }

  protected mapToExternal(entityType: string, internal: any): any {
    return {
      name: internal.name,
      email: internal.email,
      personal_phone: internal.phone,
      company: internal.companyName,
      job_title: internal.position,
      tags: internal.tags,
    };
  }
}
