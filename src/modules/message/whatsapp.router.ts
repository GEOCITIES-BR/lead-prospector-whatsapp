import { FastifyInstance } from 'fastify';
import { MessageService, SendMessageInput } from './message.service.js';

export async function whatsappRoutes(app: FastifyInstance): Promise<void> {
  let service: MessageService | null = null;

  function getService(): MessageService {
    if (!service) {
      const env = process.env as Record<string, string>;
      service = new MessageService({
        apiUrl: env.WAHA_API_URL || 'http://localhost:3002',
        apiKey: env.WAHA_API_KEY || '',
        sessionName: env.WAHA_SESSION_NAME || 'default',
      });
    }
    return service;
  }

  app.post<{ Body: SendMessageInput }>('/whatsapp/send', async (request, reply) => {
    const input = request.body;

    if (!input.leadId || !input.conteudo) {
      return reply.status(400).send({
        error: true,
        code: 'VALIDATION_ERROR',
        message: 'leadId e conteudo são obrigatórios',
      });
    }

    const result = await getService().send(input);
    return reply.status(result.success ? 200 : 400).send(result);
  });

  app.post('/whatsapp/session/start', async (_request, reply) => {
    try {
      const result = await getService().startSession();
      return reply.send(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return reply.status(500).send({ error: true, code: 'SESSION_ERROR', message });
    }
  });

  app.post('/whatsapp/session/stop', async (_request, reply) => {
    try {
      await getService().stopSession();
      return reply.send({ success: true, message: 'Sessão encerrada' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return reply.status(500).send({ error: true, code: 'SESSION_ERROR', message });
    }
  });

  app.get('/whatsapp/session/status', async (_request, reply) => {
    const status = await getService().getSessionStatus();
    return reply.send(status);
  });

  app.get('/whatsapp/session/qrcode', async (_request, reply) => {
    try {
      const qrcode = await getService().getQrCode();
      return reply.send({ qrcode });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return reply.status(500).send({ error: true, code: 'QR_ERROR', message });
    }
  });

  app.get('/whatsapp/status', async (_request, _reply) => {
    return { status: 'ready', module: 'whatsapp' };
  });
}
