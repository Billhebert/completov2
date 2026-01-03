import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { providers } from '../providers';
import crypto from 'crypto';

export function setupSSOAuthorizeRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/:provider/authorize`, async (req: Request, res: Response, next: NextFunction) => {
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
}
