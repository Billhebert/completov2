// src/modules/auth/routes/password-reset-request.route.ts
import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validateBody } from '../../../core/middleware';
import { authLimiter } from '../../../core/middleware/rate-limit';
import crypto from 'crypto';
import { env } from '../../../core/config/env';

const requestSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export function setupPasswordResetRequestRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.post(
    `${baseUrl}/password/reset`,
    authLimiter,
    validateBody(requestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email } = req.body;

        // Always return success to prevent user enumeration
        const successResponse = {
          success: true,
          message: 'If the email exists, you will receive password reset instructions',
        };

        // Find user
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: { id: true, email: true, name: true },
        });

        if (!user) {
          // Don't reveal if user doesn't exist (timing-safe)
          await new Promise(resolve => setTimeout(resolve, 100));
          return res.json(successResponse);
        }

        // Generate secure token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Store token
        await prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            token,
            expiresAt,
          },
        });

        // TODO: Send email with reset link
        // await sendPasswordResetEmail(user.email, token);

        // Log for dev (remove in production)
        if (env.NODE_ENV === 'development') {
          console.log(`[DEV] Password reset token for ${user.email}: ${token}`);
        }

        res.json(successResponse);
      } catch (error) {
        next(error);
      }
    }
  );
}
