import { FastifyInstance } from 'fastify';
import { GoogleBusinessService } from './google-business.service.js';
import { GoogleBusinessSearchInput } from './google-business.types.js';

const service = new GoogleBusinessService();

export async function googleBusinessRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: GoogleBusinessSearchInput }>(
    '/scrape/google-business',
    async (request, reply) => {
      const input = request.body;

      if (!input.query || !input.location) {
        return reply.status(400).send({
          error: true,
          code: 'VALIDATION_ERROR',
          message: 'query e location são obrigatórios',
        });
      }

      const result = await service.searchAndSave(input);

      return reply.status(result.success ? 200 : 500).send(result);
    },
  );

  app.get('/scrape/google-business/status', async (_request, _reply) => {
    return { status: 'ready', provider: 'google_business' };
  });
}
