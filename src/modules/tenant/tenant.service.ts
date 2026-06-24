import { getPrismaClient } from '../../infra/database/prisma-client.js';
import { ConflictError, NotFoundError } from '../../shared/errors/index.js';
import type { CreateTenantInput, TenantData } from './tenant.types.js';

export class TenantService {
  async create(input: CreateTenantInput): Promise<TenantData> {
    const prisma = getPrismaClient();

    const existing = await prisma.tenant.findUnique({ where: { slug: input.slug } });
    if (existing) {
      throw new ConflictError(`Tenant com slug "${input.slug}" já existe`);
    }

    const tenant = await prisma.tenant.create({
      data: { nome: input.nome, slug: input.slug },
    });

    return {
      id: tenant.id,
      nome: tenant.nome,
      slug: tenant.slug,
      active: tenant.active,
      config: tenant.config as Record<string, unknown> | null,
      createdAt: tenant.createdAt.toISOString(),
    };
  }

  async list(): Promise<TenantData[]> {
    const prisma = getPrismaClient();

    const tenants = await prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });

    return tenants.map((t) => ({
      id: t.id,
      nome: t.nome,
      slug: t.slug,
      active: t.active,
      config: t.config as Record<string, unknown> | null,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  async getById(id: string): Promise<TenantData> {
    const prisma = getPrismaClient();

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundError('Tenant');

    return {
      id: tenant.id,
      nome: tenant.nome,
      slug: tenant.slug,
      active: tenant.active,
      config: tenant.config as Record<string, unknown> | null,
      createdAt: tenant.createdAt.toISOString(),
    };
  }

  async getBySlug(slug: string): Promise<TenantData | null> {
    const prisma = getPrismaClient();

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) return null;

    return {
      id: tenant.id,
      nome: tenant.nome,
      slug: tenant.slug,
      active: tenant.active,
      config: tenant.config as Record<string, unknown> | null,
      createdAt: tenant.createdAt.toISOString(),
    };
  }
}

export const tenantService = new TenantService();
