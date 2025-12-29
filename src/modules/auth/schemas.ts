// src/modules/auth/schemas.ts
import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    code2FA: z.string().optional(),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    companyName: z.string().min(2, 'Company name is required'),
    companyDomain: z.string().min(2, 'Company domain is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string(),
  }),
});

export const setup2FASchema = z.object({
  body: z.object({
    password: z.string(),
  }),
});

export const verify2FASchema = z.object({
  body: z.object({
    token: z.string().length(6, 'Token must be 6 digits'),
  }),
});

export const disable2FASchema = z.object({
  body: z.object({
    password: z.string(),
    token: z.string().length(6, 'Token must be 6 digits'),
  }),
});
