// tests/auth.test.ts
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../src/modules/auth/service';
import bcrypt from 'bcryptjs';

// Mock Prisma
const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  company: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  companySettings: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
} as unknown as PrismaClient;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash,
        role: 'admin',
        companyId: 'company-1',
        active: true,
        twoFactorSecret: null,
        company: { id: 'company-1', name: 'Test Company' },
      });

      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should reject login with invalid password', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash,
        active: true,
      });

      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should reject login for inactive user', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login('test@example.com', 'password123')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should require 2FA when enabled', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash,
        role: 'admin',
        companyId: 'company-1',
        active: true,
        twoFactorSecret: 'secret',
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toHaveProperty('requires2FA', true);
      expect(result).toHaveProperty('userId');
    });
  });

  describe('register', () => {
    it('should register new company and admin user', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.company.findFirst as jest.Mock).mockResolvedValue(null);

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          company: {
            create: jest.fn().mockResolvedValue({
              id: 'company-1',
              name: 'New Company',
              domain: 'newco',
            }),
          },
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-1',
              email: 'admin@newco.com',
              name: 'Admin',
              role: 'admin',
              companyId: 'company-1',
            }),
          },
          companySettings: {
            create: jest.fn(),
          },
        };
        return callback(mockTx);
      });

      const result = await authService.register({
        name: 'Admin',
        email: 'admin@newco.com',
        password: 'password123',
        companyName: 'New Company',
        companyDomain: 'newco',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe('admin@newco.com');
      expect(result.user.role).toBe('admin');
    });

    it('should reject duplicate email', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: 'admin@newco.com',
      });

      await expect(
        authService.register({
          name: 'Admin',
          email: 'admin@newco.com',
          password: 'password123',
          companyName: 'New Company',
          companyDomain: 'newco',
        })
      ).rejects.toThrow('Email already registered');
    });

    it('should reject duplicate domain', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.company.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-company',
        domain: 'newco',
      });

      await expect(
        authService.register({
          name: 'Admin',
          email: 'admin@newco.com',
          password: 'password123',
          companyName: 'New Company',
          companyDomain: 'newco',
        })
      ).rejects.toThrow('Company domain already registered');
    });
  });
});
