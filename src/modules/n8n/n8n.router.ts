import { FastifyInstance } from 'fastify';
import { N8nService } from './n8n.service.js';
import {
  N8nSendMessagePayload,
  N8nScrapeGooglePayload,
  N8nScrapeLinkedinPayload,
  N8nEnrichLeadPayload,
  N8nCreateLeadPayload,
} from './n8n.types.js';

const service = new N8nService();

export async function n8nRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: N8nSendMessagePayload }>('/n8n/send-message', async (request, reply) => {
    const result = await service.handleSendMessage(request.body);
    return reply.status(result.success ? 200 : 400).send(result);
  });

  app.post<{ Body: N8nScrapeGooglePayload }>('/n8n/scrape-google', async (request, reply) => {
    const result = await service.handleScrapeGoogle(request.body);
    return reply.status(result.success ? 200 : 400).send(result);
  });

  app.post<{ Body: N8nScrapeLinkedinPayload }>('/n8n/scrape-linkedin', async (request, reply) => {
    const result = await service.handleScrapeLinkedin(request.body);
    return reply.status(result.success ? 200 : 400).send(result);
  });

  app.post<{ Body: N8nEnrichLeadPayload }>('/n8n/enrich-lead', async (request, reply) => {
    const result = await service.handleEnrichLead(request.body);
    return reply.status(result.success ? 200 : 400).send(result);
  });

  app.post<{ Body: N8nCreateLeadPayload }>('/n8n/create-lead', async (request, reply) => {
    const result = await service.handleCreateLead(request.body);
    return reply.status(result.success ? 201 : 400).send(result);
  });

  app.post<{ Body: { wahaApiUrl: string; wahaApiKey: string; n8nWebhookUrl: string } }>(
    '/n8n/configure-webhooks',
    async (request, reply) => {
      const { wahaApiUrl, wahaApiKey, n8nWebhookUrl } = request.body;
      if (!wahaApiUrl || !n8nWebhookUrl) {
        return reply
          .status(400)
          .send({ success: false, error: 'wahaApiUrl e n8nWebhookUrl são obrigatórios' });
      }
      const result = await service.configureWahaWebhooks(wahaApiUrl, wahaApiKey, n8nWebhookUrl);
      return reply.send(result);
    },
  );

  app.post<{ Body: Record<string, unknown> }>('/n8n/webhooks/waha', async (request, reply) => {
    const event = request.body;
    console.log('[n8n] Webhook WAHA recebido:', JSON.stringify(event).substring(0, 500));
    return reply.send({ received: true });
  });

  app.get('/n8n/status', async (_request, _reply) => {
    return { status: 'ready', module: 'n8n' };
  });
}
