// src/modules/email-templates/index.ts
import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../core/middleware';
import { templates, TemplateName } from './templates';
import { sendEmail } from '../../core/queues';

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/email-templates';

  // List available templates
  app.get(`${base}`, authenticate, tenantIsolation, async (req, res, next) => {
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

  // Preview template
  app.post(`${base}/preview`, authenticate, tenantIsolation, async (req, res, next) => {
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

  // Send templated email
  app.post(`${base}/send`, authenticate, tenantIsolation, async (req, res, next) => {
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

export const emailTemplatesModule: ModuleDefinition = {
  name: 'email-templates',
  version: '1.0.0',
  provides: ['email', 'templates'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma),
};
