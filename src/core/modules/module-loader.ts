// src/core/modules/module-loader.ts
import { Express } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../event-bus';
import { Logger, logger } from '../logger';
import { Env } from '../config/env';
import { ModuleDefinition, ModuleContext } from '../types';

export class ModuleLoader {
  private modules: Map<string, ModuleDefinition> = new Map();
  private enabledModules: Set<string> = new Set();
  private context: ModuleContext;

  constructor(
    private app: Express,
    private prisma: PrismaClient,
    private eventBus: EventBus,
    private config: Env,
    private io?: SocketIOServer
  ) {
    this.context = {
      app,
      io,
      prisma,
      eventBus,
      logger,
      config,
    };
  }

  /**
   * Register a module
   */
  register(module: ModuleDefinition): void {
    if (this.modules.has(module.name)) {
      logger.warn({ module: module.name }, 'Module already registered');
      return;
    }

    this.modules.set(module.name, module);
    logger.info({ module: module.name, version: module.version }, 'Module registered');
  }

  /**
   * Enable a module
   */
  async enable(moduleName: string): Promise<void> {
    const module = this.modules.get(moduleName);
    
    if (!module) {
      throw new Error(`Module ${moduleName} not found`);
    }

    if (this.enabledModules.has(moduleName)) {
      logger.warn({ module: moduleName }, 'Module already enabled');
      return;
    }

    // Check dependencies
    if (module.dependsOn) {
      for (const dependency of module.dependsOn) {
        if (!this.enabledModules.has(dependency)) {
          logger.warn(
            { module: moduleName, dependency },
            'Dependency not enabled, skipping module'
          );
          return;
        }
      }
    }

    try {
      // Call onEnable hook
      if (module.onEnable) {
        await module.onEnable(this.context);
      }

      // Register routes
      if (module.routes) {
        await module.routes(this.context);
        logger.debug({ module: moduleName }, 'Routes registered');
      }

      // Register sockets
      if (module.sockets && this.io) {
        await module.sockets(this.context);
        logger.debug({ module: moduleName }, 'Sockets registered');
      }

      // Register workers
      if (module.workers) {
        await module.workers(this.context);
        logger.debug({ module: moduleName }, 'Workers registered');
      }

      // Register cron jobs
      if (module.cron) {
        await module.cron(this.context);
        logger.debug({ module: moduleName }, 'Cron jobs registered');
      }

      // Register permissions
      if (module.permissions) {
        await module.permissions(this.context);
        logger.debug({ module: moduleName }, 'Permissions registered');
      }

      this.enabledModules.add(moduleName);
      logger.info({ module: moduleName }, 'Module enabled successfully');
    } catch (error) {
      logger.error({ error, module: moduleName }, 'Failed to enable module');
      throw error;
    }
  }

  /**
   * Disable a module
   */
  async disable(moduleName: string): Promise<void> {
    const module = this.modules.get(moduleName);
    
    if (!module) {
      throw new Error(`Module ${moduleName} not found`);
    }

    if (!this.enabledModules.has(moduleName)) {
      return;
    }

    try {
      // Call onDisable hook
      if (module.onDisable) {
        await module.onDisable(this.context);
      }

      this.enabledModules.delete(moduleName);
      logger.info({ module: moduleName }, 'Module disabled successfully');
    } catch (error) {
      logger.error({ error, module: moduleName }, 'Failed to disable module');
      throw error;
    }
  }

  /**
   * Enable modules from configuration
   */
  async enableModules(moduleNames: string[]): Promise<void> {
    for (const name of moduleNames) {
      try {
        await this.enable(name);
      } catch (error) {
        logger.error({ error, module: name }, 'Failed to enable module');
        // Continue with other modules
      }
    }
  }

  /**
   * Get enabled modules
   */
  getEnabledModules(): string[] {
    return Array.from(this.enabledModules);
  }

  /**
   * Check if module is enabled
   */
  isEnabled(moduleName: string): boolean {
    return this.enabledModules.has(moduleName);
  }

  /**
   * Get all registered modules
   */
  getAllModules(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get module info
   */
  getModule(moduleName: string): ModuleDefinition | undefined {
    return this.modules.get(moduleName);
  }
}
