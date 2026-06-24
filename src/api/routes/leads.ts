import { FastifyInstance } from 'fastify';

export async function leadRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', async (_request, _reply) => {
    return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
  });

  app.get<{ Params: { id: string } }>('/:id', async (request, _reply) => {
    const { id } = request.params;
    return { id, message: `Lead ${id} encontrado (placeholder)` };
  });
}
