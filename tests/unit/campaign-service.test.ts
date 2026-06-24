import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  campaign: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  campaignLead: {
    createMany: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  template: {
    findUnique: vi.fn(),
  },
  message: {
    updateMany: vi.fn(),
  },
};

vi.mock('../../src/infra/database/prisma-client.js', () => ({
  getPrismaClient: () => mockPrisma,
}));

import { CampaignService } from '../../src/modules/campaign/campaign.service.js';

const service = new CampaignService();

describe('CampaignService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a campaign', async () => {
      mockPrisma.template.findUnique.mockResolvedValue({ id: 't1' });
      mockPrisma.campaign.create.mockResolvedValue({ id: 'c1', nome: 'Campanha 1' });

      const result = await service.create({
        nome: 'Campanha 1',
        templateId: 't1',
      });

      expect(result.id).toBe('c1');
    });

    it('should reject empty nome', async () => {
      await expect(service.create({ nome: '', templateId: 't1' })).rejects.toThrow(
        'Nome da campanha é obrigatório',
      );
    });

    it('should reject missing templateId', async () => {
      await expect(service.create({ nome: 'Campanha', templateId: '' })).rejects.toThrow(
        'templateId é obrigatório',
      );
    });

    it('should reject non-existent template', async () => {
      mockPrisma.template.findUnique.mockResolvedValue(null);

      await expect(service.create({ nome: 'Campanha', templateId: 'inexistente' })).rejects.toThrow(
        'Template inexistente não encontrado',
      );
    });
  });

  describe('getById', () => {
    it('should return campaign with template and counts', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue({
        id: 'c1',
        nome: 'Campanha 1',
        template: { id: 't1', nome: 'Template' },
        _count: { leads: 5, mensagens: 10 },
      });

      const result = await service.getById('c1');
      expect(result.id).toBe('c1');
      expect(result._count.leads).toBe(5);
    });

    it('should throw for non-existent campaign', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(null);
      await expect(service.getById('inexistente')).rejects.toThrow(
        'Campanha inexistente não encontrada',
      );
    });
  });

  describe('list', () => {
    it('should list campaigns with pagination', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([
        { id: 'c1', _count: { leads: 0, mensagens: 0 } },
      ]);
      mockPrisma.campaign.count.mockResolvedValue(1);

      const result = await service.list(1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('addLeads', () => {
    it('should add leads to campaign', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue({ id: 'c1' });
      mockPrisma.campaignLead.findMany.mockResolvedValue([]);
      mockPrisma.campaignLead.createMany.mockResolvedValue({ count: 2 });

      const result = await service.addLeads('c1', { leadIds: ['l1', 'l2'] });
      expect(result.added).toBe(2);
    });

    it('should skip already added leads', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue({ id: 'c1' });
      mockPrisma.campaignLead.findMany.mockResolvedValue([{ leadId: 'l1', campanhaId: 'c1' }]);
      mockPrisma.campaignLead.createMany.mockResolvedValue({ count: 1 });

      const result = await service.addLeads('c1', { leadIds: ['l1', 'l2'] });
      expect(result.added).toBe(1);
      expect(result.skipped).toBe(1);
    });
  });

  describe('delete', () => {
    it('should delete campaign and related data', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue({ id: 'c1' });
      mockPrisma.campaignLead.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.message.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.campaign.delete.mockResolvedValue({ id: 'c1' });

      await expect(service.delete('c1')).resolves.not.toThrow();
    });

    it('should throw for non-existent campaign', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(null);
      await expect(service.delete('inexistente')).rejects.toThrow(
        'Campanha inexistente não encontrada',
      );
    });
  });

  describe('schedule', () => {
    it('should schedule campaign leads', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue({ id: 'c1' });
      mockPrisma.campaignLead.updateMany.mockResolvedValue({ count: 10 });

      const result = await service.schedule('c1', '2026-07-01T10:00:00Z');
      expect(result.scheduledAt).toBe('2026-07-01T10:00:00.000Z');
    });

    it('should reject invalid date', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue({ id: 'c1' });

      await expect(service.schedule('c1', 'data-invalida')).rejects.toThrow(
        'Data de agendamento inválida',
      );
    });
  });
});
