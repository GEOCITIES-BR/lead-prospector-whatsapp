import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  lead: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  campaign: {
    count: vi.fn(),
  },
  message: {
    count: vi.fn(),
  },
  template: {
    count: vi.fn(),
  },
  $queryRawUnsafe: vi.fn(),
};

vi.mock('../../src/infra/database/prisma-client.js', () => ({
  getPrismaClient: () => mockPrisma,
}));

import { DashboardService } from '../../src/modules/dashboard/dashboard.service.js';

const service = new DashboardService();

function mockQuery(rawResult: unknown[]) {
  mockPrisma.$queryRawUnsafe.mockResolvedValue(rawResult);
}

describe('DashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOverview', () => {
    it('should return overview metrics', async () => {
      mockPrisma.lead.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(60);
      mockPrisma.campaign.count.mockResolvedValue(5);
      mockPrisma.message.count.mockResolvedValue(500);
      mockPrisma.template.count.mockResolvedValue(10);

      const result = await service.getOverview();

      expect(result.totalLeads).toBe(100);
      expect(result.totalCampanhas).toBe(5);
      expect(result.totalMensagens).toBe(500);
      expect(result.totalTemplates).toBe(10);
      expect(result.leadsContacted).toBe(30);
      expect(result.leadsPendentes).toBe(60);
      expect(result.taxaConversao).toBe(30.0);
    });

    it('should return zero taxa when no leads', async () => {
      mockPrisma.lead.count.mockResolvedValue(0);
      mockPrisma.campaign.count.mockResolvedValue(0);
      mockPrisma.message.count.mockResolvedValue(0);
      mockPrisma.template.count.mockResolvedValue(0);

      const result = await service.getOverview();
      expect(result.taxaConversao).toBe(0);
    });
  });

  describe('getLeadSources', () => {
    it('should return source distribution', async () => {
      mockQuery([
        { origem: 'google', total: 50 },
        { origem: 'linkedin', total: 30 },
        { origem: 'manual', total: 20 },
      ]);

      const result = await service.getLeadSources();
      expect(result).toHaveLength(3);
      expect(result[0].origem).toBe('google');
      expect(result[0].total).toBe(50);
    });
  });

  describe('getLeadStatus', () => {
    it('should return status distribution', async () => {
      mockQuery([
        { status: 'new', total: 60 },
        { status: 'contacted', total: 30 },
        { status: 'converted', total: 10 },
      ]);

      const result = await service.getLeadStatus();
      expect(result).toHaveLength(3);
    });
  });

  describe('getLeadScores', () => {
    it('should return score stats and distribution', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ media: 45.5, min: 0, max: 100 }])
        .mockResolvedValueOnce([
          { faixa: '0-25', min: 0, max: 25, total: 30 },
          { faixa: '26-50', min: 26, max: 50, total: 25 },
          { faixa: '51-75', min: 51, max: 75, total: 20 },
          { faixa: '76-100', min: 76, max: 100, total: 25 },
        ]);

      const result = await service.getLeadScores();
      expect(result.media).toBe(45.5);
      expect(result.min).toBe(0);
      expect(result.max).toBe(100);
      expect(result.distribuicao).toHaveLength(4);
    });
  });

  describe('getCampaignPerformance', () => {
    it('should return campaign performance', async () => {
      mockQuery([
        {
          id: 'c1',
          nome: 'Campanha 1',
          status: 'active',
          totalLeads: 100,
          enviados: 80,
          falhos: 5,
          pendentes: 15,
          taxaSucesso: 80.0,
        },
      ]);

      const result = await service.getCampaignPerformance();
      expect(result).toHaveLength(1);
      expect(result[0].taxaSucesso).toBe(80.0);
    });
  });

  describe('getMessageTimeline', () => {
    it('should return message timeline', async () => {
      mockQuery([
        { data: '2026-06-01', total: 50, enviados: 45, falhos: 5 },
        { data: '2026-06-02', total: 30, enviados: 28, falhos: 2 },
      ]);

      const result = await service.getMessageTimeline(7);
      expect(result).toHaveLength(2);
      expect(result[0].enviados).toBe(45);
    });
  });

  describe('getRecentLeads', () => {
    it('should return recent leads', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([
        {
          id: 'l1',
          nome: 'João',
          empresa: 'ACME',
          cargo: 'CEO',
          origem: 'google',
          score: 85,
          status: 'new',
          createdAt: new Date(),
        },
      ]);

      const result = await service.getRecentLeads(5);
      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('João');
    });
  });
});
