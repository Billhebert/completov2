import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { templates, TemplateName } from '../templates';
import { sendEmail } from '../../../core/queues';

export function setupEmailTemplatesSendRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/send`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { to, templateName, variables } = req.body;

      if (!templates[templateName as TemplateName]) {
        return res.status(400).json({
          success: false,
          error: { message: 'Template not found' },
        });
      }

      const template = templates[templateName as TemplateName](variables);

      await sendEmail({
        to,
        subject: template.subject,
        html: template.html,
      });

      res.json({ success: true, message: 'Email queued for sending' });
    } catch (error) {
      next(error);
    }
  });
}
