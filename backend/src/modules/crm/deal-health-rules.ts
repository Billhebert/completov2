// src/modules/crm/deal-health-rules.ts
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

const createRuleSchema = z.object({
  pipelineId: z.string().uuid().optional().nullable(), // null/undefined => global
  type: z.enum(["NO_ACTIVITY", "OVERDUE"]),
  name: z.string().min(1),
  days: z.number().int().min(0),
  color: z.string().min(1), // hex ou token
  priority: z.number().int().min(0).default(0),
  isActive: z.boolean().optional().default(true),
});

const updateRuleSchema = z.object({
  pipelineId: z.string().uuid().optional().nullable(),
  type: z.enum(["NO_ACTIVITY", "OVERDUE"]).optional(),
  name: z.string().min(1).optional(),
  days: z.number().int().min(0).optional(),
  color: z.string().min(1).optional(),
  priority: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

type DealHealthType = "NO_ACTIVITY" | "OVERDUE";

const DEFAULT_RULES: Array<{
  type: DealHealthType;
  name: string;
  days: number;
  color: string;
  priority: number;
}> = [
  { type: "NO_ACTIVITY", name: "Esfriando", days: 8, color: "#f59e0b", priority: 1 },
  { type: "NO_ACTIVITY", name: "Fria", days: 15, color: "#3b82f6", priority: 2 },

  { type: "OVERDUE", name: "Atrasada", days: 1, color: "#ef4444", priority: 1 },
  { type: "OVERDUE", name: "Crítica", days: 8, color: "#991b1b", priority: 2 },
];

async function ensureDefaultsIfEmpty(prisma: PrismaClient, companyId: string) {
  const count = await prisma.crmDealHealthRule.count({
    where: { companyId },
  });

  if (count > 0) return;

  await prisma.crmDealHealthRule.createMany({
    data: DEFAULT_RULES.map((r) => ({
      companyId,
      pipelineId: null,
      type: r.type as any,
      name: r.name,
      days: r.days,
      color: r.color,
      priority: r.priority,
      isActive: true,
    })),
  });
}

export function setupDealHealthRuleRoutes(router: Router, prisma: PrismaClient) {
  // =========================================================
  // LISTAR REGRAS
  // GET /api/v1/crm/deal-health-rules?pipelineId=...
  // - retorna global + (opcional) pipeline específicas
  // =========================================================
  router.get(
    "/deal-health-rules",
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const companyId = req.companyId!;
        await ensureDefaultsIfEmpty(prisma, companyId);

        const pipelineId = (req.query.pipelineId as string | undefined) || undefined;

        const rules = await prisma.crmDealHealthRule.findMany({
          where: {
            companyId,
            OR: [
              { pipelineId: null },
              ...(pipelineId ? [{ pipelineId }] : []),
            ],
          },
          orderBy: [{ type: "asc" }, { priority: "asc" }, { days: "asc" }],
        });

        res.json({ success: true, data: rules });
      } catch (e) {
        next(e);
      }
    }
  );

  // =========================================================
  // CRIAR REGRA
  // POST /api/v1/crm/deal-health-rules
  // =========================================================
  router.post(
    "/deal-health-rules",
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(createRuleSchema),
    async (req, res, next) => {
      try {
        const companyId = req.companyId!;
        await ensureDefaultsIfEmpty(prisma, companyId);

        const payload = req.body as z.infer<typeof createRuleSchema>;

        // (opcional) validar pipelineId é do tenant
        if (payload.pipelineId) {
          const p = await prisma.crmPipeline.findFirst({
            where: { id: payload.pipelineId, companyId },
            select: { id: true },
          });
          if (!p) {
            return res.status(404).json({ success: false, message: "Pipeline não encontrado para este tenant." });
          }
        }

        const created = await prisma.crmDealHealthRule.create({
          data: {
            companyId,
            pipelineId: payload.pipelineId ?? null,
            type: payload.type as any,
            name: payload.name,
            days: payload.days,
            color: payload.color,
            priority: payload.priority ?? 0,
            isActive: payload.isActive ?? true,
          },
        });

        res.status(201).json({ success: true, data: created });
      } catch (e) {
        next(e);
      }
    }
  );

  // =========================================================
  // ATUALIZAR REGRA
  // PUT /api/v1/crm/deal-health-rules/:id
  // =========================================================
  router.put(
    "/deal-health-rules/:id",
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(updateRuleSchema),
    async (req, res, next) => {
      try {
        const companyId = req.companyId!;
        const id = req.params.id;

        const exists = await prisma.crmDealHealthRule.findFirst({
          where: { id, companyId },
        });
        if (!exists) {
          return res.status(404).json({ success: false, message: "Regra não encontrada" });
        }

        const payload = req.body as z.infer<typeof updateRuleSchema>;

        // validar pipelineId se veio
        if (payload.pipelineId) {
          const p = await prisma.crmPipeline.findFirst({
            where: { id: payload.pipelineId, companyId },
            select: { id: true },
          });
          if (!p) {
            return res.status(404).json({ success: false, message: "Pipeline não encontrado para este tenant." });
          }
        }

        const updated = await prisma.crmDealHealthRule.update({
          where: { id },
          data: {
            pipelineId:
              payload.pipelineId === undefined ? undefined : payload.pipelineId ?? null,
            type: payload.type as any,
            name: payload.name,
            days: payload.days,
            color: payload.color,
            priority: payload.priority,
            isActive: payload.isActive,
          },
        });

        res.json({ success: true, data: updated });
      } catch (e) {
        next(e);
      }
    }
  );

  // =========================================================
  // DELETAR REGRA
  // DELETE /api/v1/crm/deal-health-rules/:id
  // =========================================================
  router.delete(
    "/deal-health-rules/:id",
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    async (req, res, next) => {
      try {
        const companyId = req.companyId!;
        const id = req.params.id;

        const exists = await prisma.crmDealHealthRule.findFirst({
          where: { id, companyId },
        });
        if (!exists) {
          return res.status(404).json({ success: false, message: "Regra não encontrada" });
        }

        await prisma.crmDealHealthRule.delete({ where: { id } });
        res.json({ success: true });
      } catch (e) {
        next(e);
      }
    }
  );
}
