import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import {
  authenticate,
  tenantIsolation,
  requirePermission,
  Permission,
  validateBody,
} from "../../core/middleware";

const stageInputSchema = z.object({
  name: z.string().min(1),
  order: z.number().int().min(0),
  isWon: z.boolean().optional().default(false),
  isLost: z.boolean().optional().default(false),
});

const pipelineCreateSchema = z.object({
  name: z.string().min(1),
  isDefault: z.boolean().optional().default(false),
  stages: z.array(stageInputSchema).optional(),
});

const pipelineUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
});

const stageUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  order: z.number().int().min(0).optional(),
  isWon: z.boolean().optional(),
  isLost: z.boolean().optional(),
});

function ensureNotWonAndLost(isWon?: boolean, isLost?: boolean) {
  if (isWon && isLost) {
    const err: any = new Error(
      "Stage não pode ser 'Ganho' e 'Perdido' ao mesmo tempo."
    );
    err.statusCode = 400;
    throw err;
  }
}

async function ensureSingleDefault(
  prisma: PrismaClient,
  companyId: string,
  pipelineIdToKeep?: string
) {
  await prisma.crmPipeline.updateMany({
    where: {
      companyId,
      id: pipelineIdToKeep ? { not: pipelineIdToKeep } : undefined,
      isDefault: true,
    },
    data: { isDefault: false },
  });
}

