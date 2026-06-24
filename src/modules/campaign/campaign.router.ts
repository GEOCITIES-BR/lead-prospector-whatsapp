import { FastifyInstance } from 'fastify';
import { CampaignService } from './campaign.service.js';
import {
  CreateCampaignInput,
  UpdateCampaignInput,
  AddLeadsInput,
  ScheduleCampaignInput,
} from './campaign.types.js';

const service = new CampaignService();

export async function campaignRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: CreateCampaignInput }>('/campaigns', async (request, reply) => {
    try {
      const result = await service.create(request.body);
      return reply.status(201).send(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return reply.status(400).send({ error: true, code: 'VALIDATION_ERROR', message });
    }
  });

  app.get('/campaigns', async (request, reply) => {
    const query = request.query as { page?: string; limit?: string };
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const result = await service.list(page, limit);
    return reply.send(result);
  });

  app.get<{ Params: { id: string } }>('/campaigns/:id', async (request, reply) => {
    try {
      const campaign = await service.getById(request.params.id);
      return reply.send(campaign);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      if (message.includes('não encontrada')) {
        return reply.status(404).send({ error: true, code: 'NOT_FOUND', message });
      }
      return reply.status(500).send({ error: true, code: 'SERVER_ERROR', message });
    }
  });

  app.put<{ Params: { id: string }; Body: UpdateCampaignInput }>(
    '/campaigns/:id',
    async (request, reply) => {
      try {
        const result = await service.update(request.params.id, request.body);
        return reply.send(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        if (message.includes('não encontrada')) {
          return reply.status(404).send({ error: true, code: 'NOT_FOUND', message });
        }
        return reply.status(400).send({ error: true, code: 'VALIDATION_ERROR', message });
      }
    },
  );

  app.delete<{ Params: { id: string } }>('/campaigns/:id', async (request, reply) => {
    try {
      await service.delete(request.params.id);
      return reply.send({ success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      if (message.includes('não encontrada')) {
        return reply.status(404).send({ error: true, code: 'NOT_FOUND', message });
      }
      return reply.status(500).send({ error: true, code: 'SERVER_ERROR', message });
    }
  });

  app.post<{ Params: { id: string }; Body: AddLeadsInput }>(
    '/campaigns/:id/leads',
    async (request, reply) => {
      try {
        const result = await service.addLeads(request.params.id, request.body);
        return reply.send(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        return reply.status(400).send({ error: true, code: 'VALIDATION_ERROR', message });
      }
    },
  );

  app.get<{ Params: { id: string } }>('/campaigns/:id/leads', async (request, reply) => {
    const query = request.query as { page?: string; limit?: string };
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);

    try {
      const result = await service.listLeads(request.params.id, page, limit);
      return reply.send(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return reply.status(500).send({ error: true, code: 'SERVER_ERROR', message });
    }
  });

  app.delete<{ Params: { id: string; leadId: string } }>(
    '/campaigns/:id/leads/:leadId',
    async (request, reply) => {
      try {
        await service.removeLead(request.params.id, request.params.leadId);
        return reply.send({ success: true });
      } catch {
        return reply.send({ success: true });
      }
    },
  );

  app.post<{ Params: { id: string }; Body: ScheduleCampaignInput }>(
    '/campaigns/:id/schedule',
    async (request, reply) => {
      try {
        const result = await service.schedule(request.params.id, request.body.scheduledAt);
        return reply.send(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        return reply.status(400).send({ error: true, code: 'VALIDATION_ERROR', message });
      }
    },
  );

  app.post<{ Params: { id: string } }>('/campaigns/:id/execute', async (request, reply) => {
    try {
      const { MessageService } = await import('../message/message.service.js');
      const env = process.env as Record<string, string>;
      const messageService = new MessageService({
        apiUrl: env.WAHA_API_URL || 'http://localhost:3002',
        apiKey: env.WAHA_API_KEY || '',
        sessionName: env.WAHA_SESSION_NAME || 'default',
      });
      const result = await service.execute(request.params.id, messageService);
      return reply.send(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return reply.status(500).send({ error: true, code: 'EXECUTE_ERROR', message });
    }
  });

  app.get('/campaigns/status', async (_request, _reply) => {
    return { status: 'ready', module: 'campaigns' };
  });
}
