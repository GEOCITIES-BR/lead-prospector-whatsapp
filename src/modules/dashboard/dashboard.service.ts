import { getPrismaClient } from '../../infra/database/prisma-client.js';
import {
  DashboardOverview,
  LeadSourceItem,
  LeadStatusItem,
  LeadScoreData,
  CampaignPerformanceItem,
  MessageTimelineItem,
} from './dashboard.types.js';

export class DashboardService {
  async getOverview(): Promise<DashboardOverview> {
    const prisma = getPrismaClient();

    const [
      totalLeads,
      totalCampanhas,
      totalMensagens,
      totalTemplates,
      contactedCount,
      pendingLeadCount,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.campaign.count(),
      prisma.message.count(),
      prisma.template.count(),
      prisma.lead.count({ where: { status: 'contacted' } }),
      prisma.lead.count({
        where: {
          status: { notIn: ['contacted', 'responded', 'converted', 'opt_out', 'unqualified'] },
        },
      }),
    ]);

    return {
      totalLeads,
      totalCampanhas,
      totalMensagens,
      totalTemplates,
      leadsContacted: contactedCount,
      leadsPendentes: pendingLeadCount,
      taxaConversao: totalLeads > 0 ? Number(((contactedCount / totalLeads) * 100).toFixed(1)) : 0,
    };
  }

  async getLeadSources(): Promise<LeadSourceItem[]> {
    const prisma = getPrismaClient();

    const result = await prisma.$queryRawUnsafe<LeadSourceItem[]>(
      `SELECT COALESCE(origem, 'desconhecida') AS origem, COUNT(*)::int AS total
       FROM leads
       GROUP BY origem
       ORDER BY total DESC`,
    );

    return result;
  }

  async getLeadStatus(): Promise<LeadStatusItem[]> {
    const prisma = getPrismaClient();

    const result = await prisma.$queryRawUnsafe<LeadStatusItem[]>(
      `SELECT status::text, COUNT(*)::int AS total
       FROM leads
       GROUP BY status
       ORDER BY total DESC`,
    );

    return result;
  }

  async getLeadScores(): Promise<LeadScoreData> {
    const prisma = getPrismaClient();

    const [aggregate, distribuicao] = await Promise.all([
      prisma.$queryRawUnsafe<{ media: number; min: number; max: number }[]>(
        `SELECT COALESCE(AVG(score), 0)::float AS media,
                COALESCE(MIN(score), 0)::int AS min,
                COALESCE(MAX(score), 0)::int AS max
         FROM leads`,
      ),
      prisma.$queryRawUnsafe<{ faixa: string; min: number; max: number; total: number }[]>(
        `SELECT CASE
           WHEN score BETWEEN 0 AND 25 THEN '0-25'
           WHEN score BETWEEN 26 AND 50 THEN '26-50'
           WHEN score BETWEEN 51 AND 75 THEN '51-75'
           WHEN score BETWEEN 76 AND 100 THEN '76-100'
         END AS faixa,
         MIN(score)::int, MAX(score)::int, COUNT(*)::int AS total
         FROM leads
         GROUP BY faixa
         ORDER BY faixa`,
      ),
    ]);

    const stats = aggregate[0] || { media: 0, min: 0, max: 0 };

    return {
      media: Math.round(stats.media * 100) / 100,
      min: stats.min,
      max: stats.max,
      distribuicao: distribuicao.map((d) => ({
        faixa: d.faixa,
        min: d.min,
        max: d.max,
        total: d.total,
      })),
    };
  }

  async getCampaignPerformance(): Promise<CampaignPerformanceItem[]> {
    const prisma = getPrismaClient();

    const result = await prisma.$queryRawUnsafe<CampaignPerformanceItem[]>(
      `SELECT
         c.id, c.nome, c.status::text,
         COUNT(cl.lead_id)::int AS "totalLeads",
         COUNT(cl.lead_id) FILTER (WHERE cl.status = 'sent')::int AS enviados,
         COUNT(cl.lead_id) FILTER (WHERE cl.status = 'failed')::int AS falhos,
         COUNT(cl.lead_id) FILTER (WHERE cl.status = 'pending' OR cl.status = 'scheduled')::int AS pendentes,
         CASE
           WHEN COUNT(cl.lead_id) > 0
           THEN ROUND(COUNT(cl.lead_id) FILTER (WHERE cl.status = 'sent')::numeric / COUNT(cl.lead_id) * 100, 1)
           ELSE 0
         END AS "taxaSucesso"
       FROM campanhas c
       LEFT JOIN campanhas_leads cl ON cl.campanha_id = c.id
       GROUP BY c.id, c.nome, c.status
       ORDER BY c.created_at DESC`,
    );

    return result;
  }

  async getMessageTimeline(days: number = 30): Promise<MessageTimelineItem[]> {
    const prisma = getPrismaClient();

    const result = await prisma.$queryRawUnsafe<MessageTimelineItem[]>(
      `SELECT
         TO_CHAR(COALESCE(enviada_em, created_at), 'YYYY-MM-DD') AS data,
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'sent' OR status = 'delivered' OR status = 'read')::int AS enviados,
         COUNT(*) FILTER (WHERE status = 'failed')::int AS falhos
       FROM mensagens
       WHERE COALESCE(enviada_em, created_at) >= NOW() - ($1 || ' days')::interval
       GROUP BY data
       ORDER BY data ASC`,
      [String(days)],
    );

    return result;
  }

  async getRecentLeads(limit: number = 10) {
    const prisma = getPrismaClient();

    return prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        nome: true,
        empresa: true,
        cargo: true,
        origem: true,
        score: true,
        status: true,
        createdAt: true,
      },
    });
  }
}
