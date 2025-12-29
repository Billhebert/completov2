// src/modules/auth/service.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import {
  UnauthorizedError,
  ConflictError,
  BadRequestError,
} from '../../core/errors';
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../core/middleware/auth';
import { JWTPayload } from '../../core/types';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Login
   */
  async login(email: string, password: string, code2FA?: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, active: true },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check 2FA if enabled
    if (user.twoFactorSecret) {
      if (!code2FA) {
        return {
          requires2FA: true,
          userId: user.id,
        };
      }

      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: code2FA,
        window: 2,
      });

      if (!isValid) {
        throw new UnauthorizedError('Invalid 2FA code');
      }
    }

    // Generate tokens
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company.name,
      },
    };
  }

  /**
   * Register (creates company + admin user)
   */
  async register(data: {
    name: string;
    email: string;
    password: string;
    companyName: string;
    companyDomain: string;
  }) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Check if domain already exists
    const existingCompany = await this.prisma.company.findFirst({
      where: { domain: data.companyDomain },
    });

    if (existingCompany) {
      throw new ConflictError('Company domain already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create company and admin user in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: data.companyName,
          domain: data.companyDomain,
          active: true,
        },
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          name: data.name,
          passwordHash,
          role: 'admin',
          companyId: company.id,
          active: true,
        },
      });

      // Create default company settings
      await tx.companySettings.create({
        data: {
          companyId: company.id,
          enabledModules: ['chat', 'crm', 'erp', 'knowledge', 'ai'],
          customSkillCategories: [],
        },
      });

      return { company, user };
    });

    // Generate tokens
    const payload: JWTPayload = {
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      companyId: result.user.companyId,
    };

    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        companyId: result.user.companyId,
        companyName: result.company.name,
      },
    };
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);

      // Verify user still exists and is active
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || !user.active) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Generate new tokens
      const newPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      };

      const accessToken = generateToken(newPayload);
      const newRefreshToken = generateRefreshToken(newPayload);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  /**
   * Setup 2FA
   */
  async setup2FA(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid password');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `OMNI Platform (${user.email})`,
      length: 32,
    });

    // Save secret (temporarily)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url,
    };
  }

  /**
   * Verify and enable 2FA
   */
  async verify2FA(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestError('2FA setup not initiated');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!isValid) {
      throw new BadRequestError('Invalid 2FA token');
    }

    // 2FA is now enabled
    return { success: true, message: '2FA enabled successfully' };
  }

  /**
   * Disable 2FA
   */
  async disable2FA(userId: string, password: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestError('2FA not enabled');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid password');
    }

    // Verify 2FA token
    const isValidToken = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!isValidToken) {
      throw new BadRequestError('Invalid 2FA token');
    }

    // Remove 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: null },
    });

    return { success: true, message: '2FA disabled successfully' };
  }

  /**
   * Get current user
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
        twoFactorSecret: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return {
      ...user,
      has2FA: !!user.twoFactorSecret,
      twoFactorSecret: undefined, // Don't expose the secret
    };
  }
}
