// src/modules/sync/connectors/base.ts
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../core/logger';

export interface SyncConfig {
  apiUrl: string;
  apiKey: string;
  customFields?: Record<string, any>;
}

export interface SyncEntity {
  externalId: string;
  type: string;
  data: any;
  fingerprint: string;
}

export interface SyncResult {
  action: 'created' | 'updated' | 'skipped' | 'deleted';
  externalId: string;
  internalId?: string;
  error?: string;
}

export abstract class BaseConnector {
  protected logger = logger;

  constructor(
    protected prisma: PrismaClient,
    protected companyId: string,
    protected config: SyncConfig
  ) {}

  /**
   * Fetch entities from external system
   */
  abstract fetchEntities(entityType: string, since?: Date): Promise<SyncEntity[]>;

  /**
   * Push entity to external system
   */
  abstract pushEntity(entityType: string, internalId: string): Promise<SyncResult>;

  /**
   * Map external entity to internal format
   */
  protected abstract mapToInternal(entityType: string, external: any): any;

  /**
   * Map internal entity to external format
   */
  protected abstract mapToExternal(entityType: string, internal: any): any;

  /**
   * Generate fingerprint for deduplication
   */
  protected generateFingerprint(data: any): string {
    const normalized = JSON.stringify(data, Object.keys(data).sort());
    return Buffer.from(normalized).toString('base64');
  }

  /**
   * Find existing mapping
   */
  protected async findMapping(entityType: string, externalId: string) {
    return this.prisma.externalEntityMap.findUnique({
      where: {
        companyId_provider_entityType_externalId: {
          companyId: this.companyId,
          provider: this.getProviderName(),
          entityType,
          externalId,
        },
      },
    });
  }

  /**
   * Create or update mapping
   */
  protected async upsertMapping(
    entityType: string,
    externalId: string,
    internalId: string,
    fingerprint: string
  ) {
    return this.prisma.externalEntityMap.upsert({
      where: {
        companyId_provider_entityType_externalId: {
          companyId: this.companyId,
          provider: this.getProviderName(),
          entityType,
          externalId,
        },
      },
      create: {
        companyId: this.companyId,
        provider: this.getProviderName(),
        entityType,
        externalId,
        internalId,
        fingerprint,
      },
      update: {
        internalId,
        fingerprint,
        lastSeenAt: new Date(),
      },
    });
  }

  /**
   * Pull entities from external system to OMNI
   */
  async pull(entityType: string, since?: Date): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    try {
      const entities = await this.fetchEntities(entityType, since);

      for (const entity of entities) {
        try {
          // Check if exists
          const mapping = await this.findMapping(entityType, entity.externalId);

          if (mapping && mapping.fingerprint === entity.fingerprint) {
            // No changes
            results.push({
              action: 'skipped',
              externalId: entity.externalId,
              internalId: mapping.internalId,
            });
            continue;
          }

          // Map to internal format
          const internalData = this.mapToInternal(entityType, entity.data);

          let internalId: string;

          if (mapping) {
            // Update existing
            const updated = await this.updateInternal(entityType, mapping.internalId, internalData);
            internalId = updated.id;

            results.push({
              action: 'updated',
              externalId: entity.externalId,
              internalId,
            });
          } else {
            // Create new
            const created = await this.createInternal(entityType, internalData);
            internalId = created.id;

            results.push({
              action: 'created',
              externalId: entity.externalId,
              internalId,
            });
          }

          // Update mapping
          await this.upsertMapping(entityType, entity.externalId, internalId, entity.fingerprint);
        } catch (error: any) {
          this.logger.error({ error, entity }, 'Failed to sync entity');
          results.push({
            action: 'skipped',
            externalId: entity.externalId,
            error: error.message,
          });
        }
      }
    } catch (error: any) {
      this.logger.error({ error, entityType }, 'Failed to pull entities');
      throw error;
    }

    return results;
  }

  /**
   * Create internal entity
   */
  protected async createInternal(entityType: string, data: any): Promise<any> {
    switch (entityType) {
      case 'contact':
        return this.prisma.contact.create({ data: { ...data, companyId: this.companyId } });
      case 'deal':
        return this.prisma.deal.create({ data: { ...data, companyId: this.companyId } });
      case 'product':
        return this.prisma.product.create({ data: { ...data, companyId: this.companyId } });
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  }

  /**
   * Update internal entity
   */
  protected async updateInternal(entityType: string, id: string, data: any): Promise<any> {
    switch (entityType) {
      case 'contact':
        return this.prisma.contact.update({ where: { id }, data });
      case 'deal':
        return this.prisma.deal.update({ where: { id }, data });
      case 'product':
        return this.prisma.product.update({ where: { id }, data });
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  }

  abstract getProviderName(): string;
}
