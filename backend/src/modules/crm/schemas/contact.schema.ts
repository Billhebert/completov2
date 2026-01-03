// src/modules/crm/schemas/contact.schema.ts
import { z } from 'zod';

/**
 * Schema for creating a contact
 * Only allows safe fields that users can set
 */
export const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().max(50, 'Phone too long').optional(),
  companyName: z.string().max(200, 'Company name too long').optional(),
  position: z.string().max(100, 'Position too long').optional(),
  tags: z.array(z.string().max(50, 'Tag too long')).max(20, 'Maximum 20 tags').optional(),
  status: z.enum(['active', 'inactive', 'lead', 'qualified', 'customer']).optional(),
  source: z.string().max(100).optional(),
  notes: z.string().max(5000, 'Notes too long').optional(),
  customFields: z.record(z.any()).optional(),
});

/**
 * Schema for updating a contact
 * Similar to create but all fields are optional
 */
export const updateContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long').optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().max(50, 'Phone too long').optional(),
  companyName: z.string().max(200, 'Company name too long').optional(),
  position: z.string().max(100, 'Position too long').optional(),
  tags: z.array(z.string().max(50, 'Tag too long')).max(20, 'Maximum 20 tags').optional(),
  status: z.enum(['active', 'inactive', 'lead', 'qualified', 'customer']).optional(),
  source: z.string().max(100).optional(),
  notes: z.string().max(5000, 'Notes too long').optional(),
  customFields: z.record(z.any()).optional(),
});

/**
 * Schema for bulk operations
 */
export const bulkContactOperationSchema = z.object({
  action: z.enum(['update', 'delete', 'tag', 'untag']),
  ids: z.array(z.string().uuid()).min(1, 'At least one ID required').max(100, 'Maximum 100 IDs'),
  data: z.record(z.any()).optional(),
});
