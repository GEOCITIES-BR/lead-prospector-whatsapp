import type { FastifyInstance } from 'fastify';
import { authService } from './auth.service.js';
import type { LoginInput, CreateApiKeyInput } from './auth.types.js';

const PUBLIC_PREFIXES = ['/health', '/lgpd/opt-out', '/lgpd/consent', '/metrics'];

export function isPublicRoute(url: string): boolean {
  return PUBLIC_PREFIXES.some((p) => url.startsWith(p));
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: LoginInput }>('/auth/login', async (request, reply) => {
    try {
      const result = await authService.login(request.body);
      return reply.send(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro interno';
      return reply.status(401).send({ error: true, message });
    }
  });

  app.post<{ Body: CreateApiKeyInput }>('/auth/api-keys', async (request, reply) => {
    try {
      await authService.authenticate(request);
      const result = await authService.createApiKey(request.body);
      return reply.status(201).send(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro interno';
      const status =
        message.includes('não configurado') ||
        message.includes('inválida') ||
        message.includes('necessária')
          ? 401
          : 400;
      return reply.status(status).send({ error: true, message });
    }
  });

  app.get('/auth/api-keys', async (request, reply) => {
    try {
      await authService.authenticate(request);
      const keys = await authService.listApiKeys();
      return reply.send(keys);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro interno';
      return reply.status(401).send({ error: true, message });
    }
  });

  app.delete<{ Params: { id: string } }>('/auth/api-keys/:id', async (request, reply) => {
    try {
      await authService.authenticate(request);
      await authService.revokeApiKey(request.params.id);
      return reply.send({ success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro interno';
      const status = message.includes('não encontrada') ? 404 : 401;
      return reply.status(status).send({ error: true, message });
    }
  });
}
