/**
 * CRM - Contacts Enrich Route
 * GET /api/v1/crm/contacts/:id/enrich
 * AI-powered contact enrichment suggestions
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../../../core/middleware';

export function setupContactsEnrichRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(
    `${baseUrl}/contacts/:id/enrich`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const contact = await prisma.contact.findFirst({
          where: { id: req.params.id, companyId: req.companyId! },
          include: {
            deals: true,
            interactions: { take: 5, orderBy: { timestamp: 'desc' } },
          },
        });

        if (!contact) {
          return res
            .status(404)
            .json({ success: false, error: { message: 'Contact not found' } });
        }

        const { getAIService } = await import('../../../../core/ai/ai.service');
        const aiService = getAIService(prisma);

        // Identify missing fields
        const missingFields: string[] = [];
        if (!contact.email) missingFields.push('email');
        if (!contact.phone) missingFields.push('phone');
        if (!contact.companyName) missingFields.push('companyName');
        if (!contact.position) missingFields.push('position');
        if (!contact.website) missingFields.push('website');

        if (missingFields.length === 0) {
          return res.json({
            success: true,
            data: {
              complete: true,
              message: 'Contato já possui todas as informações principais',
              suggestions: [],
            },
          });
        }

        const context = `
Contact Information:
- Name: ${contact.name}
- Email: ${contact.email || 'missing'}
- Phone: ${contact.phone || 'missing'}
- Company: ${contact.companyName || 'missing'}
- Position: ${contact.position || 'missing'}
- Website: ${contact.website || 'missing'}
- Tags: ${contact.tags?.join(', ') || 'none'}
- Lead Status: ${contact.leadStatus}

Missing fields: ${missingFields.join(', ')}

Suggest where and how to find this missing info (Portuguese).
`;

        const suggestions = await aiService.generateSuggestions(
          context,
          'ways to enrich contact data (in Portuguese)'
        );

        const enrichmentSuggestions = suggestions
          .split(/\n/)
          .filter((s) => s.trim().length > 0)
          .slice(0, 5);

        res.json({
          success: true,
          data: {
            complete: false,
            completionPercentage: Math.round(
              ((6 - missingFields.length) / 6) * 100
            ),
            missingFields,
            suggestions: enrichmentSuggestions,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
