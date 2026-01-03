/**
 * CRM - Contacts Delete Route
 * DELETE /api/v1/crm/contacts/:id
 * Delete a contact and all related data (cascade)
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../../../core/middleware';

export function setupContactsDeleteRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.delete(
    `${baseUrl}/contacts/:id`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Verify contact exists and belongs to tenant
        const contact = await prisma.contact.findFirst({
          where: { id: req.params.id, companyId: req.companyId! },
          include: {
            _count: {
              select: {
                deals: true,
                interactions: true,
              },
            },
          },
        });

        if (!contact) {
          return res.status(404).json({
            success: false,
            message: 'Contato não encontrado',
          });
        }

        // Cascade deletion: products -> deals -> interactions -> contact
        await prisma.$transaction(async (tx) => {
          // 1. Delete products from all deals of this contact
          const deals = await tx.deal.findMany({
            where: { contactId: req.params.id },
            select: { id: true },
          });

          for (const deal of deals) {
            await tx.dealProduct.deleteMany({
              where: { dealId: deal.id },
            });
          }

          // 2. Delete all deals of this contact
          await tx.deal.deleteMany({
            where: { contactId: req.params.id },
          });

          // 3. Delete all interactions of this contact
          await tx.interaction.deleteMany({
            where: { contactId: req.params.id },
          });

          // 4. Delete the contact
          await tx.contact.delete({
            where: { id: req.params.id },
          });
        });

        res.json({
          success: true,
          message: 'Contact deleted',
          deletedRelations: {
            deals: contact._count.deals,
            interactions: contact._count.interactions,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
