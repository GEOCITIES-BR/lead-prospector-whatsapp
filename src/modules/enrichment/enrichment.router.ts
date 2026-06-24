import { FastifyInstance } from 'fastify';
import { EnrichmentService } from './enrichment.service.js';
import { BatchEnrichmentInput } from './enrichment.types.js';

const service = new EnrichmentService();

export async function enrichmentRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Params: { id: string } }>('/enrich/lead/:id', async (request, reply) => {
    const { id } = request.params;

    if (!id) {
      return reply.status(400).send({
        error: true,
        code: 'VALIDATION_ERROR',
        message: 'id do lead é obrigatório',
      });
    }

    try {
      const result = await service.enrichLead(id);
      return reply.send(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      if (message.includes('não encontrado')) {
        return reply.status(404).send({ error: true, code: 'NOT_FOUND', message });
      }
      return reply.status(500).send({ error: true, code: 'ENRICH_ERROR', message });
    }
  });

  app.post<{ Body: BatchEnrichmentInput }>('/enrich/batch', async (request, reply) => {
    const { leadIds } = request.body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return reply.status(400).send({
        error: true,
        code: 'VALIDATION_ERROR',
        message: 'leadIds array é obrigatório',
      });
    }

    if (leadIds.length > 100) {
      return reply.status(400).send({
        error: true,
        code: 'VALIDATION_ERROR',
        message: 'Máximo de 100 leads por lote',
      });
    }

    const results = await service.enrichBatch(leadIds);
    return reply.send({ total: results.length, results });
  });

  app.get('/dedup', async (_request, reply) => {
    try {
      const duplicates = await service.findDuplicates();
      return reply.send({ total: duplicates.length, duplicates });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return reply.status(500).send({ error: true, code: 'DEDUP_ERROR', message });
    }
  });

  app.get('/enrich/status', async (_request, _reply) => {
    return { status: 'ready', module: 'enrichment' };
  });
}
