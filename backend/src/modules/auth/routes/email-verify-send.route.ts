// src/modules/auth/routes/email-verify-send.route.ts
import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import crypto from 'crypto';
import { env } from '../../../core/config/env';
import { BadRequestError } from '../../../core/errors';

export function setupEmailVerifySendRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.post(
    `${baseUrl}/email/verify/send`,
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new BadRequestError('User not found');
        }

        // Check if already verified
        const user = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { emailVerified: true, email: true, name: true },
        });

        if (!user) {
          throw new BadRequestError('User not found');
        }

        if (user.emailVerified) {
          return res.json({
            success: true,
            message: 'Email already verified',
          });
        }

        // Generate verification token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Delete old tokens for this user
        await prisma.emailVerificationToken.deleteMany({
          where: { userId: req.user.id },
        });

        // Create new token
        await prisma.emailVerificationToken.create({
          data: {
            userId: req.user.id,
            token,
            expiresAt,
          },
        });

        // TODO: Send verification email
        // await sendVerificationEmail(user.email, token);

        // Log for dev (remove in production)
        if (env.NODE_ENV === 'development') {
          console.log(`[DEV] Email verification token for ${user.email}: ${token}`);
        }

        res.json({
          success: true,
          message: 'Verification email sent',
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
