// src/modules/sync/connectors/base.connector.ts
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../core/logger';

export interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  errorMessages?: string[];
}

export interface EntityMapping {
  externalId: string;
  internalId: string;
  fingerprint?: string;
}

export abstract class BaseConnector {
  constructor(
    protected prisma: PrismaClient,
    protected companyId: string,
    protected config: any
  ) {}

  abstract get providerName(): string;

  /**
   * Pull entities from external system
   */
  abstract pullEntities(entityType: string): Promise<SyncResult>;

  /**
   * Push entities to external system
   */
  abstract pushEntities(entityType: string): Promise<SyncResult>;

  /**
   * Test connection
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Map external entity to internal
   */
  protected async mapEntity(
    entityType: string,
    externalId: string,
    internalId: string,
    fingerprint?: string
  ): Promise<void> {
    await this.prisma.externalEntityMap.upsert({
      where: {
        companyId_provider_entityType_externalId: {
          companyId: this.companyId,
          provider: this.providerName,
          entityType,
          externalId,
        },
      },
      create: {
        companyId: this.companyId,
        provider: this.providerName,
        entityType,
        externalId,
        internalId,
        fingerprint,
        lastSeenAt: new Date(),
      },
      update: {
        internalId,
        fingerprint,
        lastSeenAt: new Date(),
      },
    });
  }

  /**
   * Get mapped entity
   */
  protected async getMappedEntity(
    entityType: string,
    externalId: string
  ): Promise<EntityMapping | null> {
    const mapping = await this.prisma.externalEntityMap.findUnique({
      where: {
        companyId_provider_entityType_externalId: {
          companyId: this.companyId,
          provider: this.providerName,
          entityType,
          externalId,
        },
      },
    });

    return mapping;
  }

  /**
   * Calculate fingerprint for deduplication
   */
  protected calculateFingerprint(data: any): string {
    const keys = Object.keys(data).sort();
    const values = keys.map(key => `${key}:${data[key]}`);
    return Buffer.from(values.join('|')).toString('base64');
  }

  /**
   * Log sync job
   */
  protected async logSyncJob(
    runId: string,
    entityType: string,
    action: string,
    externalId: string | null,
    internalId: string | null,
    result: 'success' | 'error' | 'skipped',
    error?: string
  ): Promise<void> {
    await this.prisma.syncJobLog.create({
      data: {
        runId,
        entityType,
        action,
        externalId,
        internalId,
        result,
        error,
      },
    });
  }
}
