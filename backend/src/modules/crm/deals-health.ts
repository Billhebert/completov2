// src/modules/crm/deals-health.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import {
  authenticate,
  tenantIsolation,
  requirePermission,
  Permission,
} from "../../core/middleware";

type Rule = {
  id: string;
  companyId: string;
  pipelineId: string | null;
  type: "NO_ACTIVITY" | "OVERDUE";
  name: string;
  days: number;
  color: string;
  priority: number;
  isActive: boolean;
};

function toDate(v: any): Date | null {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

function diffDays(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function pickRule(rules: Rule[], type: Rule["type"], daysValue: number): Rule | null {
  const candidates = rules
    .filter((r) => r.isActive && r.type === type && daysValue >= r.days)
    .sort((a, b) => {
      // maior prioridade vence; desempate: maior threshold vence
      if (a.priority !== b.priority) return b.priority - a.priority;
      return b.days - a.days;
    });

  return candidates[0] ?? null;
}

async function ensureDefaultsIfEmpty(prisma: PrismaClient, companyId: string) {
  const count = await prisma.crmDealHealthRule.count({ where: { companyId } });
  if (count > 0) return;

  await prisma.crmDealHealthRule.createMany({
    data: [
      { companyId, pipelineId: null, type: "NO_ACTIVITY", name: "Esfriando", days: 8, color: "#f59e0b", priority: 1, isActive: true },
      { companyId, pipelineId: null, type: "NO_ACTIVITY", name: "Fria", days: 15, color: "#3b82f6", priority: 2, isActive: true },
      { companyId, pipelineId: null, type: "OVERDUE", name: "Atrasada", days: 1, color: "#ef4444", priority: 1, isActive: true },
      { companyId, pipelineId: null, type: "OVERDUE", name: "Crítica", days: 8, color: "#991b1b", priority: 2, isActive: true },
    ],
  });
}

export function setupDealHealthRoutes(router: Router, prisma: PrismaClient) {
  // =========================================================
  // LISTAR DEALS COM HEALTH
  // GET /api/v1/crm/deals/health?pipelineId=...&includeClosed=1
  // =========================================================
  router.get(
    "/deals/health",
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const companyId = req.companyId!;
        await ensureDefaultsIfEmpty(prisma, companyId);

        const pipelineId = (req.query.pipelineId as string | undefined) || undefined;
        const includeClosed = String(req.query.includeClosed || "") === "1";

        // Regras: preferir pipeline; se não existir pipeline-specific, usar global
        const allRules = (await prisma.crmDealHealthRule.findMany({
          where: {
            companyId,
            OR: [
              { pipelineId: null },
              ...(pipelineId ? [{ pipelineId }] : []),
            ],
          },
          orderBy: [{ type: "asc" }, { priority: "desc" }, { days: "desc" }],
        })) as unknown as Rule[];

        const pipelineRules = pipelineId ? allRules.filter((r) => r.pipelineId === pipelineId) : [];
        const globalRules = allRules.filter((r) => r.pipelineId === null);

        const rulesToUse = (pipelineRules.length ? pipelineRules : globalRules).filter((r) => r.isActive);

        const where: any = { companyId };
        if (pipelineId) where.pipelineId = pipelineId;
        if (!includeClosed) where.stage = { notIn: ["won", "lost"] };

        const deals = await prisma.deal.findMany({
          where,
          include: {
            contact: { select: { id: true, name: true } },
            pipeline: { select: { id: true, name: true } },
            stageRef: { select: { id: true, name: true, order: true } },
            interactions: {
              orderBy: { timestamp: "desc" },
              take: 1,
              select: { id: true, timestamp: true, type: true, subject: true },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 500,
        });

        const now = new Date();

        const enriched = deals.map((d: any) => {
          const lastInteractionAt = d.interactions?.[0]?.timestamp ? new Date(d.interactions[0].timestamp) : null;
          const daysWithoutActivity = lastInteractionAt ? diffDays(lastInteractionAt, now) : 999999;

          const expectedClose = toDate(d.expectedCloseDate);
          const overdueDays =
            expectedClose && expectedClose.getTime() < now.getTime()
              ? diffDays(expectedClose, now)
              : 0;

          const ruleNoActivity = pickRule(rulesToUse, "NO_ACTIVITY", daysWithoutActivity);
          const ruleOverdue = pickRule(rulesToUse, "OVERDUE", overdueDays);

          // decide qual “vence”
          // prioridade: overdue vence se existir e overdueDays>0
          const chosen =
            ruleOverdue && overdueDays > 0
              ? { rule: ruleOverdue, value: overdueDays }
              : ruleNoActivity
              ? { rule: ruleNoActivity, value: daysWithoutActivity }
              : null;

          return {
            ...d,
            health: chosen
              ? {
                  ruleId: chosen.rule.id,
                  type: chosen.rule.type,
                  name: chosen.rule.name,
                  color: chosen.rule.color,
                  days: chosen.value,
                  threshold: chosen.rule.days,
                  priority: chosen.rule.priority,
                }
              : null,
            metrics: {
              lastInteractionAt,
              daysWithoutActivity: lastInteractionAt ? daysWithoutActivity : null,
              expectedCloseDate: expectedClose,
              overdueDays,
            },
          };
        });

        // resumo
        const summary = {
          total: enriched.length,
          noActivity: enriched.filter((x: any) => x.health?.type === "NO_ACTIVITY").length,
          overdue: enriched.filter((x: any) => x.health?.type === "OVERDUE").length,
        };

        res.json({ success: true, data: enriched, summary, rulesUsed: rulesToUse });
      } catch (e) {
        next(e);
      }
    }
  );
}
