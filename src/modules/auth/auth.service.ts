import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { getPrismaClient } from '../../infra/database/prisma-client.js';
import { UnauthorizedError } from '../../shared/errors/index.js';
import type {
  AuthPayload,
  CreateApiKeyInput,
  CreateApiKeyResult,
  LoginInput,
  LoginResult,
  ApiKeyData,
} from './auth.types.js';
import { getCurrentTenantId } from '../tenant/tenant.context.js';

const API_KEY_PREFIX = 'lp_';
const API_KEY_LENGTH = 48;
const JWT_EXPIRES_IN = 86400;
const HASH_ALGO = 'pbkdf2_sha512';
const HASH_KEY_LENGTH = 64;

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 4) return false;
  const [algo, iterationsStr, salt, hash] = parts;
  if (algo !== HASH_ALGO) return false;
  const iterations = parseInt(iterationsStr, 10);
  const computed = crypto
    .pbkdf2Sync(password, salt, iterations, HASH_KEY_LENGTH, 'sha512')
    .toString('hex');
  if (computed.length !== hash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(computed, 'utf8'), Buffer.from(hash, 'utf8'));
}

export class AuthService {
  async login(input: LoginInput): Promise<LoginResult> {
    const prisma = getPrismaClient();

    const user = await prisma.user.findUnique({ where: { email: input.email } });

    if (user && user.active) {
      if (!verifyPassword(input.password, user.passwordHash)) {
        throw new UnauthorizedError('Credenciais inválidas');
      }
      const token = this.signJwt({ sub: user.id, role: user.role });
      return { token, expiresIn: JWT_EXPIRES_IN };
    }

    const envEmail = process.env.AUTH_EMAIL;
    const envPassword = process.env.AUTH_PASSWORD;

    if (envEmail && envPassword && input.email === envEmail && input.password === envPassword) {
      const token = this.signJwt({ sub: 'admin', role: 'admin' });
      return { token, expiresIn: JWT_EXPIRES_IN };
    }

    throw new UnauthorizedError('Credenciais inválidas');
  }

  signJwt(payload: AuthPayload): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedError('JWT não configurado');
    }
    return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRES_IN });
  }

  verifyJwt(token: string): AuthPayload {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedError('JWT não configurado');
    }
    try {
      return jwt.verify(token, secret) as AuthPayload;
    } catch {
      throw new UnauthorizedError('Token inválido ou expirado');
    }
  }

  async validateApiKey(key: string): Promise<boolean> {
    const prisma = getPrismaClient();

    const apiKey = await prisma.apiKey.findUnique({ where: { key } });

    if (!apiKey || !apiKey.active) {
      return false;
    }

    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsed: new Date() },
    });

    return true;
  }

  async createApiKey(input: CreateApiKeyInput): Promise<CreateApiKeyResult> {
    const rawKey = crypto.randomBytes(API_KEY_LENGTH).toString('hex');
    const key = `${API_KEY_PREFIX}${rawKey}`;
    const prefix = key.substring(0, 10);

    const prisma = getPrismaClient();

    const apiKey = await prisma.apiKey.create({
      data: { name: input.name, key, prefix, tenantId: getCurrentTenantId() },
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      prefix: apiKey.prefix,
      key: apiKey.key,
      createdAt: apiKey.createdAt.toISOString(),
    };
  }

  async listApiKeys(): Promise<ApiKeyData[]> {
    const prisma = getPrismaClient();

    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      prefix: k.prefix,
      active: k.active,
      lastUsed: k.lastUsed?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
    }));
  }

  async revokeApiKey(id: string): Promise<void> {
    const prisma = getPrismaClient();

    const existing = await prisma.apiKey.findUnique({ where: { id } });
    if (!existing) {
      throw new UnauthorizedError('API key não encontrada');
    }

    await prisma.apiKey.update({
      where: { id },
      data: { active: false },
    });
  }

  async authenticate(request: {
    headers: Record<string, string | string[] | undefined>;
  }): Promise<void> {
    const apiKey = request.headers['x-api-key'] as string | undefined;

    if (apiKey) {
      const valid = await this.validateApiKey(apiKey);
      if (!valid) {
        throw new UnauthorizedError('API key inválida');
      }
      return;
    }

    const authHeader = request.headers['authorization'] as string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      this.verifyJwt(token);
      return;
    }

    throw new UnauthorizedError('Autenticação necessária');
  }
}

export const authService = new AuthService();
