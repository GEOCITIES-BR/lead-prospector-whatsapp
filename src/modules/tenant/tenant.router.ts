import type { FastifyInstance } from 'fastify';
import { tenantService } from './tenant.service.js';
import type { CreateTenantInput } from './tenant.types.js';

export async function tenantRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: CreateTenantInput }>('/tenants', async (request, reply) => {
    try {
      const result = await tenantService.create(request.body);
      return reply.status(201).send(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro interno';
      const status = message.includes('já existe') ? 409 : 400;
      return reply.status(status).send({ error: true, message });
    }
  });

  app.get('/tenants', async (_request, reply) => {
    const tenants = await tenantService.list();
    return reply.send(tenants);
  });

  app.get<{ Params: { id: string } }>('/tenants/:id', async (request, reply) => {
    try {
      const tenant = await tenantService.getById(request.params.id);
      return reply.send(tenant);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro interno';
      return reply.status(404).send({ error: true, message });
    }
  });
}
