// src/modules/auth/routes/email-verify-confirm.route.ts
import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { BadRequestError } from '../../../core/errors';

export function setupEmailVerifyConfirmRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  // This route should NOT require JWT authentication
  // The token in the URL IS the authentication
  app.post(
    `${baseUrl}/email/verify/:token`,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { token } = req.params;

        // Find valid token
        const verificationToken = await prisma.emailVerificationToken.findUnique({
          where: { token },
          include: { user: true },
        });

        if (!verificationToken || verificationToken.expiresAt < new Date()) {
          throw new BadRequestError('Invalid or expired verification token');
        }

        // Check if already verified
        if (verificationToken.user.emailVerified) {
          return res.json({
            success: true,
            message: 'Email already verified',
          });
        }

        // Verify email
        await prisma.user.update({
          where: { id: verificationToken.userId },
          data: {
            emailVerified: true,
            updatedAt: new Date(),
          },
        });

        // Delete used token
        await prisma.emailVerificationToken.delete({
          where: { token },
        });

        res.json({
          success: true,
          message: 'Email verified successfully',
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
