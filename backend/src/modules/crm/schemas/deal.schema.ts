// src/modules/crm/schemas/deal.schema.ts
import { z } from 'zod';

/**
 * Schema for creating a deal
 */
export const createDealSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  contactId: z.string().uuid('Invalid contact ID').optional(),
  value: z.number().min(0, 'Value must be positive'),
  currency: z.string().length(3, 'Currency must be 3-letter code').default('USD'),
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).default('lead'),
  pipelineId: z.string().uuid('Invalid pipeline ID').optional(),
  stageId: z.string().uuid('Invalid stage ID').optional(),
  expectedCloseDate: z.string().datetime().optional(),
  probability: z.number().min(0).max(100).optional(),
  products: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
  })).optional(),
  notes: z.string().max(5000).optional(),
  customFields: z.record(z.any()).optional(),
});

/**
 * Schema for updating a deal
 */
export const updateDealSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  contactId: z.string().uuid().optional(),
  value: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional(),
  pipelineId: z.string().uuid().optional(),
  stageId: z.string().uuid().optional(),
  expectedCloseDate: z.string().datetime().optional(),
  probability: z.number().min(0).max(100).optional(),
  notes: z.string().max(5000).optional(),
  customFields: z.record(z.any()).optional(),
  products: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
  })).optional(),
});

/**
 * Schema for moving deal to a different stage
 */
export const moveDealStageSchema = z.object({
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
  reason: z.string().max(500).optional(),
});
