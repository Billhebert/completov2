/**
 * CRM - Interactions Create Route
 * POST /api/v1/crm/interactions
 * Create a new interaction (call, email, meeting, note)
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateBody } from '../../../../core/middleware';
import { z } from 'zod';

const interactionSchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'note']),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  subject: z.string().optional(),
  content: z.string(),
  direction: z.enum(['inbound', 'outbound']).optional(),
  scheduledFor: z.string().optional(),
});

export function setupInteractionsCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(
    `${baseUrl}/interactions`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(interactionSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const interaction = await prisma.interaction.create({
          data: {
            ...req.body,
            companyId: req.companyId!,
            userId: req.user!.id,
          },
        });

        res.status(201).json({ success: true, data: interaction });
      } catch (error) {
        next(error);
      }
    }
  );
}
