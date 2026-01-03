import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { templates, TemplateName } from '../templates';

function getTemplateDescription(name: TemplateName): string {
  const descriptions: Record<TemplateName, string> = {
    welcome: 'Welcome email for new users',
    passwordReset: 'Password reset email with secure link',
    dealWon: 'Congratulations email when a deal is won',
    notification: 'Generic notification email',
    invoice: 'Invoice email with PDF download',
  };
  return descriptions[name] || 'Email template';
}

export function setupEmailTemplatesListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const templateList = Object.keys(templates).map((name) => ({
        name,
        description: getTemplateDescription(name as TemplateName),
      }));

      res.json({ success: true, data: templateList });
    } catch (error) {
      next(error);
    }
  });
}
