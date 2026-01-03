import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

export function setupSSOAccountsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/accounts`, async (req: Request, res: Response, next: NextFunction) => {
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
}
