import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupOmnichannelConversationsUpdateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.patch(`${baseUrl}/conversations/:id`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, assignedToId } = req.body;

      const conversation = await prisma.conversation.update({
        where: {
          id: req.params.id,
          companyId: req.companyId!,
        },
        data: {
          ...(status && { status }),
          ...(assignedToId && { assignedToId }),
        },
        include: {
          contact: true,
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      });

      res.json(conversation);
    } catch (error) {
      next(error);
    }
  });
}
