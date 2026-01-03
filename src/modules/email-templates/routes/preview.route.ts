import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { templates, TemplateName } from '../templates';

export function setupEmailTemplatesPreviewRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/preview`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { templateName, variables } = req.body;

      if (!templates[templateName as TemplateName]) {
        return res.status(400).json({
          success: false,
          error: { message: 'Template not found' },
        });
      }

      const template = templates[templateName as TemplateName](variables);

      res.json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  });
}
