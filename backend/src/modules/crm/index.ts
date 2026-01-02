// src/modules/crm/index.ts
import { ModuleDefinition } from "../../core/types";
import { Express, Router } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { EventBus, Events } from "../../core/event-bus";
import {
  authenticate,
  tenantIsolation,
  validateBody,
  requirePermission,
  Permission,
} from "../../core/middleware";
import { z } from "zod";

// Rotas separadas (arquivos existentes no seu backend)
import { setupActivityRoutes } from "./activities";
import { setupLeadScoringRoutes } from "./lead-scoring";
import { setupImportExportRoutes } from "./import-export";
import { setupCompanyRoutes } from "./companies";
import { setupPipelineRoutes } from "./pipelines";
import { setupDealHealthRuleRoutes } from "./deal-health-rules";
import { setupDealHealthRoutes } from "./deals-health";

const contactSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  crmCompanyId: z.string().uuid().optional(), // FK para CrmCompany
  position: z.string().optional(),
  website: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  ownerId: z.string().optional(),
});

const dealSchema = z.object({
  title: z.string().min(1),
  contactId: z.string().uuid(),

  // ✅ FIX do 422: era positive() (não aceitava 0)
  value: z.number().nonnegative(),

  currency: z.string().default("BRL"),

  // modo legado (string)
  stage: z.string().optional(),

  expectedCloseDate: z.string().optional(),
  ownerId: z.string().optional(),

  // ✅ suporte funis dinâmicos
  pipelineId: z.string().uuid().optional(),
  stageId: z.string().uuid().optional(),

  // ❌ IMPORTANTE:
  // NÃO aceitar "companyId" vindo do body, porque ele conflita com o companyId do tenant (FK deals_companyId_fkey)
  // Se você quiser ligar o deal a uma "CRM Company", crie um campo separado no schema, ex: crmCompanyId.

  products: z
    .array(
      z.object({
        productId: z.string(),
        productName: z.string(),
        quantity: z.number().positive(),
        unitPrice: z.number(),
      })
    )
    .optional(),
});

