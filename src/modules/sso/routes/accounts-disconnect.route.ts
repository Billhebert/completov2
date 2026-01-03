import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

export function setupSSOAccountsDisconnectRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.delete(`${baseUrl}/accounts/:provider`, async (req: Request, res: Response, next: NextFunction) => {
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
