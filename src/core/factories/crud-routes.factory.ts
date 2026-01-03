/**
 * CRUD Routes Factory
 *
 * Factory genérico para criar rotas CRUD de forma padronizada e modular.
 * Reduz duplicação de código e garante consistência em todas as APIs.
 *
 * Suporta:
 * - Operações CRUD completas (list, get, create, update, delete)
 * - Validação de schemas (Zod)
 * - Controle de permissões (RBAC)
 * - Paginação e ordenação
 * - Soft delete
 * - Audit logging
 * - Respostas padronizadas
 * - Filtros customizados
 * - Includes customizados
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { authenticate, tenantIsolation, requirePermission, validateBody, Permission } from '../middleware';
import { successResponse, createdResponse, notFoundResponse } from '../utils/api-response';
import { notDeleted } from '../utils/soft-delete';
import {
  parsePaginationParams,
  parseSortingParams,
  createPaginatedResponse,
  getPrismaPagination,
  createPrismaOrderBy,
} from '../utils/pagination';
import { auditLogger } from '../audit/audit-logger';

/**
 * Configuração de uma operação CRUD
 */
export interface CrudOperationConfig {
  /** Se true, habilita a operação */
  enabled?: boolean;
  /** Middleware adicional para esta operação */
  middleware?: any[];
  /** Permissão necessária (se não especificada, usa a permissão padrão do módulo) */
  permission?: Permission;
  /** Schema de validação Zod (apenas para create/update) */
  schema?: z.ZodSchema<any>;
  /** Includes customizados do Prisma */
  include?: any;
  /** Select customizado do Prisma */
  select?: any;
  /** Transformação dos dados antes de enviar resposta */
  transform?: (data: any) => any;
  /** Hook executado antes da operação */
  beforeOperation?: (req: Request, data?: any) => Promise<void> | void;
  /** Hook executado depois da operação */
  afterOperation?: (req: Request, result: any) => Promise<void> | void;
}

/**
 * Configuração completa do factory CRUD
 */
export interface CrudFactoryConfig {
  /** Nome da entidade no Prisma (ex: 'contact', 'deal', 'apiKey') */
  entityName: string;
  /** Base URL para as rotas (ex: '/api/v1/crm/contacts') */
  baseUrl: string;
  /** Nome singular da entidade para mensagens (ex: 'contact') */
  singularName?: string;
  /** Nome plural da entidade para mensagens (ex: 'contacts') */
  pluralName?: string;

  /** Middleware aplicado a todas as rotas */
  globalMiddleware?: any[];

  /** Se true, aplica tenant isolation (companyId) em todas operações */
  tenantIsolation?: boolean;

  /** Se true, suporta soft delete */
  softDelete?: boolean;

  /** Se true, gera logs de auditoria */
  auditLog?: boolean;

  /** Campos permitidos para ordenação */
  allowedSortFields?: string[];

  /** Permissão padrão para leitura */
  readPermission?: Permission;
  /** Permissão padrão para criação */
  createPermission?: Permission;
  /** Permissão padrão para atualização */
  updatePermission?: Permission;
  /** Permissão padrão para exclusão */
  deletePermission?: Permission;

  /** Configuração da operação LIST */
  list?: CrudOperationConfig;
  /** Configuração da operação GET */
  get?: CrudOperationConfig;
  /** Configuração da operação CREATE */
  create?: CrudOperationConfig;
  /** Configuração da operação UPDATE */
  update?: CrudOperationConfig;
  /** Configuração da operação DELETE */
  delete?: CrudOperationConfig;

  /** Filtros customizados para LIST (recebe req.query e retorna where clause) */
  customFilters?: (query: any, companyId?: string) => any;
}

/**
 * Factory de rotas CRUD
 */
export class CrudRoutesFactory {
  constructor(
    private app: Express,
    private prisma: PrismaClient,
    private config: CrudFactoryConfig
  ) {}

  /**
   * Cria todas as rotas CRUD configuradas
   */
  createRoutes(): void {
    const {
      list = { enabled: true },
      get = { enabled: true },
      create = { enabled: true },
      update = { enabled: true },
      delete: del = { enabled: true },
    } = this.config;

    if (list.enabled !== false) this.createListRoute(list);
    if (get.enabled !== false) this.createGetRoute(get);
    if (create.enabled !== false) this.createCreateRoute(create);
    if (update.enabled !== false) this.createUpdateRoute(update);
    if (del.enabled !== false) this.createDeleteRoute(del);
  }

