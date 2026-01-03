import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { providers } from '../providers';
import { JWTPayload } from '../../../core/types';
import { generateToken, generateRefreshToken } from '../../../core/middleware/auth';
import { logger } from '../../../core/logger';

export function setupSSOCallbackRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/:provider/callback`, async (req: Request, res: Response, next: NextFunction) => {
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
      const { accessToken: oauthAccessToken } = await oauthProvider.exchangeCode(code as string);

      // Get user info
      const userInfo = await oauthProvider.getUserInfo(oauthAccessToken);

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
          accessToken: oauthAccessToken,
        },
        update: {
          accessToken: oauthAccessToken,
          lastUsedAt: new Date(),
        },
      });

      // Generate JWT tokens
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      };
      const accessToken = generateToken(payload);
      const refreshToken = generateRefreshToken(payload);

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
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  });
}
