// src/modules/auth/routes/password-reset-confirm.route.ts
import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validateBody } from '../../../core/middleware';
import bcrypt from 'bcrypt';
import { BadRequestError } from '../../../core/errors';

const confirmSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  passwordConfirmation: z.string(),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "Passwords don't match",
  path: ['passwordConfirmation'],
});

export function setupPasswordResetConfirmRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.patch(
    `${baseUrl}/password/reset/:token`,
    validateBody(confirmSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { token } = req.params;
        const { password } = req.body;

        // Find valid token
        const resetToken = await prisma.passwordResetToken.findUnique({
          where: { token },
          include: { user: true },
        });

        if (!resetToken || resetToken.expiresAt < new Date()) {
          throw new BadRequestError('Invalid or expired reset token');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Update password
        await prisma.user.update({
          where: { id: resetToken.userId },
          data: {
            password: hashedPassword,
            updatedAt: new Date(),
          },
        });

        // Delete used token
        await prisma.passwordResetToken.delete({
          where: { token },
        });

        // Invalidate all existing sessions (optional but recommended)
        // await prisma.session.deleteMany({ where: { userId: resetToken.userId } });

        res.json({
          success: true,
          message: 'Password reset successfully',
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
