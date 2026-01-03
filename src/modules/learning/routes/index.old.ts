import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody, requirePermission, Permission } from '../../../core/middleware';
import { z } from 'zod';

const learningPathSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  category: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedHours: z.number().positive(),
  targetSkills: z.array(z.string()).optional(),
});

export function setupPathsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/paths`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, difficulty } = req.query;
      const where: any = { companyId: req.companyId! };
      if (category) where.category = category;
      if (difficulty) where.difficulty = difficulty;

      const paths = await prisma.learningPath.findMany({
        where,
        include: { _count: { select: { items: true, enrollments: true } } },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: paths });
    } catch (error) { next(error); }
  });
}

export function setupPathsCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/paths`, authenticate, tenantIsolation, requirePermission(Permission.USER_READ), validateBody(learningPathSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const path = await prisma.learningPath.create({
        data: { ...req.body, companyId: req.companyId!, createdBy: req.user!.id },
      });
      res.status(201).json({ success: true, data: path });
    } catch (error) { next(error); }
  });
}

export function setupPathsGetRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/paths/:id`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const path = await prisma.learningPath.findFirst({
        where: { id: req.params.id, companyId: req.companyId! },
        include: {
          items: { orderBy: { order: 'asc' } },
          enrollments: { where: { userId: req.user!.id }, include: { user: { select: { id: true, name: true } } } },
        },
      });
      if (!path) return res.status(404).json({ success: false, error: { message: 'Path not found' } });
      res.json({ success: true, data: path });
    } catch (error) { next(error); }
  });
}

export function setupEnrollRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/paths/:id/enroll`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const enrollment = await prisma.learningEnrollment.create({
        data: { userId: req.user!.id, pathId: req.params.id, status: 'enrolled', progress: 0 },
      });
      res.status(201).json({ success: true, data: enrollment });
    } catch (error) { next(error); }
  });
}

export function setupEnrollmentsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/enrollments`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const enrollments = await prisma.learningEnrollment.findMany({
        where: { userId: req.user!.id },
        include: { path: { include: { _count: { select: { items: true } } } } },
        orderBy: { enrolledAt: 'desc' },
      });
      res.json({ success: true, data: enrollments });
    } catch (error) { next(error); }
  });
}

export function setupItemCompleteRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/items/:itemId/complete`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const progress = await prisma.learningProgress.upsert({
        where: { userId_itemId: { userId: req.user!.id, itemId: req.params.itemId } },
        create: { userId: req.user!.id, itemId: req.params.itemId, status: 'completed', completedAt: new Date() },
        update: { status: 'completed', completedAt: new Date() },
      });

      const item = await prisma.learningPathItem.findUnique({ where: { id: req.params.itemId } });
      if (item) {
        const enrollment = await prisma.learningEnrollment.findUnique({
          where: { userId_pathId: { userId: req.user!.id, pathId: item.pathId } },
        });

        if (enrollment) {
          const totalItems = await prisma.learningPathItem.count({ where: { pathId: item.pathId } });
          const completedItems = await prisma.learningProgress.count({
            where: { userId: req.user!.id, status: 'completed', item: { pathId: item.pathId } },
          });
          const newProgress = (completedItems / totalItems) * 100;

          await prisma.learningEnrollment.update({
            where: { id: enrollment.id },
            data: { progress: newProgress, status: newProgress >= 100 ? 'completed' : 'in_progress', completedAt: newProgress >= 100 ? new Date() : null },
          });
        }
      }

      res.json({ success: true, data: progress });
    } catch (error) { next(error); }
  });
}

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

export function setupDevelopmentPlansRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/development-plans`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plans = await prisma.skillDevelopmentPlan.findMany({
        where: { companyId: req.companyId!, userId: req.user!.id },
      });
      res.json({ success: true, data: plans });
    } catch (error) { next(error); }
  });
}
