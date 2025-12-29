// src/modules/sso/index.ts
import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { providers } from './providers';
import { AuthService } from '../auth/service';
import crypto from 'crypto';
import { logger } from '../../core/logger';

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/sso';
  const authService = new AuthService(prisma);

  // Initiate OAuth flow
  app.get(`${base}/:provider/authorize`, async (req, res, next) => {
    try {
      const { provider } = req.params;
      const oauthProvider = providers[provider];

      if (!oauthProvider) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid OAuth provider' },
        });
      }

      // Generate state for CSRF protection
      const state = crypto.randomBytes(32).toString('hex');

      // Store state in session/cache (simplified here)
      await prisma.oAuthState.create({
        data: {
          state,
          provider,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
      });

      const authUrl = oauthProvider.getAuthUrl(state);

      res.json({ success: true, data: { url: authUrl } });
    } catch (error) {
      next(error);
    }
  });

  // OAuth callback
  app.get(`${base}/:provider/callback`, async (req, res, next) => {
    try {
      const { provider } = req.params;
      const { code, state } = req.query;

      if (!code || !state) {
        return res.status(400).json({
          success: false,
          error: { message: 'Missing code or state' },
        });
      }

      const oauthProvider = providers[provider];
      if (!oauthProvider) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid OAuth provider' },
        });
      }

      // Verify state
      const stateRecord = await prisma.oAuthState.findUnique({
        where: { state: state as string },
      });

      if (!stateRecord || stateRecord.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid or expired state' },
        });
      }

      // Delete used state
      await prisma.oAuthState.delete({ where: { state: state as string } });

      // Exchange code for token
      const { accessToken } = await oauthProvider.exchangeCode(code as string);

      // Get user info
      const userInfo = await oauthProvider.getUserInfo(accessToken);

      logger.info({ provider, email: userInfo.email }, 'OAuth user info retrieved');

      // Find or create user
      let user = await prisma.user.findFirst({
        where: {
          email: userInfo.email,
        },
        include: { company: true },
      });

      if (!user) {
        // Create new user and company
        const company = await prisma.company.create({
          data: {
            name: `${userInfo.name}'s Company`,
            domain: userInfo.email.split('@')[1],
          },
        });

        user = await prisma.user.create({
          data: {
            companyId: company.id,
            email: userInfo.email,
            name: userInfo.name,
            passwordHash: '', // No password for OAuth users
            role: 'admin',
            avatar: userInfo.avatar,
            twoFactorSecret: null,
          },
          include: { company: true },
        });

        logger.info({ userId: user.id, provider }, 'New user created via OAuth');
      }

      // Link OAuth account
      await prisma.oAuthAccount.upsert({
        where: {
          provider_providerUserId: {
            provider,
            providerUserId: userInfo.id,
          },
        },
        create: {
          userId: user.id,
          provider,
          providerUserId: userInfo.id,
          accessToken,
        },
        update: {
          accessToken,
          lastUsedAt: new Date(),
        },
      });

      // Generate JWT tokens
      const tokens = authService.generateTokens(user);

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyId: user.companyId,
          },
          ...tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // List connected accounts
  app.get(`${base}/accounts`, async (req, res, next) => {
    try {
      // This would require authentication middleware
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized' },
        });
      }

      const accounts = await prisma.oAuthAccount.findMany({
        where: { userId },
        select: {
          provider: true,
          providerUserId: true,
          lastUsedAt: true,
          createdAt: true,
        },
      });

      res.json({ success: true, data: accounts });
    } catch (error) {
      next(error);
    }
  });

  // Disconnect OAuth account
  app.delete(`${base}/accounts/:provider`, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const { provider } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized' },
        });
      }

      await prisma.oAuthAccount.deleteMany({
        where: {
          userId,
          provider,
        },
      });

      res.json({ success: true, message: 'OAuth account disconnected' });
    } catch (error) {
      next(error);
    }
  });
}

export const ssoModule: ModuleDefinition = {
  name: 'sso',
  version: '1.0.0',
  provides: ['oauth', 'sso'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma),
};
