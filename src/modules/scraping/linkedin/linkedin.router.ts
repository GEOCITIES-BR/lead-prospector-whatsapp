import { FastifyInstance } from 'fastify';
import { LinkedInService } from './linkedin.service.js';
import { LinkedInSearchInput } from './linkedin.types.js';

const service = new LinkedInService();

export async function linkedinRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: LinkedInSearchInput }>('/scrape/linkedin', async (request, reply) => {
    const input = request.body;

    if (!input.keyword) {
      return reply.status(400).send({
        error: true,
        code: 'VALIDATION_ERROR',
        message: 'keyword é obrigatório',
      });
    }

    const result = await service.searchAndSave(input);
    return reply.status(result.success ? 200 : 500).send(result);
  });

  app.post<{ Body: { email: string; password: string } }>(
    '/scrape/linkedin/login',
    async (request, reply) => {
      const { email, password } = request.body;

      if (!email || !password) {
        return reply.status(400).send({
          error: true,
          code: 'VALIDATION_ERROR',
          message: 'email e password são obrigatórios',
        });
      }

      service.setCredentials({ email, password });
      return {
        success: true,
        message: 'Credenciais configuradas. Use POST /scrape/linkedin para buscar.',
      };
    },
  );

  app.get('/scrape/linkedin/status', async (_request, _reply) => {
    return { status: 'ready', provider: 'linkedin' };
  });
}
