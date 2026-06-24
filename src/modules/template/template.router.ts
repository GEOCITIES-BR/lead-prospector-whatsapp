import { FastifyInstance } from 'fastify';
import { TemplateService } from './template.service.js';
import { TemplateInput, TemplateUpdateInput, TemplatePreviewInput } from './template.types.js';

const service = new TemplateService();

export async function templateRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: TemplateInput }>('/templates', async (request, reply) => {
    try {
      const result = await service.create(request.body);
      return reply.status(201).send(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return reply.status(400).send({ error: true, code: 'VALIDATION_ERROR', message });
    }
  });

  app.get('/templates', async (request, reply) => {
    const query = request.query as { page?: string; limit?: string };
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);

    const result = await service.list(page, limit);
    return reply.send(result);
  });

  app.get<{ Params: { id: string } }>('/templates/:id', async (request, reply) => {
    try {
      const template = await service.getById(request.params.id);
      return reply.send(template);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      if (message.includes('não encontrado')) {
        return reply.status(404).send({ error: true, code: 'NOT_FOUND', message });
      }
      return reply.status(500).send({ error: true, code: 'SERVER_ERROR', message });
    }
  });

  app.put<{ Params: { id: string }; Body: TemplateUpdateInput }>(
    '/templates/:id',
    async (request, reply) => {
      try {
        await service.update(request.params.id, request.body);
        return reply.send({ success: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        if (message.includes('não encontrado')) {
          return reply.status(404).send({ error: true, code: 'NOT_FOUND', message });
        }
        return reply.status(400).send({ error: true, code: 'VALIDATION_ERROR', message });
      }
    },
  );

  app.delete<{ Params: { id: string } }>('/templates/:id', async (request, reply) => {
    try {
      await service.delete(request.params.id);
      return reply.send({ success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      if (message.includes('não encontrado')) {
        return reply.status(404).send({ error: true, code: 'NOT_FOUND', message });
      }
      return reply.status(500).send({ error: true, code: 'SERVER_ERROR', message });
    }
  });

  app.post<{ Body: TemplatePreviewInput }>('/templates/preview', async (request, reply) => {
    const result = service.preview(request.body);
    return reply.send({ result });
  });

  app.post<{ Body: { templateId: string; leadId: string } }>(
    '/templates/apply',
    async (request, reply) => {
      const { templateId, leadId } = request.body;

      if (!templateId || !leadId) {
        return reply.status(400).send({
          error: true,
          code: 'VALIDATION_ERROR',
          message: 'templateId e leadId são obrigatórios',
        });
      }

      try {
        const result = await service.apply(templateId, leadId);
        return reply.send({ result });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        if (message.includes('não encontrado')) {
          return reply.status(404).send({ error: true, code: 'NOT_FOUND', message });
        }
        return reply.status(500).send({ error: true, code: 'SERVER_ERROR', message });
      }
    },
  );

  app.get('/templates/status', async (_request, _reply) => {
    return { status: 'ready', module: 'templates' };
  });
}
