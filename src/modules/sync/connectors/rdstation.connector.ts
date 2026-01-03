// src/modules/sync/connectors/rdstation.connector.ts
import { BaseConnector, SyncResult } from './base.connector';
import axios, { AxiosInstance } from 'axios';
import { logger } from '../../../core/logger';

export class RDStationConnector extends BaseConnector {
  private api: AxiosInstance;

  get providerName() {
    return 'rdstation';
  }

  constructor(prisma: any, companyId: string, config: any) {
    super(prisma, companyId, config);

    this.api = axios.create({
      baseURL: 'https://api.rd.services',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.api.get('/platform/contacts');
      return true;
    } catch (error) {
      logger.error({ error }, 'RDStation connection test failed');
      return false;
    }
  }

  async pullEntities(entityType: string): Promise<SyncResult> {
    const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: 0, errorMessages: [] };

    if (entityType === 'contacts') {
      return this.pullContacts(result);
    }

    return result;
  }

  private async pullContacts(result: SyncResult): Promise<SyncResult> {
    try {
      const response = await this.api.get('/platform/contacts', {
        params: { page_size: 100 },
      });

      const contacts = response.data.contacts || [];

      for (const rdContact of contacts) {
        try {
          const fingerprint = this.calculateFingerprint({
            email: rdContact.email,
            name: rdContact.name,
          });

          // Check if already mapped
          const existing = await this.getMappedEntity('contacts', rdContact.uuid);

          if (existing) {
            if (existing.fingerprint === fingerprint) {
              result.skipped++;
              continue;
            }

            // Update existing
            await this.prisma.contact.update({
              where: { id: existing.internalId },
              data: {
                name: rdContact.name || existing.internalId,
                email: rdContact.email,
                phone: rdContact.mobile_phone || rdContact.personal_phone,
                customFields: rdContact.cf || {},
              },
            });

            await this.mapEntity('contacts', rdContact.uuid, existing.internalId, fingerprint);
            result.updated++;
          } else {
            // Create new
            const contact = await this.prisma.contact.create({
              data: {
                companyId: this.companyId,
                name: rdContact.name || rdContact.email,
                email: rdContact.email,
                phone: rdContact.mobile_phone || rdContact.personal_phone,
                tags: rdContact.tags || [],
                customFields: rdContact.cf || {},
                leadSource: 'rdstation',
              },
            });

            await this.mapEntity('contacts', rdContact.uuid, contact.id, fingerprint);
            result.created++;
          }
        } catch (error: any) {
          result.errors++;
          result.errorMessages?.push(error.message);
        }
      }
    } catch (error: any) {
      logger.error({ error }, 'Failed to pull RDStation contacts');
      result.errors++;
      result.errorMessages?.push(error.message);
    }

    return result;
  }

  async pushEntities(entityType: string): Promise<SyncResult> {
    const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: 0 };

    if (entityType === 'contacts') {
      return this.pushContacts(result);
    }

    return result;
  }

  private async pushContacts(result: SyncResult): Promise<SyncResult> {
    try {
      const contacts = await this.prisma.contact.findMany({
        where: { companyId: this.companyId },
        take: 100,
      });

      for (const contact of contacts) {
        try {
          const mapping = await this.getMappedEntity('contacts', contact.id);

          const payload = {
            email: contact.email,
            name: contact.name,
            mobile_phone: contact.phone,
            tags: contact.tags,
            cf: contact.customFields || {},
          };

          if (mapping) {
            // Update in RDStation
            await this.api.patch(`/platform/contacts/uuid:${mapping.externalId}`, payload);
            result.updated++;
          } else {
            // Create in RDStation
            const response = await this.api.post('/platform/contacts', payload);
            await this.mapEntity('contacts', response.data.uuid, contact.id);
            result.created++;
          }
        } catch (error: any) {
          result.errors++;
          result.errorMessages?.push(error.message);
        }
      }
    } catch (error: any) {
      logger.error({ error }, 'Failed to push contacts to RDStation');
      result.errors++;
      result.errorMessages?.push(error.message);
    }

    return result;
  }
}
