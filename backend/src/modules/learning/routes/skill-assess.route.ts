import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupSkillAssessRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/skills/:skillId/assess`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { proficiency } = req.body;
      const employeeSkill = await prisma.employeeSkill.upsert({
        where: { userId_skillId: { userId: req.user!.id, skillId: req.params.skillId } },
        create: { userId: req.user!.id, skillId: req.params.skillId, proficiency, lastAssessed: new Date() },
        update: { proficiency, lastAssessed: new Date() },
      });
      res.json({ success: true, data: employeeSkill });
    } catch (error) { next(error); }
  });
}