  /**
   * Constrói middleware stack para uma operação
   */
  private buildMiddleware(operationConfig: CrudOperationConfig, permission?: Permission): any[] {
    const middleware: any[] = [];

    // Global middleware
    if (this.config.globalMiddleware) {
      middleware.push(...this.config.globalMiddleware);
    }

    // Tenant isolation
    if (this.config.tenantIsolation !== false) {
      middleware.push(authenticate, tenantIsolation);
    }

    // Permission check
    if (permission) {
      middleware.push(requirePermission(permission));
    }

    // Validation schema (apenas para create/update)
    if (operationConfig.schema) {
      middleware.push(validateBody(operationConfig.schema));
    }

    // Operation-specific middleware
    if (operationConfig.middleware) {
      middleware.push(...operationConfig.middleware);
    }

    return middleware;
  }

  /**
   * Obtém o model do Prisma
   */
  private getModel(): any {
    return (this.prisma as any)[this.config.entityName];
  }

  /**
   * Constrói where clause com tenant isolation
   */
  private buildBaseWhere(req: Request): any {
    const where: any = {};

    if (this.config.tenantIsolation !== false && req.companyId) {
      where.companyId = req.companyId;
    }

    return where;
  }

  /**
   * Registra ação de auditoria
   */
  private async logAudit(action: string, req: Request, resourceId: string, details?: any): Promise<void> {
    if (!this.config.auditLog) return;

    await auditLogger.log({
      action: `${this.config.entityName}.${action}`,
      userId: (req as any).userId || (req as any).user?.id,
      companyId: req.companyId!,
      resourceType: this.config.entityName,
      resourceId,
      details,
    });
  }

