// src/modules/mcp/index.ts - MCP Servers API
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../core/middleware/auth';
import { tenantIsolation } from '../../core/middleware/tenant';
import { companyAdminOnly } from '../rbac/middleware';

const prisma = new PrismaClient();

export default function registerMCPRoutes(app: Express) {
  const base = '/api/v1/mcp';

  // ===== MCP Servers =====
  
  app.get(`${base}/servers`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const servers = await prisma.mCPServer.findMany({
        where: {
          OR: [
            { companyId: req.companyId! },
            { isPublic: true },
          ],
          isActive: true,
        },
        include: {
          _count: {
            select: {
              tools: true,
              resources: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, data: servers });
    } catch (error) {
      next(error);
    }
  });

  app.get(`${base}/servers/:id`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const server = await prisma.mCPServer.findFirst({
        where: {
          id: req.params.id,
          OR: [
            { companyId: req.companyId! },
            { isPublic: true },
          ],
        },
        include: {
          tools: true,
          resources: true,
          logs: {
            orderBy: { timestamp: 'desc' },
            take: 50,
          },
        },
      });
      res.json({ success: true, data: server });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/servers`, authenticate, tenantIsolation, companyAdminOnly, async (req, res, next) => {
    try {
      const { name, description, type, command, args, env, config, isPublic } = req.body;
      
      const server = await prisma.mCPServer.create({
        data: {
          companyId: req.companyId!,
          name,
          description,
          type: type || 'custom',
          command,
          args,
          env,
          config,
          isPublic: isPublic || false,
          createdBy: req.user!.id,
        },
      });
      res.json({ success: true, data: server });
    } catch (error) {
      next(error);
    }
  });

  app.patch(`${base}/servers/:id`, authenticate, tenantIsolation, companyAdminOnly, async (req, res, next) => {
    try {
      const server = await prisma.mCPServer.update({
        where: { id: req.params.id, companyId: req.companyId! },
        data: req.body,
      });
      res.json({ success: true, data: server });
    } catch (error) {
      next(error);
    }
  });

  app.delete(`${base}/servers/:id`, authenticate, tenantIsolation, companyAdminOnly, async (req, res, next) => {
    try {
      await prisma.mCPServer.delete({
        where: { id: req.params.id, companyId: req.companyId! },
      });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // ===== MCP Tools =====
  
  app.get(`${base}/servers/:id/tools`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const tools = await prisma.mCPTool.findMany({
        where: { serverId: req.params.id },
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, data: tools });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/servers/:id/tools`, authenticate, tenantIsolation, companyAdminOnly, async (req, res, next) => {
    try {
      const { name, description, inputSchema } = req.body;
      
      const tool = await prisma.mCPTool.create({
        data: {
          serverId: req.params.id,
          name,
          description,
          inputSchema,
        },
      });
      res.json({ success: true, data: tool });
    } catch (error) {
      next(error);
    }
  });

  // ===== MCP Resources =====
  
  app.get(`${base}/servers/:id/resources`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const resources = await prisma.mCPResource.findMany({
        where: { serverId: req.params.id },
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, data: resources });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/servers/:id/resources`, authenticate, tenantIsolation, companyAdminOnly, async (req, res, next) => {
    try {
      const { uri, name, description, mimeType } = req.body;
      
      const resource = await prisma.mCPResource.create({
        data: {
          serverId: req.params.id,
          uri,
          name,
          description,
          mimeType,
        },
      });
      res.json({ success: true, data: resource });
    } catch (error) {
      next(error);
    }
  });

  // ===== Logs =====
  
  app.get(`${base}/servers/:id/logs`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { level, limit = 100 } = req.query;
      const where: any = { serverId: req.params.id };
      if (level) where.level = level;

      const logs = await prisma.mCPServerLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit as string),
      });
      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/servers/:id/logs`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { level, message, metadata } = req.body;
      
      const log = await prisma.mCPServerLog.create({
        data: {
          serverId: req.params.id,
          level: level || 'info',
          message,
          metadata,
        },
      });
      res.json({ success: true, data: log });
    } catch (error) {
      next(error);
    }
  });
}
