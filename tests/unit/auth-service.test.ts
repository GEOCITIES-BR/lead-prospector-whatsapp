import crypto from 'node:crypto';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    upsert: vi.fn(),
  },
  apiKey: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('../../src/infra/database/prisma-client.js', () => ({
  getPrismaClient: () => mockPrisma,
}));

import { AuthService } from '../../src/modules/auth/auth.service.js';

const service = new AuthService();

function makeHash(password: string, salt: string): string {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2_sha512$100000$${salt}$${hash}`;
}

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.AUTH_EMAIL;
    delete process.env.AUTH_PASSWORD;
    process.env.JWT_SECRET = 'test-secret-for-testing';
  });

  describe('login', () => {
    it('should authenticate with DB user', async () => {
      const salt = crypto.randomBytes(16).toString('hex');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'admin@test.com',
        name: 'Admin',
        passwordHash: makeHash('correct-password', salt),
        role: 'admin',
        active: true,
        tenantId: 'tenant-1',
      });

      const result = await service.login({ email: 'admin@test.com', password: 'correct-password' });
      expect(result.token).toBeTruthy();
      expect(result.expiresIn).toBe(86400);
    });

    it('should reject wrong password for DB user', async () => {
      const salt = crypto.randomBytes(16).toString('hex');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'admin@test.com',
        name: 'Admin',
        passwordHash: makeHash('correct-password', salt),
        role: 'admin',
        active: true,
        tenantId: 'tenant-1',
      });

      await expect(
        service.login({ email: 'admin@test.com', password: 'wrong-password' }),
      ).rejects.toThrow('Credenciais inválidas');
    });

    it('should fallback to env vars when DB user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      process.env.AUTH_EMAIL = 'env@test.com';
      process.env.AUTH_PASSWORD = 'env-pass';

      const result = await service.login({ email: 'env@test.com', password: 'env-pass' });
      expect(result.token).toBeTruthy();
    });

    it('should reject when neither DB nor env matches', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      process.env.AUTH_EMAIL = 'env@test.com';
      process.env.AUTH_PASSWORD = 'env-pass';

      await expect(service.login({ email: 'wrong@test.com', password: 'wrong' })).rejects.toThrow(
        'Credenciais inválidas',
      );
    });

    it('should reject inactive DB user', async () => {
      const salt = crypto.randomBytes(16).toString('hex');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'admin@test.com',
        name: 'Admin',
        passwordHash: makeHash('password', salt),
        role: 'admin',
        active: false,
        tenantId: 'tenant-1',
      });

      await expect(
        service.login({ email: 'admin@test.com', password: 'password' }),
      ).rejects.toThrow('Credenciais inválidas');
    });
  });

  describe('createApiKey', () => {
    it('should create an API key with prefix', async () => {
      mockPrisma.apiKey.create.mockResolvedValue({
        id: 'key-1',
        name: 'Test Key',
        key: 'lp_' + 'a'.repeat(96),
        prefix: 'lp_' + 'a'.repeat(7),
        active: true,
        createdAt: new Date('2025-01-01'),
      });

      const result = await service.createApiKey({ name: 'Test Key' });

      expect(result.name).toBe('Test Key');
      expect(result.key.startsWith('lp_')).toBe(true);
      expect(result.prefix.length).toBe(10);
    });
  });

  describe('validateApiKey', () => {
    it('should return true for valid active key', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue({
        id: 'key-1',
        key: 'lp_valid',
        active: true,
      });
      mockPrisma.apiKey.update.mockResolvedValue({});

      const result = await service.validateApiKey('lp_valid');
      expect(result).toBe(true);
    });

    it('should return false for inactive key', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue({
        id: 'key-1',
        key: 'lp_inactive',
        active: false,
      });

      const result = await service.validateApiKey('lp_inactive');
      expect(result).toBe(false);
    });

    it('should return false for non-existent key', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(null);

      const result = await service.validateApiKey('lp_nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('listApiKeys', () => {
    it('should return list of keys without full key', async () => {
      mockPrisma.apiKey.findMany.mockResolvedValue([
        {
          id: 'key-1',
          name: 'Key 1',
          prefix: 'lp_abc123',
          active: true,
          lastUsed: new Date('2025-01-01'),
          createdAt: new Date('2024-12-01'),
        },
      ]);

      const keys = await service.listApiKeys();
      expect(keys).toHaveLength(1);
      expect(keys[0].id).toBe('key-1');
      expect(keys[0].name).toBe('Key 1');
      expect(keys[0].prefix).toBe('lp_abc123');
    });
  });

  describe('revokeApiKey', () => {
    it('should deactivate key', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue({
        id: 'key-1',
        active: true,
      });

      await service.revokeApiKey('key-1');
      expect(mockPrisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-1' },
        data: { active: false },
      });
    });

    it('should throw for non-existent key', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(null);

      await expect(service.revokeApiKey('nonexistent')).rejects.toThrow('API key não encontrada');
    });
  });

  describe('authenticate', () => {
    it('should accept valid API key', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue({
        id: 'key-1',
        key: 'lp_valid',
        active: true,
      });
      mockPrisma.apiKey.update.mockResolvedValue({});

      const request = { headers: { 'x-api-key': 'lp_valid' } };
      await expect(service.authenticate(request)).resolves.toBeUndefined();
    });

    it('should reject missing auth', async () => {
      const request = { headers: {} };
      await expect(service.authenticate(request)).rejects.toThrow('Autenticação necessária');
    });
  });
});
