import { FastifyInstance } from 'fastify';
import { DashboardService } from './dashboard.service.js';

const service = new DashboardService();

export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  app.get('/dashboard/overview', async (_request, reply) => {
    const data = await service.getOverview();
    return reply.send(data);
  });

  app.get('/dashboard/leads/sources', async (_request, reply) => {
    const data = await service.getLeadSources();
    return reply.send(data);
  });

  app.get('/dashboard/leads/status', async (_request, reply) => {
    const data = await service.getLeadStatus();
    return reply.send(data);
  });

  app.get('/dashboard/leads/scores', async (_request, reply) => {
    const data = await service.getLeadScores();
    return reply.send(data);
  });

  app.get('/dashboard/campaigns/performance', async (_request, reply) => {
    const data = await service.getCampaignPerformance();
    return reply.send(data);
  });

  app.get('/dashboard/messages/timeline', async (request, reply) => {
    const { days } = request.query as { days?: string };
    const data = await service.getMessageTimeline(days ? Number(days) : 30);
    return reply.send(data);
  });

  app.get('/dashboard/leads/recent', async (request, reply) => {
    const { limit } = request.query as { limit?: string };
    const data = await service.getRecentLeads(limit ? Number(limit) : 10);
    return reply.send(data);
  });
}