  /**
   * CREATE: GET /baseUrl - Lista todos os registros
   */
  private createListRoute(config: CrudOperationConfig): void {
    const middleware = this.buildMiddleware(config, this.config.readPermission);

    this.app.get(
      this.config.baseUrl,
      ...middleware,
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          // Before hook
          if (config.beforeOperation) {
            await config.beforeOperation(req);
          }

          // Parse pagination e sorting
          const paginationParams = parsePaginationParams(req.query);
          const sortingParams = parseSortingParams(
            req.query,
            this.config.allowedSortFields || ['createdAt']
          );

          // Build where clause
          let where = this.buildBaseWhere(req);

          // Soft delete
          if (this.config.softDelete && req.query.includeDeleted !== 'true') {
            where = { ...where, ...notDeleted };
          }

          // Custom filters
          if (this.config.customFilters) {
            const customWhere = this.config.customFilters(req.query, req.companyId);
            where = { ...where, ...customWhere };
          }

          // Execute queries em paralelo
          const model = this.getModel();
          const [items, total] = await Promise.all([
            model.findMany({
              where,
              ...getPrismaPagination(paginationParams),
              ...(config.include && { include: config.include }),
              ...(config.select && { select: config.select }),
              orderBy: createPrismaOrderBy(sortingParams, 'createdAt'),
            }),
            model.count({ where }),
          ]);

          // Transform data
          let data = items;
          if (config.transform) {
            data = items.map(config.transform);
          }

          // After hook
          if (config.afterOperation) {
            await config.afterOperation(req, data);
          }

          // Create paginated response
          const response = createPaginatedResponse(data, total, paginationParams);

          return successResponse(res, response.data, {
            meta: response.meta,
            requestId: req.id,
          });
        } catch (error) {
          next(error);
        }
      }
    );
  }

  /**
   * CREATE: GET /baseUrl/:id - Busca um registro por ID
   */
  private createGetRoute(config: CrudOperationConfig): void {
    const middleware = this.buildMiddleware(config, this.config.readPermission);

    this.app.get(
      `${this.config.baseUrl}/:id`,
      ...middleware,
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          // Before hook
          if (config.beforeOperation) {
            await config.beforeOperation(req);
          }

          const where: any = {
            id: req.params.id,
            ...this.buildBaseWhere(req),
          };

          // Soft delete
          if (this.config.softDelete) {
            where.deletedAt = null;
          }

          const model = this.getModel();
          let item = await model.findFirst({
            where,
            ...(config.include && { include: config.include }),
            ...(config.select && { select: config.select }),
          });

          if (!item) {
            const name = this.config.singularName || this.config.entityName;
            return notFoundResponse(res, `${name} not found`);
          }

          // Transform data
          if (config.transform) {
            item = config.transform(item);
          }

          // After hook
          if (config.afterOperation) {
            await config.afterOperation(req, item);
          }

          return successResponse(res, item, { requestId: req.id });
        } catch (error) {
          next(error);
        }
      }
    );
  }

  /**
   * CREATE: POST /baseUrl - Cria novo registro
   */
  private createCreateRoute(config: CrudOperationConfig): void {
    const middleware = this.buildMiddleware(config, this.config.createPermission);

    this.app.post(
      this.config.baseUrl,
      ...middleware,
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          // Before hook
          if (config.beforeOperation) {
            await config.beforeOperation(req, req.body);
          }

          const data: any = { ...req.body };

          // Add tenant isolation
          if (this.config.tenantIsolation !== false && req.companyId) {
            data.companyId = req.companyId;
          }

          const model = this.getModel();
          let item = await model.create({
            data,
            ...(config.include && { include: config.include }),
            ...(config.select && { select: config.select }),
          });

          // Audit log
          await this.logAudit('create', req, item.id, { data: req.body });

          // Transform data
          if (config.transform) {
            item = config.transform(item);
          }

          // After hook
          if (config.afterOperation) {
            await config.afterOperation(req, item);
          }

          return createdResponse(res, item, { requestId: req.id });
        } catch (error) {
          next(error);
        }
      }
    );
  }

  /**
   * CREATE: PUT/PATCH /baseUrl/:id - Atualiza registro
   */
  private createUpdateRoute(config: CrudOperationConfig): void {
    const middleware = this.buildMiddleware(config, this.config.updatePermission);

    this.app.patch(
      `${this.config.baseUrl}/:id`,
      ...middleware,
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          // Before hook
          if (config.beforeOperation) {
            await config.beforeOperation(req, req.body);
          }

          const where: any = {
            id: req.params.id,
            ...this.buildBaseWhere(req),
          };

          // Soft delete
          if (this.config.softDelete) {
            where.deletedAt = null;
          }

          const model = this.getModel();

          // Check if exists
          const exists = await model.findFirst({ where, select: { id: true } });
          if (!exists) {
            const name = this.config.singularName || this.config.entityName;
            return notFoundResponse(res, `${name} not found`);
          }

          // Update
          let item = await model.update({
            where: { id: req.params.id },
            data: req.body,
            ...(config.include && { include: config.include }),
            ...(config.select && { select: config.select }),
          });

          // Audit log
          await this.logAudit('update', req, item.id, { data: req.body });

          // Transform data
          if (config.transform) {
            item = config.transform(item);
          }

          // After hook
          if (config.afterOperation) {
            await config.afterOperation(req, item);
          }

          return successResponse(res, item, { requestId: req.id });
        } catch (error) {
          next(error);
        }
      }
    );
  }

  /**
   * CREATE: DELETE /baseUrl/:id - Deleta registro
   */
  private createDeleteRoute(config: CrudOperationConfig): void {
    const middleware = this.buildMiddleware(config, this.config.deletePermission);

    this.app.delete(
      `${this.config.baseUrl}/:id`,
      ...middleware,
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          // Before hook
          if (config.beforeOperation) {
            await config.beforeOperation(req);
          }

          const where: any = {
            id: req.params.id,
            ...this.buildBaseWhere(req),
          };

          const model = this.getModel();

          if (this.config.softDelete) {
            // Soft delete
            where.deletedAt = null;

            const exists = await model.findFirst({ where, select: { id: true } });
            if (!exists) {
              const name = this.config.singularName || this.config.entityName;
              return notFoundResponse(res, `${name} not found`);
            }

            await model.update({
              where: { id: req.params.id },
              data: { deletedAt: new Date() },
            });
          } else {
            // Hard delete
            const result = await model.deleteMany({ where });

            if (result.count === 0) {
              const name = this.config.singularName || this.config.entityName;
              return notFoundResponse(res, `${name} not found`);
            }
          }

          // Audit log
          await this.logAudit('delete', req, req.params.id);

          // After hook
          if (config.afterOperation) {
            await config.afterOperation(req, null);
          }

          return res.status(204).send();
        } catch (error) {
          next(error);
        }
      }
    );
  }
}

/**
 * Helper function para criar rotas CRUD rapidamente
 */
export function createCrudRoutes(
  app: Express,
  prisma: PrismaClient,
  config: CrudFactoryConfig
): void {
  const factory = new CrudRoutesFactory(app, prisma, config);
  factory.createRoutes();
}
