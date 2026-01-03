// src/modules/crm/companies.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import {
  authenticate,
  tenantIsolation,
  requirePermission,
  Permission,
  validateBody,
} from "../../core/middleware";
import { z } from "zod";

const companySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  industry: z.string().optional(),
  size: z
    .enum(["startup", "small", "medium", "large", "enterprise"])
    .optional(),
  status: z.enum(["lead", "prospect", "customer", "partner", "inactive"]),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  assignedTo: z.string().optional(),
});

export function setupCompanyRoutes(router: Router, prisma: PrismaClient) {
  const r = Router();

  // Listar empresas
  r.get(
    "/",
    authenticate,
    tenantIsolation,
    requirePermission(Permission.COMPANY_READ),
    async (req, res, next) => {
      try {
        const page = Number((req.query.page as string) || 1);
        const limit = Number((req.query.limit as string) || 50);
        const search = (req.query.search as string) || undefined;
        const status = (req.query.status as string) || undefined;
        const size = (req.query.size as string) || undefined;

        const where: any = {
          companyId: req.companyId!,
          ...(search
            ? { name: { contains: search, mode: "insensitive" } }
            : {}),
          ...(status ? { status } : {}),
          ...(size ? { size } : {}),
        };

        const take = Math.max(1, Math.min(limit, 200));
        const skip = Math.max(0, (page - 1) * take);

        const [data, total] = await Promise.all([
          prisma.crmCompany.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take,
            skip,
          }),
          prisma.crmCompany.count({ where }),
        ]);

        res.json({
          success: true,
          data,
          pagination: {
            page,
            limit: take,
            total,
            pages: Math.ceil(total / take),
          },
        });
      } catch (err) {
        next(err);
      }
    }
  );

  // Criar empresa
  r.post(
    "/",
    authenticate,
    tenantIsolation,
    requirePermission(Permission.COMPANY_CREATE),
    validateBody(companySchema),
    async (req, res, next) => {
      try {
        const payload = req.body as z.infer<typeof companySchema>;

        const created = await prisma.crmCompany.create({
          data: {
            companyId: req.companyId!,
            name: payload.name,
            website: payload.website || null,
            industry: payload.industry || null,
            size: payload.size || null,
            status: payload.status,
            email: payload.email || null,
            phone: payload.phone || null,
            notes: payload.notes || null,
            tags: payload.tags ?? [],
            assignedTo: payload.assignedTo || null,
            address: {
              street: payload.street || "",
              city: payload.city || "",
              state: payload.state || "",
              zipCode: payload.zipCode || "",
              country: payload.country || "",
            },
          },
        });
        return res.status(201).json({
          success: true,
          data: created,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  // Atualizar empresa
  r.put(
    "/:id",
    authenticate,
    tenantIsolation,
    requirePermission(Permission.COMPANY_UPDATE),
    async (req, res, next) => {
      try {
        const { id } = req.params;

        // valida só o que vier (partial)
        const partialSchema = companySchema.partial();
        const parsed = await partialSchema.parseAsync(req.body);

        const data: any = {
          ...(parsed.name !== undefined ? { name: parsed.name } : {}),
          ...(parsed.website !== undefined
            ? { website: parsed.website || null }
            : {}),
          ...(parsed.industry !== undefined
            ? { industry: parsed.industry || null }
            : {}),
          ...(parsed.size !== undefined ? { size: parsed.size || null } : {}),
          ...(parsed.status !== undefined ? { status: parsed.status } : {}),
          ...(parsed.email !== undefined
            ? { email: parsed.email || null }
            : {}),
          ...(parsed.phone !== undefined
            ? { phone: parsed.phone || null }
            : {}),
          ...(parsed.notes !== undefined
            ? { notes: parsed.notes || null }
            : {}),
          ...(parsed.tags !== undefined ? { tags: parsed.tags ?? [] } : {}),
          ...(parsed.assignedTo !== undefined
            ? { assignedTo: parsed.assignedTo || null }
            : {}),
        };

        const addressPatch: any = {};
        if (parsed.street !== undefined)
          addressPatch.street = parsed.street || "";
        if (parsed.city !== undefined) addressPatch.city = parsed.city || "";
        if (parsed.state !== undefined) addressPatch.state = parsed.state || "";
        if (parsed.zipCode !== undefined)
          addressPatch.zipCode = parsed.zipCode || "";
        if (parsed.country !== undefined)
          addressPatch.country = parsed.country || "";

        if (Object.keys(addressPatch).length > 0) {
          // Merge manual: busca atual e atualiza
          const current = await prisma.crmCompany.findFirst({
            where: { id, companyId: req.companyId! },
            select: { address: true },
          });
          const currentAddress = (current?.address as any) || {};
          data.address = { ...currentAddress, ...addressPatch };
        }

        const updated = await prisma.crmCompany.updateMany({
          where: { id, companyId: req.companyId! },
          data,
        });

        if (updated.count === 0) {
          return res.status(404).json({ message: "Empresa não encontrada" });
        }

        res.json({ success: true });
      } catch (err) {
        next(err);
      }
    }
  );

  // Deletar empresa
  r.delete(
    "/:id",
    authenticate,
    tenantIsolation,
    requirePermission(Permission.COMPANY_DELETE),
    async (req, res, next) => {
      try {
        const { id } = req.params;

        const deleted = await prisma.crmCompany.deleteMany({
          where: { id, companyId: req.companyId! },
        });

        if (deleted.count === 0) {
          return res.status(404).json({ message: "Empresa não encontrada" });
        }

        res.status(204).send();
      } catch (err) {
        next(err);
      }
    }
  );

  // monta em /crm/companies
  router.use("/companies", r);
}
