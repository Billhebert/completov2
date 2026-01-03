import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupSkillsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/skills`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category } = req.query;
      const where: any = { companyId: req.companyId! };
      if (category) where.category = category;

      const skills = await prisma.skill.findMany({
        where,
        include: { employeeSkills: { where: { userId: req.user!.id } } },
      });
      res.json({ success: true, data: skills });
    } catch (error) { next(error); }
  });
}
