import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { Env } from '../../config/env.schema.js';
import { healthRoutes } from './routes/health.js';
import { leadRoutes } from './routes/leads.js';
import { googleBusinessRoutes } from '../modules/scraping/google-business/google-business.router.js';
import { linkedinRoutes } from '../modules/scraping/linkedin/linkedin.router.js';
import { enrichmentRoutes } from '../modules/enrichment/enrichment.router.js';
import { whatsappRoutes } from '../modules/message/whatsapp.router.js';
import { templateRoutes } from '../modules/template/template.router.js';
import { campaignRoutes } from '../modules/campaign/campaign.router.js';
import { n8nRoutes } from '../modules/n8n/n8n.router.js';
import { dashboardRoutes } from '../modules/dashboard/dashboard.router.js';
import { lgpdRoutes } from '../modules/lgpd/lgpd.router.js';
import { authRoutes, isPublicRoute, authService } from '../modules/auth/index.js';
import { tenantRoutes } from '../modules/tenant/index.js';
import { errorHandler } from './middlewares/error-handler.js';
import metricsPlugin from 'fastify-metrics';

export async function buildApp(env: Env) {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: env.LOG_PRETTY
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: env.CORS_ORIGIN });
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(metricsPlugin, { endpoint: '/metrics' });

  app.setErrorHandler(errorHandler);

  app.addHook('preHandler', async (request, reply) => {
    if (isPublicRoute(request.url)) {
      return;
    }

    try {
      await authService.authenticate(request);
    } catch {
      reply.status(401).send({ error: true, message: 'Não autorizado' });
    }
  });

  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(leadRoutes, { prefix: '/api/leads' });
  await app.register(googleBusinessRoutes, { prefix: '/api' });
  await app.register(linkedinRoutes, { prefix: '/api' });
  await app.register(enrichmentRoutes, { prefix: '/api' });
  await app.register(whatsappRoutes, { prefix: '/api' });
  await app.register(templateRoutes, { prefix: '/api' });
  await app.register(campaignRoutes, { prefix: '/api' });
  await app.register(n8nRoutes, { prefix: '/api' });
  await app.register(dashboardRoutes, { prefix: '/api' });
  await app.register(lgpdRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api' });
  await app.register(tenantRoutes, { prefix: '/api' });

  return app;
}
