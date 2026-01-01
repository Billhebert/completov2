// src/modules/learning/index.ts
import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody, requirePermission, Permission } from '../../core/middleware';
import { z } from 'zod';

const learningPathSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  category: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedHours: z.number().positive(),
  targetSkills: z.array(z.string()).optional(),
});

const enrollSchema = z.object({
  userId: z.string(),
});

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/learning';

  // ============================================
  // LEARNING PATHS
  // ============================================

  app.get(`${base}/paths`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { category, difficulty } = req.query;
      
      const where: any = { companyId: req.companyId! };
      if (category) where.category = category;
      if (difficulty) where.difficulty = difficulty;

      const paths = await prisma.learningPath.findMany({
        where,
        include: {
          _count: {
            select: { items: true, enrollments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: paths });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/paths`, authenticate, tenantIsolation, requirePermission(Permission.USER_READ), validateBody(learningPathSchema), async (req, res, next) => {
    try {
      const path = await prisma.learningPath.create({
        data: {
          ...req.body,
          companyId: req.companyId!,
          createdBy: req.user!.id,
        },
      });
      res.status(201).json({ success: true, data: path });
    } catch (error) {
      next(error);
    }
  });

  app.get(`${base}/paths/:id`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const path = await prisma.learningPath.findFirst({
        where: { id: req.params.id, companyId: req.companyId! },
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
          enrollments: {
            where: { userId: req.user!.id },
            include: { user: { select: { id: true, name: true } } },
          },
        },
      });

      if (!path) {
        return res.status(404).json({ success: false, error: { message: 'Path not found' } });
      }

      res.json({ success: true, data: path });
    } catch (error) {
      next(error);
    }
  });

  // ============================================
  // ENROLLMENTS
  // ============================================

  app.post(`${base}/paths/:id/enroll`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const enrollment = await prisma.learningEnrollment.create({
        data: {
          userId: req.user!.id,
          pathId: req.params.id,
          status: 'enrolled',
          progress: 0,
        },
      });
      res.status(201).json({ success: true, data: enrollment });
    } catch (error) {
      next(error);
    }
  });

  app.get(`${base}/enrollments`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const enrollments = await prisma.learningEnrollment.findMany({
        where: { userId: req.user!.id },
        include: {
          path: {
            include: {
              _count: { select: { items: true } },
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      });

      res.json({ success: true, data: enrollments });
    } catch (error) {
      next(error);
    }
  });

  // ============================================
  // PROGRESS
  // ============================================

  app.post(`${base}/items/:itemId/complete`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const progress = await prisma.learningProgress.upsert({
        where: {
          userId_itemId: {
            userId: req.user!.id,
            itemId: req.params.itemId,
          },
        },
        create: {
          userId: req.user!.id,
          itemId: req.params.itemId,
          status: 'completed',
          completedAt: new Date(),
        },
        update: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // Update enrollment progress
      const item = await prisma.learningPathItem.findUnique({
        where: { id: req.params.itemId },
      });

      if (item) {
        const enrollment = await prisma.learningEnrollment.findUnique({
          where: {
            userId_pathId: {
              userId: req.user!.id,
              pathId: item.pathId,
            },
          },
        });

        if (enrollment) {
          const totalItems = await prisma.learningPathItem.count({
            where: { pathId: item.pathId },
          });

          const completedItems = await prisma.learningProgress.count({
            where: {
              userId: req.user!.id,
              status: 'completed',
              item: { pathId: item.pathId },
            },
          });

          const newProgress = (completedItems / totalItems) * 100;

          await prisma.learningEnrollment.update({
            where: { id: enrollment.id },
            data: {
              progress: newProgress,
              status: newProgress >= 100 ? 'completed' : 'in_progress',
              completedAt: newProgress >= 100 ? new Date() : null,
            },
          });
        }
      }

      res.json({ success: true, data: progress });
    } catch (error) {
      next(error);
    }
  });

  // ============================================
  // SKILLS
  // ============================================

  app.get(`${base}/skills`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { category } = req.query;
      
      const where: any = { companyId: req.companyId! };
      if (category) where.category = category;

      const skills = await prisma.skill.findMany({
        where,
        include: {
          employeeSkills: {
            where: { userId: req.user!.id },
          },
        },
      });

      res.json({ success: true, data: skills });
    } catch (error) {
      next(error);
    }
  });

  app.get(`${base}/skills/my`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const employeeSkills = await prisma.employeeSkill.findMany({
        where: { userId: req.user!.id },
        include: { skill: true },
      });

      res.json({ success: true, data: employeeSkills });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/skills/:skillId/assess`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { proficiency } = req.body;

      const employeeSkill = await prisma.employeeSkill.upsert({
        where: {
          userId_skillId: {
            userId: req.user!.id,
            skillId: req.params.skillId,
          },
        },
        create: {
          userId: req.user!.id,
          skillId: req.params.skillId,
          proficiency,
          lastAssessed: new Date(),
        },
        update: {
          proficiency,
          lastAssessed: new Date(),
        },
      });

      res.json({ success: true, data: employeeSkill });
    } catch (error) {
      next(error);
    }
  });

  // ============================================
  // DEVELOPMENT PLANS
  // ============================================

  app.get(`${base}/development-plans`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const plans = await prisma.skillDevelopmentPlan.findMany({
        where: {
          companyId: req.companyId!,
          userId: req.user!.id,
        },
      });

      res.json({ success: true, data: plans });
    } catch (error) {
      next(error);
    }
  });
}

export const learningModule: ModuleDefinition = {
  name: 'learning',
  version: '1.0.0',
  provides: ['learning', 'skills'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma),
};