const interactionSchema = z.object({
  type: z.enum(["call", "email", "meeting", "note"]),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  subject: z.string().optional(),
  content: z.string(),
  direction: z.enum(["inbound", "outbound"]).optional(),
  scheduledFor: z.string().optional(),
});

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  const base = "/api/v1/crm";

  /**
   * ✅ PONTO-CHAVE (evita 404):
   * tudo que estiver em arquivos com router.get("/pipelines") etc
   * precisa ser montado em app.use("/api/v1/crm", router)
   */
  const router = Router();

  setupPipelineRoutes(router, prisma); // /pipelines
  setupCompanyRoutes(router, prisma); // /companies
  setupActivityRoutes(router, prisma, eventBus);
  setupLeadScoringRoutes(router, prisma);
  setupImportExportRoutes(router, prisma, eventBus);
  setupDealHealthRuleRoutes(router, prisma); // /deal-health-rules
  setupDealHealthRoutes(router, prisma); // /deals/health

  app.use(base, router);

  // =========================================================
  // CONTACTS
  // =========================================================
  app.get(
    `${base}/contacts`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const {
          search,
          tag,
          leadStatus,
          ownerId,
          page = "1",
          limit = "20",
        } = req.query;

        const where: any = { companyId: req.companyId! };

        if (search) {
          where.OR = [
            { name: { contains: search as string, mode: "insensitive" } },
            { email: { contains: search as string, mode: "insensitive" } },
            {
              companyName: { contains: search as string, mode: "insensitive" },
            },
          ];
        }

        if (tag) where.tags = { has: tag as string };
        if (leadStatus) where.leadStatus = leadStatus;
        if (ownerId) where.ownerId = ownerId;

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const [contacts, total] = await Promise.all([
          prisma.contact.findMany({
            where,
            skip,
            take: parseInt(limit as string),
            include: {
              owner: { select: { id: true, name: true, email: true } },
              crmCompany: { select: { id: true, name: true, status: true } },
              _count: { select: { deals: true, interactions: true } },
            },
            orderBy: { createdAt: "desc" },
          }),
          prisma.contact.count({ where }),
        ]);

        res.json({
          success: true,
          data: contacts,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  app.post(
    `${base}/contacts`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(contactSchema),
    async (req, res, next) => {
      try {
        const { companyId, userId } = req as any;

        // normaliza email
        const email = String(req.body.email || "")
          .trim()
          .toLowerCase();

        const contact = await prisma.contact.create({
          data: {
            ...req.body,
            email,
            companyId,
            ownerId: userId,
          },
        });

        return res.status(201).json({ data: contact });
      } catch (err: any) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          const targets = (err.meta as any)?.target as string[] | undefined;
          const isEmailConflict =
            Array.isArray(targets) && targets.includes("email");

          return res.status(409).json({
            code: "CONTACT_EMAIL_ALREADY_EXISTS",
            message: isEmailConflict
              ? "Já existe um contato com esse email nesta empresa."
              : "Já existe um registro com dados duplicados.",
          });
        }

        return next(err);
      }
    }
  );

  app.get(
    `${base}/contacts/:id`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const contact = await prisma.contact.findFirst({
          where: { id: req.params.id, companyId: req.companyId! },
          include: {
            owner: { select: { id: true, name: true, email: true } },
            crmCompany: { select: { id: true, name: true, status: true, industry: true } },
            deals: {
              include: { owner: { select: { id: true, name: true } } },
              orderBy: { createdAt: "desc" },
            },
            interactions: {
              include: { user: { select: { id: true, name: true } } },
              orderBy: { timestamp: "desc" },
              take: 10,
            },
          },
        });

        if (!contact) {
          return res
            .status(404)
            .json({ success: false, error: { message: "Contact not found" } });
        }

        res.json({ success: true, data: contact });
      } catch (error) {
        next(error);
      }
    }
  );

  app.patch(
    `${base}/contacts/:id`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    async (req, res, next) => {
      try {
        const contact = await prisma.contact.update({
          where: { id: req.params.id },
          data: req.body,
        });
        res.json({ success: true, data: contact });
      } catch (error) {
        next(error);
      }
    }
  );

  app.delete(
    `${base}/contacts/:id`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    async (req, res, next) => {
      try {
        // Verifica se o contato existe e pertence ao tenant
        const contact = await prisma.contact.findFirst({
          where: { id: req.params.id, companyId: req.companyId! },
          include: {
            _count: {
              select: {
                deals: true,
                interactions: true,
              },
            },
          },
        });

        if (!contact) {
          return res.status(404).json({
            success: false,
            message: "Contato não encontrado",
          });
        }

        // Exclusão em cascata: primeiro deleta os produtos dos deals, depois os deals, depois as interações, e por fim o contato
        await prisma.$transaction(async (tx) => {
          // 1. Deleta produtos de todos os deals deste contato
          const deals = await tx.deal.findMany({
            where: { contactId: req.params.id },
            select: { id: true },
          });

          for (const deal of deals) {
            await tx.dealProduct.deleteMany({
              where: { dealId: deal.id },
            });
          }

          // 2. Deleta todos os deals deste contato
          await tx.deal.deleteMany({
            where: { contactId: req.params.id },
          });

          // 3. Deleta todas as interações deste contato
          await tx.interaction.deleteMany({
            where: { contactId: req.params.id },
          });

          // 4. Deleta o contato
          await tx.contact.delete({
            where: { id: req.params.id },
          });
        });

        res.json({
          success: true,
          message: "Contact deleted",
          deletedRelations: {
            deals: contact._count.deals,
            interactions: contact._count.interactions,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // =========================================================
  // DEALS
  // =========================================================
  app.get(
    `${base}/deals`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const {
          stage,
          ownerId,
          page = "1",
          limit = "20",
          pipelineId,
        } = req.query as any;

        const where: any = { companyId: req.companyId! };
        if (stage) where.stage = stage;
        if (ownerId) where.ownerId = ownerId;

        if (pipelineId) where.pipelineId = pipelineId;

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const [deals, total] = await Promise.all([
          prisma.deal.findMany({
            where,
            skip,
            take: parseInt(limit as string),
            include: {
              contact: { select: { id: true, name: true, email: true } },
              owner: { select: { id: true, name: true, email: true } },
              products: true,
              pipeline: true,
              stageRef: true,
            },
            orderBy: { createdAt: "desc" },
          }),
          prisma.deal.count({ where }),
        ]);

        res.json({
          success: true,
          data: deals,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  app.post(
    `${base}/deals`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(dealSchema),
    async (req, res, next) => {
      try {
        // ✅ 1) GARANTE QUE O TENANT EXISTE NA TABELA companies
        const tenantCompanyId = req.companyId!;

        const tenant = await prisma.company.findUnique({
          where: { id: tenantCompanyId },
          select: { id: true, name: true },
        });

        if (!tenant) {
          // ✅ Retorna erro claro (em vez de 500)
          return res.status(400).json({
            success: false,
            code: "TENANT_COMPANY_NOT_FOUND",
            message:
              "Seu tenant (companies) não existe no banco. Crie/seed uma Company com esse companyId antes de criar Deals.",
            details: {
              companyId: tenantCompanyId,
              hint: "Rode: SELECT id,name,domain FROM companies WHERE id = '<companyId>';",
            },
          });

          /**
           * ✅ OPCIONAL (somente dev):
           * se você quiser auto-criar no desenvolvimento, você pode descomentar isso.
           *
           * const fakeDomain = `tenant-${tenantCompanyId}.local`;
           * await prisma.company.create({
           *   data: {
           *     id: tenantCompanyId,
           *     name: "Tenant (auto)",
           *     domain: fakeDomain,
           *     active: true,
           *   },
           * });
           */
        }

        // ✅ 2) Normaliza payload
        const { products, pipelineId, stageId, ...dealData } = req.body as any;

        // ✅ resolve stageId -> pipelineId, stage(open/won/lost) e closedDate
        let resolvedPipelineId: string | undefined = pipelineId;
        let resolvedStageId: string | undefined = stageId;

        let resolvedStageString: string =
          typeof dealData.stage === "string" && dealData.stage.trim().length
            ? dealData.stage
            : "open";

        let closedDate: Date | null = null;

        if (stageId) {
          const stage = await prisma.crmStage.findFirst({
            where: { id: stageId },
            include: { pipeline: true },
          });

          // valida tenant
          if (!stage || stage.pipeline.companyId !== tenantCompanyId) {
            return res
              .status(404)
              .json({ success: false, message: "Stage inválido" });
          }

          resolvedPipelineId = stage.pipelineId;
          resolvedStageId = stage.id;

          resolvedStageString = stage.isWon
            ? "won"
            : stage.isLost
            ? "lost"
            : "open";

          closedDate = stage.isWon || stage.isLost ? new Date() : null;
        }

        // ✅ 3) Cria deal SEMPRE com companyId do TENANT
        const created = await prisma.deal.create({
          data: {
            ...dealData,

            // 🔥 AQUI é o mais importante: o companyId do Deal é SEMPRE o tenant
            companyId: tenantCompanyId,

            ownerId: dealData.ownerId || req.user!.id,

            pipelineId: resolvedPipelineId,
            stageId: resolvedStageId,

            stage: resolvedStageString,
            closedDate,

            products: products
              ? {
                  create: products.map((p: any) => ({
                    ...p,
                    total: p.quantity * p.unitPrice,
                  })),
                }
              : undefined,
          },
          include: {
            products: true,
            pipeline: true,
            stageRef: true,
          },
        });

        // event
        await eventBus.publish(Events.DEAL_CREATED, {
          type: Events.DEAL_CREATED,
          version: "v1",
          timestamp: new Date(),
          companyId: tenantCompanyId,
          userId: req.user!.id,
          data: {
            dealId: created.id,
            title: created.title,
            value: created.value,
          },
        });

        return res.status(201).json({ success: true, data: created });
      } catch (error) {
        next(error);
      }
    }
  );

  // Get single deal
  app.get(
    `${base}/deals/:id`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const deal = await prisma.deal.findFirst({
          where: { id: req.params.id, companyId: req.companyId! },
          include: {
            contact: { select: { id: true, name: true, email: true } },
            owner: { select: { id: true, name: true, email: true } },
            products: true,
            pipeline: true,
            stageRef: true,
            interactions: {
              orderBy: { timestamp: "desc" },
              take: 10,
            },
          },
        });

        if (!deal) {
          return res
            .status(404)
            .json({ success: false, error: { message: "Deal not found" } });
        }

        res.json({ success: true, data: deal });
      } catch (error) {
        next(error);
      }
    }
  );

  // Update deal
  app.put(
    `${base}/deals/:id`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    async (req, res, next) => {
      try {
        const deal = await prisma.deal.findFirst({
          where: { id: req.params.id, companyId: req.companyId! },
        });

        if (!deal) {
          return res
            .status(404)
            .json({ success: false, message: "Deal não encontrado" });
        }

        const { products, pipelineId, stageId, ...updateData } = req.body;

        // Resolve stage if stageId is provided
        let resolvedPipelineId = pipelineId;
        let resolvedStageId = stageId;
        let resolvedStageString = updateData.stage || deal.stage;
        let closedDate = deal.closedDate;

        if (stageId) {
          const stage = await prisma.crmStage.findFirst({
            where: { id: stageId },
            include: { pipeline: true },
          });

          if (!stage || stage.pipeline.companyId !== req.companyId!) {
            return res
              .status(404)
              .json({ success: false, message: "Stage inválido" });
          }

          resolvedPipelineId = stage.pipelineId;
          resolvedStageId = stage.id;
          resolvedStageString = stage.isWon
            ? "won"
            : stage.isLost
            ? "lost"
            : "open";
          closedDate = stage.isWon || stage.isLost ? new Date() : null;
        }

        const updated = await prisma.deal.update({
          where: { id: req.params.id },
          data: {
            ...updateData,
            pipelineId: resolvedPipelineId,
            stageId: resolvedStageId,
            stage: resolvedStageString,
            closedDate,
          },
          include: {
            products: true,
            pipeline: true,
            stageRef: true,
            contact: true,
            owner: true,
          },
        });

        res.json({ success: true, data: updated });
      } catch (error) {
        next(error);
      }
    }
  );

  // Delete deal
  app.delete(
    `${base}/deals/:id`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    async (req, res, next) => {
      try {
        const deal = await prisma.deal.findFirst({
          where: { id: req.params.id, companyId: req.companyId! },
        });

        if (!deal) {
          return res
            .status(404)
            .json({ success: false, message: "Deal não encontrado" });
        }

        // Delete in transaction: products first, then deal
        await prisma.$transaction(async (tx) => {
          // Delete all products of this deal
          await tx.dealProduct.deleteMany({
            where: { dealId: req.params.id },
          });

          // Delete all interactions of this deal
          await tx.interaction.deleteMany({
            where: { dealId: req.params.id },
          });

          // Delete the deal
          await tx.deal.delete({
            where: { id: req.params.id },
          });
        });

        res.json({ success: true, message: "Deal deleted" });
      } catch (error) {
        next(error);
      }
    }
  );

  // ✅ mover estágio por stageId (pipeline dinâmico)
  const moveDealSchema = z.object({ stageId: z.string().uuid() });

  app.patch(
    `${base}/deals/:id/stage`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(moveDealSchema),
    async (req, res, next) => {
      try {
        const companyId = req.companyId!;
        const dealId = req.params.id;
        const { stageId } = req.body;

        const deal = await prisma.deal.findFirst({
          where: { id: dealId, companyId },
        });
        if (!deal) {
          return res
            .status(404)
            .json({ success: false, message: "Deal não encontrado" });
        }

        const stage = await prisma.crmStage.findFirst({
          where: { id: stageId },
          include: { pipeline: true },
        });

        if (!stage || stage.pipeline.companyId !== companyId) {
          return res
            .status(404)
            .json({ success: false, message: "Stage inválido" });
        }

        const updated = await prisma.deal.update({
          where: { id: dealId },
          data: {
            pipelineId: stage.pipelineId,
            stageId: stage.id,
            stage: stage.isWon ? "won" : stage.isLost ? "lost" : "open",
            closedDate: stage.isWon || stage.isLost ? new Date() : null,
          },
          include: { pipeline: true, stageRef: true },
        });

        res.json({ success: true, data: updated });
      } catch (e) {
        next(e);
      }
    }
  );

  // =========================================================
  // INTERACTIONS
  // =========================================================
  app.post(
    `${base}/interactions`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(interactionSchema),
    async (req, res, next) => {
      try {
        const interaction = await prisma.interaction.create({
          data: {
            ...req.body,
            companyId: req.companyId!,
            userId: req.user!.id,
          },
        });
        res.status(201).json({ success: true, data: interaction });
      } catch (error) {
        next(error);
      }
    }
  );

  app.get(
    `${base}/interactions`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const { contactId, dealId, type, limit = "50" } = req.query as any;

        const where: any = { companyId: req.companyId! };
        if (contactId) where.contactId = contactId;
        if (dealId) where.dealId = dealId;
        if (type) where.type = type;

        const interactions = await prisma.interaction.findMany({
          where,
          take: parseInt(limit as string),
          include: {
            user: { select: { id: true, name: true, email: true } },
            contact: { select: { id: true, name: true } },
            deal: { select: { id: true, title: true } },
          },
          orderBy: { timestamp: "desc" },
        });

        res.json({ success: true, data: interactions });
      } catch (error) {
        next(error);
      }
    }
  );

  // =========================================================
  // INTELLIGENT CRM (AI)
  // =========================================================

  // Deal probability
  app.get(
    `${base}/deals/:id/probability`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const deal = await prisma.deal.findFirst({
          where: { id: req.params.id, companyId: req.companyId! },
          include: {
            contact: true,
            products: true,
            interactions: {
              where: { dealId: req.params.id },
              orderBy: { timestamp: "desc" },
              take: 10,
            },
          },
        });

        if (!deal) {
          return res
            .status(404)
            .json({ success: false, error: { message: "Deal not found" } });
        }

        const { getAIService } = await import("../../core/ai/ai.service");
        const aiService = getAIService(prisma);

        const context = `
Deal Analysis:
- Stage: ${deal.stage}
- Value: ${deal.value} ${deal.currency}
- Age: ${Math.floor(
          (Date.now() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        )} days
- Expected Close Date: ${deal.expectedCloseDate || "Not set"}
- Number of Interactions: ${deal.interactions?.length || 0}
- Last Interaction: ${
          deal.interactions?.[0]?.timestamp
            ? Math.floor(
                (Date.now() -
                  new Date(deal.interactions[0].timestamp).getTime()) /
                  (1000 * 60 * 60 * 24)
              ) + " days ago"
            : "No interactions"
        }
- Contact Engagement: ${deal.contact?.leadStatus || "unknown"}
- Products: ${deal.products?.length || 0} items

Based on this information, estimate the probability (0-100%) that this deal will close successfully.
Return only a number between 0 and 100.
`;

        const result = await aiService.complete({
          prompt: context,
          systemMessage:
            "You are a sales analytics expert. Return only a number between 0 and 100 representing the probability percentage.",
          temperature: 0.3,
        });

        const probability = Math.max(
          0,
          Math.min(100, parseFloat(result.content.match(/\d+/)?.[0] || "50"))
        );

        const suggestionsContext = `
Deal at ${probability}% probability.
Stage: ${deal.stage}
Last contact: ${
          deal.interactions?.[0]?.timestamp
            ? Math.floor(
                (Date.now() -
                  new Date(deal.interactions[0].timestamp).getTime()) /
                  (1000 * 60 * 60 * 24)
              ) + " days ago"
            : "Never"
        }
Suggest 3 specific actions to increase probability. (Portuguese)
`;

        const suggestions = await aiService.generateSuggestions(
          suggestionsContext,
          "actions to increase deal probability (in Portuguese)"
        );

        const actionsList = suggestions
          .split(/\n/)
          .filter((s) => s.trim().length > 0)
          .slice(0, 3);

        res.json({
          success: true,
          data: {
            probability,
            confidence: result.provider === "openai" ? "high" : "medium",
            riskLevel:
              probability < 30 ? "high" : probability < 60 ? "medium" : "low",
            suggestedActions: actionsList,
            analysis: {
              dealAge: Math.floor(
                (Date.now() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
              ),
              interactionCount: deal.interactions?.length || 0,
              daysSinceLastContact: deal.interactions?.[0]?.timestamp
                ? Math.floor(
                    (Date.now() -
                      new Date(deal.interactions[0].timestamp).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : null,
            },
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Contact enrichment
  app.get(
    `${base}/contacts/:id/enrich`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const contact = await prisma.contact.findFirst({
          where: { id: req.params.id, companyId: req.companyId! },
          include: {
            deals: true,
            interactions: { take: 5, orderBy: { timestamp: "desc" } },
          },
        });

        if (!contact) {
          return res
            .status(404)
            .json({ success: false, error: { message: "Contact not found" } });
        }

        const { getAIService } = await import("../../core/ai/ai.service");
        const aiService = getAIService(prisma);

        const missingFields: string[] = [];
        if (!contact.email) missingFields.push("email");
        if (!contact.phone) missingFields.push("phone");
        if (!contact.companyName) missingFields.push("companyName");
        if (!contact.position) missingFields.push("position");
        if (!contact.website) missingFields.push("website");

        if (missingFields.length === 0) {
          return res.json({
            success: true,
            data: {
              complete: true,
              message: "Contato já possui todas as informações principais",
              suggestions: [],
            },
          });
        }

        const context = `
Contact Information:
- Name: ${contact.name}
- Email: ${contact.email || "missing"}
- Phone: ${contact.phone || "missing"}
- Company: ${contact.companyName || "missing"}
- Position: ${contact.position || "missing"}
- Website: ${contact.website || "missing"}
- Tags: ${contact.tags?.join(", ") || "none"}
- Lead Status: ${contact.leadStatus}

Missing fields: ${missingFields.join(", ")}

Suggest where and how to find this missing info (Portuguese).
`;

        const suggestions = await aiService.generateSuggestions(
          context,
          "ways to enrich contact data (in Portuguese)"
        );

        const enrichmentSuggestions = suggestions
          .split(/\n/)
          .filter((s) => s.trim().length > 0)
          .slice(0, 5);

        res.json({
          success: true,
          data: {
            complete: false,
            completionPercentage: Math.round(
              ((6 - missingFields.length) / 6) * 100
            ),
            missingFields,
            suggestions: enrichmentSuggestions,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Contact engagement score
  app.get(
    `${base}/contacts/:id/engagement`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const contact = await prisma.contact.findFirst({
          where: { id: req.params.id, companyId: req.companyId! },
          include: {
            deals: true,
            interactions: { orderBy: { timestamp: "desc" }, take: 20 },
          },
        });

        if (!contact) {
          return res
            .status(404)
            .json({ success: false, error: { message: "Contact not found" } });
        }

        const { getAIService } = await import("../../core/ai/ai.service");
        const aiService = getAIService(prisma);

        const now = Date.now();
        const recentInteractions =
          contact.interactions?.filter(
            (i) =>
              now - new Date(i.timestamp).getTime() < 30 * 24 * 60 * 60 * 1000
          ).length || 0;

        const lastInteraction = contact.interactions?.[0]?.timestamp
          ? Math.floor(
              (now - new Date(contact.interactions[0].timestamp).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null;

        const openDeals =
          contact.deals?.filter((d) => !["won", "lost"].includes(d.stage))
            .length || 0;
        const totalDeals = contact.deals?.length || 0;

        const context = `
Contact Engagement Analysis:
- Total Interactions: ${contact.interactions?.length || 0}
- Recent Interactions (30 days): ${recentInteractions}
- Days Since Last Contact: ${lastInteraction || "Never contacted"}
- Open Deals: ${openDeals}
- Total Deals: ${totalDeals}
- Lead Status: ${contact.leadStatus}
- Tags: ${contact.tags?.join(", ") || "none"}

Return only a number between 0 and 100.
`;

        const result = await aiService.complete({
          prompt: context,
          systemMessage:
            "You are an engagement analysis expert. Return only a number between 0 and 100.",
          temperature: 0.3,
        });

        const engagementScore = Math.max(
          0,
          Math.min(100, parseFloat(result.content.match(/\d+/)?.[0] || "50"))
        );

        const nextActionsContext = `
Contact with ${engagementScore}% engagement.
Last contact: ${lastInteraction ? lastInteraction + " days ago" : "Never"}
Open deals: ${openDeals}

Suggest the best next action (Portuguese).
`;

        const nextAction = await aiService.summarize(nextActionsContext, 150);

        res.json({
          success: true,
          data: {
            engagementScore,
            level:
              engagementScore >= 70
                ? "high"
                : engagementScore >= 40
                ? "medium"
                : "low",
            metrics: {
              totalInteractions: contact.interactions?.length || 0,
              recentInteractions,
              daysSinceLastContact: lastInteraction,
              openDeals,
              totalDeals,
            },
            nextAction,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Contact churn prediction
  app.get(
    `${base}/contacts/:id/churn`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const contact = await prisma.contact.findFirst({
          where: { id: req.params.id, companyId: req.companyId! },
          include: {
            deals: true,
            interactions: { orderBy: { timestamp: "desc" }, take: 20 },
          },
        });

        if (!contact) {
          return res
            .status(404)
            .json({ success: false, error: { message: "Contact not found" } });
        }

        const { getAIService } = await import("../../core/ai/ai.service");
        const aiService = getAIService(prisma);

        const now = Date.now();
        const dealsCount = contact.deals?.length || 0;
        const interactionsCount = contact.interactions?.length || 0;
        const leadScore = contact.leadScore || 0;

        const recentInteractions =
          contact.interactions?.filter(
            (i) =>
              now - new Date(i.timestamp).getTime() < 30 * 24 * 60 * 60 * 1000
          ).length || 0;

        const lastInteraction = contact.interactions?.[0]?.timestamp
          ? Math.floor(
              (now - new Date(contact.interactions[0].timestamp).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null;

        const openDeals =
          contact.deals?.filter((d) => !["won", "lost"].includes(d.stage))
            .length || 0;

        // Calculate risk factors
        const noRecentActivity = recentInteractions < 2;
        const dealsStagnant = dealsCount > 0 && leadScore < 30;
        const emailEngagementDrop = interactionsCount === 0;
        const longTimeSinceContact = lastInteraction !== null && lastInteraction > 60;

        const riskFactorsCount = [
          noRecentActivity,
          dealsStagnant,
          emailEngagementDrop,
          longTimeSinceContact,
        ].filter(Boolean).length;

        const churnProbability = Math.min(
          100,
          riskFactorsCount * 25 + (100 - leadScore)
        );

        let churnRisk: "low" | "medium" | "high" | "critical";
        if (churnProbability >= 75) churnRisk = "critical";
        else if (churnProbability >= 50) churnRisk = "high";
        else if (churnProbability >= 25) churnRisk = "medium";
        else churnRisk = "low";

        const context = `
Contact Churn Risk Analysis:
- Total Interactions: ${interactionsCount}
- Recent Interactions (30 days): ${recentInteractions}
- Days Since Last Contact: ${lastInteraction || "Never"}
- Open Deals: ${openDeals}
- Total Deals: ${dealsCount}
- Lead Score: ${leadScore}
- Churn Risk: ${churnRisk} (${churnProbability}%)

Generate 3-5 specific prevention actions in Portuguese.
`;

        const preventionActions = await aiService.generateSuggestions(
          context,
          "churn prevention actions (in Portuguese)"
        );

        const actionsList = preventionActions
          .split(/\n/)
          .filter((s) => s.trim().length > 0)
          .slice(0, 5);

        res.json({
          success: true,
          data: {
            contactId: req.params.id,
            companyId: contact.companyId,
            churnRisk,
            churnProbability,
            predictedChurnDate:
              churnProbability > 50
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                : undefined,
            factors: {
              noRecentActivity,
              dealsStagnant,
              emailEngagementDrop,
              competitorMentions: false,
              contractExpiringSoon: false,
            },
            preventionActions: actionsList,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // AI Recommendations
  app.get(
    `${base}/:entityType/:id/recommendations`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const { entityType, id } = req.params;

        if (!["contacts", "deals"].includes(entityType)) {
          return res.status(400).json({
            success: false,
            error: { message: "Invalid entity type. Use 'contacts' or 'deals'" },
          });
        }

        const { getAIService } = await import("../../core/ai/ai.service");
        const aiService = getAIService(prisma);

        let entity: any;
        let recommendations: any[] = [];

        if (entityType === "contacts") {
          entity = await prisma.contact.findFirst({
            where: { id, companyId: req.companyId! },
            include: {
              deals: true,
              interactions: { orderBy: { timestamp: "desc" }, take: 10 },
            },
          });

          if (!entity) {
            return res.status(404).json({
              success: false,
              error: { message: "Contact not found" },
            });
          }

          const dealsCount = entity.deals?.length || 0;
          const interactionsCount = entity.interactions?.length || 0;

          if (interactionsCount === 0) {
            recommendations.push({
              id: `rec-${Date.now()}-1`,
              type: "next_action",
              priority: "high",
              title: "Iniciar primeiro contato",
              description: "Este contato ainda não tem interações registradas",
              reasoning: "Contatos sem interações tendem a esfriar rapidamente",
              suggestedActions: [
                "Enviar email de apresentação personalizado",
                "Conectar no LinkedIn",
                "Agendar discovery call",
              ],
              relatedEntityType: "contact",
              relatedEntityId: id,
              createdAt: new Date().toISOString(),
              status: "pending",
            });
          }

          if (dealsCount === 0 && interactionsCount > 2) {
            recommendations.push({
              id: `rec-${Date.now()}-2`,
              type: "deal_strategy",
              priority: "medium",
              title: "Criar deal para este contato",
              description: "Contato engajado sem deal associado",
              reasoning:
                "Múltiplas interações indicam interesse, mas falta deal formal",
              suggestedActions: [
                "Qualificar necessidades em próxima reunião",
                "Criar deal exploratory",
                "Enviar proposta inicial",
              ],
              relatedEntityType: "contact",
              relatedEntityId: id,
              createdAt: new Date().toISOString(),
              status: "pending",
            });
          }
        } else if (entityType === "deals") {
          entity = await prisma.deal.findFirst({
            where: { id, companyId: req.companyId! },
            include: {
              contact: true,
              interactions: { orderBy: { timestamp: "desc" }, take: 10 },
            },
          });

          if (!entity) {
            return res.status(404).json({
              success: false,
              error: { message: "Deal not found" },
            });
          }

          if (entity.probability && entity.probability < 30) {
            recommendations.push({
              id: `rec-${Date.now()}-3`,
              type: "risk_mitigation",
              priority: "critical",
              title: "Deal com baixa probabilidade",
              description: `Probabilidade atual: ${entity.probability}%`,
              reasoning:
                "Deals abaixo de 30% raramente convertem sem ação imediata",
              suggestedActions: [
                "Identificar objeções principais",
                "Agendar reunião com decisor",
                "Revisar proposta de valor",
                "Considerar ajuste de preço/escopo",
              ],
              relatedEntityType: "deal",
              relatedEntityId: id,
              createdAt: new Date().toISOString(),
              status: "pending",
            });
          }

          if (entity.createdAt) {
            const daysSinceCreation = Math.floor(
              (Date.now() - new Date(entity.createdAt).getTime()) /
                (1000 * 60 * 60 * 24)
            );

            if (
              daysSinceCreation > 60 &&
              entity.stage !== "won" &&
              entity.stage !== "lost"
            ) {
              recommendations.push({
                id: `rec-${Date.now()}-4`,
                type: "deal_strategy",
                priority: "high",
                title: "Deal parado há muito tempo",
                description: `${daysSinceCreation} dias sem progresso significativo`,
                reasoning:
                  "Deals que permanecem no mesmo estágio por mais de 60 dias raramente fecham",
                suggestedActions: [
                  "Reagendar reunião de revisão",
                  "Requalificar necessidade e urgência",
                  "Considerar re-engajamento do champion",
                  "Avaliar se vale manter ativo",
                ],
                relatedEntityType: "deal",
                relatedEntityId: id,
                createdAt: new Date().toISOString(),
                status: "pending",
              });
            }
          }
        }

        res.json({ success: true, data: recommendations });
      } catch (error) {
        next(error);
      }
    }
  );

  // =========================================================
  // ANALYTICS/REPORTS
  // =========================================================
  app.get(
    `${base}/analytics/pipeline`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req, res, next) => {
      try {
        const pipeline = await prisma.deal.groupBy({
          by: ["stage"],
          where: { companyId: req.companyId! },
          _count: true,
          _sum: { value: true },
        });

        res.json({ success: true, data: pipeline });
      } catch (error) {
        next(error);
      }
    }
  );
}

export const crmModule: ModuleDefinition = {
  name: "crm",
  version: "1.0.0",
  provides: ["crm"],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};
