import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

const prisma = new PrismaClient();

export function setupPeopleGrowthMyProfileRoute(app: Express, _prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/my-profile`, authenticate, tenantIsolation, async (req: Request, res: Response) => {
    try {
      const { id: userId } = (req as any).user;

      const [gaps, skills, enrollments, plans] = await Promise.all([
        prisma.employeeGap.findMany({
          where: { employeeId: userId },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.employeeSkill.findMany({
          where: { userId },
          include: { skill: true }
        }),
        prisma.learningEnrollment.findMany({
          where: { userId, status: 'enrolled' },
          include: {
            path: {
              include: { items: true }
            }
          }
        }),
        prisma.skillDevelopmentPlan.findMany({
          where: { userId }
        })
      ]);

      res.json({
        gaps: {
          total: gaps.length,
          open: gaps.filter(g => g.status === 'OPEN').length,
          closed: gaps.filter(g => g.status === 'CLOSED').length,
          byDomain: gaps.reduce((acc: any, g) => {
            acc[g.domain] = (acc[g.domain] || 0) + 1;
            return acc;
          }, {})
        },
        skills: skills.map(s => ({
          skill: s.skill.name,
          proficiency: s.proficiency,
          lastAssessed: s.lastAssessed
        })),
        activeLearningPaths: enrollments.length,
        developmentPlans: plans.length
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });
}
