import { FastifyInstance } from 'fastify';
import { LgpdService } from './lgpd.service.js';
import { OptOutInput, ConsentInput } from './lgpd.types.js';

const service = new LgpdService();

export async function lgpdRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: OptOutInput }>('/lgpd/opt-out', async (request, reply) => {
    const result = await service.optOut(request.body);
    return reply.status(result.success ? 200 : 400).send(result);
  });

  app.post<{ Body: ConsentInput }>('/lgpd/consent', async (request, reply) => {
    const result = await service.registerConsent({
      ...request.body,
      ip: request.ip,
    });
    return reply.status(result.success ? 200 : 400).send(result);
  });

  app.delete<{ Params: { id: string } }>('/lgpd/lead/:id', async (request, reply) => {
    const result = await service.deleteLead(request.params.id);
    return reply.status(result.success ? 200 : 404).send(result);
  });

  app.get<{ Params: { id: string } }>('/lgpd/lead/:id/export', async (request, reply) => {
    const result = await service.exportLead(request.params.id);
    return reply.status(result.success ? 200 : 404).send(result);
  });

  app.get<{ Params: { id: string } }>('/lgpd/lead/:id/consent-history', async (request, reply) => {
    const result = await service.getConsentHistory(request.params.id);
    return reply.status(result.success ? 200 : 404).send(result);
  });
}