export function setupPipelineRoutes(router: Router, prisma: PrismaClient) {
  // =========================================================
  // LISTAR FUNIS (com stages)
  // GET /api/v1/crm/pipelines
  // =========================================================
  router.get(
    "/pipelines",
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const companyId = req.companyId!;
        const pipelines = await prisma.crmPipeline.findMany({
          where: { companyId },
          include: {
            stages: { orderBy: { order: "asc" } },
            _count: { select: { deals: true } },
          },
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        });

        res.json({ success: true, data: pipelines });
      } catch (e) {
        next(e);
      }
    }
  );

  // =========================================================
  // CRIAR FUNIL
  // POST /api/v1/crm/pipelines
  // =========================================================
  router.post(
    "/pipelines",
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(pipelineCreateSchema),
    async (req, res, next) => {
      try {
        const companyId = req.companyId!;
        const { name, isDefault, stages } =
          req.body as z.infer<typeof pipelineCreateSchema>;

        (stages ?? []).forEach((s) => ensureNotWonAndLost(s.isWon, s.isLost));

        const created = await prisma.crmPipeline.create({
          data: {
            companyId,
            name,
            isDefault: !!isDefault,
            stages: stages?.length
              ? {
                  create: stages.map((s) => ({
                    name: s.name,
                    order: s.order,
                    isWon: !!s.isWon,
                    isLost: !!s.isLost,
                  })),
                }
              : undefined,
          },
          include: { stages: { orderBy: { order: "asc" } } },
        });

        if (created.isDefault) {
          await ensureSingleDefault(prisma, companyId, created.id);
        }

        if (!created.stages.length) {
          await prisma.crmStage.createMany({
            data: [
              { pipelineId: created.id, name: "Lead", order: 0 },
              { pipelineId: created.id, name: "Qualificado", order: 1 },
              { pipelineId: created.id, name: "Proposta", order: 2 },
              { pipelineId: created.id, name: "Negociação", order: 3 },
              { pipelineId: created.id, name: "Ganho", order: 4, isWon: true },
              { pipelineId: created.id, name: "Perdido", order: 5, isLost: true },
            ],
          });
        }

        const reloaded = await prisma.crmPipeline.findFirst({
          where: { id: created.id, companyId },
          include: { stages: { orderBy: { order: "asc" } } },
        });

        res.status(201).json({ success: true, data: reloaded });
      } catch (e) {
        next(e);
      }
    }
  );

  // =========================================================
  // ATUALIZAR FUNIL
  // PUT /api/v1/crm/pipelines/:id
  // =========================================================
  router.put(
    "/pipelines/:id",
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(pipelineUpdateSchema),
    async (req, res, next) => {
      try {
        const companyId = req.companyId!;
        const id = req.params.id;

        const exists = await prisma.crmPipeline.findFirst({
          where: { id, companyId },
        });
        if (!exists)
          return res
            .status(404)
            .json({ success: false, message: "Pipeline não encontrado" });

        const updated = await prisma.crmPipeline.update({
          where: { id },
          data: {
            name: req.body.name,
            isDefault: req.body.isDefault,
          },
          include: { stages: { orderBy: { order: "asc" } } },
        });

        if (updated.isDefault) {
          await ensureSingleDefault(prisma, companyId, updated.id);
        }

        res.json({ success: true, data: updated });
      } catch (e) {
        next(e);
      }
    }
  );

  // =========================================================
  // DELETAR FUNIL
  // DELETE /api/v1/crm/pipelines/:id
  // =========================================================
  router.delete(
    "/pipelines/:id",
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    async (req, res, next) => {
      try {
        const companyId = req.companyId!;
        const id = req.params.id;

        const pipeline = await prisma.crmPipeline.findFirst({
          where: { id, companyId },
          include: { _count: { select: { deals: true } } },
        });
        if (!pipeline)
          return res
            .status(404)
            .json({ success: false, message: "Pipeline não encontrado" });

        if (pipeline.isDefault) {
          return res.status(400).json({
            success: false,
            message:
              "Não é permitido excluir o funil padrão. Defina outro como padrão primeiro.",
          });
        }

        if (pipeline._count.deals > 0) {
          return res.status(400).json({
            success: false,
            message:
              "Não é permitido excluir um funil que possui negociações. Mova as negociações antes.",
          });
        }

        await prisma.crmPipeline.delete({ where: { id } });
        res.json({ success: true });
      } catch (e) {
        next(e);
      }
    }
  );

  // =========================================================
  // ✅ REORDER STAGES (drag-and-drop)
  // PUT /api/v1/crm/pipelines/:id/stages/reorder
  // Aceita { orderedStageIds } OU { stageIds }
  // =========================================================
  router.put(
    "/pipelines/:id/stages/reorder",
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    async (req, res, next) => {
      try {
        const companyId = req.companyId!;
        const pipelineId = req.params.id;

        const body = req.body as any;
        const orderedStageIds: string[] =
          body.orderedStageIds ?? body.stageIds ?? body.ids ?? [];

        if (!Array.isArray(orderedStageIds) || orderedStageIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: "orderedStageIds inválido",
          });
        }

        const pipeline = await prisma.crmPipeline.findFirst({
          where: { id: pipelineId, companyId },
        });
        if (!pipeline) {
          return res
            .status(404)
            .json({ success: false, message: "Pipeline não encontrado" });
        }

        // valida que todos os stages pertencem ao pipeline
        const existingStages = await prisma.crmStage.findMany({
          where: { pipelineId },
          select: { id: true },
        });
        const valid = new Set(existingStages.map((s) => s.id));

        for (const id of orderedStageIds) {
          if (!valid.has(id)) {
            return res.status(400).json({
              success: false,
              message: "Stage inválido (não pertence a este pipeline).",
            });
          }
        }

        // atualiza ordem
        await prisma.$transaction(
          orderedStageIds.map((id, idx) =>
            prisma.crmStage.update({
              where: { id },
              data: { order: idx },
            })
          )
        );

        res.json({ success: true });
      } catch (e) {
        next(e);
      }
    }
  );

  // =========================================================
  // CRIAR STAGE
  // POST /api/v1/crm/pipelines/:id/stages
  // =========================================================
  router.post(
    "/pipelines/:id/stages",
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(stageInputSchema),
    async (req, res, next) => {
      try {
        const companyId = req.companyId!;
        const pipelineId = req.params.id;

        const pipeline = await prisma.crmPipeline.findFirst({
          where: { id: pipelineId, companyId },
        });
        if (!pipeline)
          return res
            .status(404)
            .json({ success: false, message: "Pipeline não encontrado" });

        ensureNotWonAndLost(req.body.isWon, req.body.isLost);

        const stage = await prisma.crmStage.create({
          data: {
            pipelineId,
            name: req.body.name,
            order: req.body.order,
            isWon: !!req.body.isWon,
            isLost: !!req.body.isLost,
          },
        });

        res.status(201).json({ success: true, data: stage });
      } catch (e) {
        next(e);
      }
    }
  );

  // =========================================================
  // ATUALIZAR STAGE
  // PUT /api/v1/crm/pipelines/:id/stages/:stageId
  // =========================================================
  router.put(
    "/pipelines/:id/stages/:stageId",
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(stageUpdateSchema),
    async (req, res, next) => {
      try {
        const companyId = req.companyId!;
        const pipelineId = req.params.id;
        const stageId = req.params.stageId;

        const pipeline = await prisma.crmPipeline.findFirst({
          where: { id: pipelineId, companyId },
        });
        if (!pipeline)
          return res
            .status(404)
            .json({ success: false, message: "Pipeline não encontrado" });

        const stage = await prisma.crmStage.findFirst({
          where: { id: stageId, pipelineId },
        });
        if (!stage)
          return res
            .status(404)
            .json({ success: false, message: "Stage não encontrado" });

        ensureNotWonAndLost(
          req.body.isWon ?? stage.isWon,
          req.body.isLost ?? stage.isLost
        );

        const updated = await prisma.crmStage.update({
          where: { id: stageId },
          data: {
            name: req.body.name,
            order: req.body.order,
            isWon: req.body.isWon,
            isLost: req.body.isLost,
          },
        });

        res.json({ success: true, data: updated });
      } catch (e) {
        next(e);
      }
    }
  );

  // =========================================================
  // DELETAR STAGE
  // DELETE /api/v1/crm/pipelines/:id/stages/:stageId
  // =========================================================
  router.delete(
    "/pipelines/:id/stages/:stageId",
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    async (req, res, next) => {
      try {
        const companyId = req.companyId!;
        const pipelineId = req.params.id;
        const stageId = req.params.stageId;

        const pipeline = await prisma.crmPipeline.findFirst({
          where: { id: pipelineId, companyId },
        });
        if (!pipeline)
          return res
            .status(404)
            .json({ success: false, message: "Pipeline não encontrado" });

        const stage = await prisma.crmStage.findFirst({
          where: { id: stageId, pipelineId },
          include: { _count: { select: { deals: true } } },
        });

        if (!stage)
          return res
            .status(404)
            .json({ success: false, message: "Stage não encontrado" });

        if (stage._count.deals > 0) {
          return res.status(400).json({
            success: false,
            message:
              "Não é permitido excluir um estágio com negociações. Mova as negociações antes.",
          });
        }

        await prisma.crmStage.delete({ where: { id: stageId } });
        res.json({ success: true });
      } catch (e) {
        next(e);
      }
    }
  );
}
