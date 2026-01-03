// src/core/utils/soft-delete.ts
import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Soft delete helper utilities
 * Provides standardized soft delete and restore functionality
 */

/**
 * Base filter to exclude soft-deleted records
 * Use this in all queries to filter out deleted records
 */
export const notDeleted = {
  deletedAt: null,
};

/**
 * Filter to show only soft-deleted records
 */
export const onlyDeleted = {
  deletedAt: { not: null },
};

/**
 * Soft delete a record by ID
 * Sets deletedAt to current timestamp instead of hard deleting
 */
export async function softDelete<T extends { deletedAt?: Date | null }>(
  model: any,
  id: string,
  companyId?: string
): Promise<T> {
  const where: any = { id };
  if (companyId) {
    where.companyId = companyId;
  }

  return model.update({
    where,
    data: {
      deletedAt: new Date(),
    },
  });
}

/**
 * Restore a soft-deleted record
 * Sets deletedAt back to null
 */
export async function restore<T extends { deletedAt?: Date | null }>(
  model: any,
  id: string,
  companyId?: string
): Promise<T> {
  const where: any = { id };
  if (companyId) {
    where.companyId = companyId;
  }

  // First verify the record is actually deleted
  const record = await model.findFirst({
    where: {
      ...where,
      deletedAt: { not: null },
    },
  });

  if (!record) {
    throw new Error('Record not found or not deleted');
  }

  return model.update({
    where,
    data: {
      deletedAt: null,
    },
  });
}

/**
 * Permanently delete a soft-deleted record
 * Only works on records that are already soft-deleted
 */
export async function permanentlyDelete(
  model: any,
  id: string,
  companyId?: string
): Promise<void> {
  const where: any = { id };
  if (companyId) {
    where.companyId = companyId;
  }

  // First verify the record is soft-deleted
  const record = await model.findFirst({
    where: {
      ...where,
      deletedAt: { not: null },
    },
  });

  if (!record) {
    throw new Error('Record not found or not soft-deleted. Cannot permanently delete.');
  }

  await model.delete({
    where,
  });
}

/**
 * Bulk soft delete records
 */
export async function bulkSoftDelete(
  model: any,
  ids: string[],
  companyId?: string
): Promise<number> {
  const where: any = {
    id: { in: ids },
    deletedAt: null, // Only delete non-deleted records
  };
  if (companyId) {
    where.companyId = companyId;
  }

  const result = await model.updateMany({
    where,
    data: {
      deletedAt: new Date(),
    },
  });

  return result.count;
}

/**
 * Bulk restore records
 */
export async function bulkRestore(
  model: any,
  ids: string[],
  companyId?: string
): Promise<number> {
  const where: any = {
    id: { in: ids },
    deletedAt: { not: null }, // Only restore deleted records
  };
  if (companyId) {
    where.companyId = companyId;
  }

  const result = await model.updateMany({
    where,
    data: {
      deletedAt: null,
    },
  });

  return result.count;
}

/**
 * Clean up old soft-deleted records (e.g., older than 30 days)
 * Use this for periodic cleanup tasks
 */
export async function cleanupOldDeletedRecords(
  model: any,
  daysOld: number = 30,
  companyId?: string
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const where: any = {
    deletedAt: {
      lt: cutoffDate,
      not: null,
    },
  };
  if (companyId) {
    where.companyId = companyId;
  }

  const result = await model.deleteMany({
    where,
  });

  return result.count;
}

/**
 * Get count of deleted records
 */
export async function getDeletedCount(
  model: any,
  companyId?: string
): Promise<number> {
  const where: any = {
    deletedAt: { not: null },
  };
  if (companyId) {
    where.companyId = companyId;
  }

  return model.count({ where });
}

/**
 * List deleted records with pagination
 */
export async function listDeleted<T>(
  model: any,
  options: {
    companyId?: string;
    take?: number;
    skip?: number;
    orderBy?: any;
  } = {}
): Promise<{ data: T[]; total: number }> {
  const { companyId, take = 50, skip = 0, orderBy = { deletedAt: 'desc' } } = options;

  const where: any = {
    deletedAt: { not: null },
  };
  if (companyId) {
    where.companyId = companyId;
  }

  const [data, total] = await Promise.all([
    model.findMany({
      where,
      take,
      skip,
      orderBy,
    }),
    model.count({ where }),
  ]);

  return { data, total };
}
