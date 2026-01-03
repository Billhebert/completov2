import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupMySkillsRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/skills/my`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeSkills = await prisma.employeeSkill.findMany({
        where: { userId: req.user!.id },
        include: { skill: true },
      });
      res.json({ success: true, data: employeeSkills });
    } catch (error) { next(error); }
  });
}
