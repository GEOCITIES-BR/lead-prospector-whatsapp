import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  lead: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  campaignLead: {
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  consentLog: {
    create: vi.fn(),
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  conversao: {
    deleteMany: vi.fn(),
  },
  message: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
  $transaction: vi.fn((args: unknown[]) => Promise.all(args)),
};

vi.mock('../../src/infra/database/prisma-client.js', () => ({
  getPrismaClient: () => mockPrisma,
}));

import { LgpdService } from '../../src/modules/lgpd/lgpd.service.js';

const service = new LgpdService();

describe('LgpdService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('optOut', () => {
    it('should opt-out lead by phone', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue({ id: 'l1', status: 'new' });

      const result = await service.optOut({ telefone: '11999999999' });

      expect(result.success).toBe(true);
      expect(mockPrisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'opt_out' } }),
      );
      expect(mockPrisma.campaignLead.updateMany).toHaveBeenCalled();
      expect(mockPrisma.consentLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ leadId: 'l1', tipo: 'opt-out' }),
        }),
      );
    });

    it('should opt-out lead by email', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue({ id: 'l2' });

      const result = await service.optOut({ email: 'teste@test.com' });
      expect(result.success).toBe(true);
    });

    it('should reject without phone or email', async () => {
      const result = await service.optOut({});
      expect(result.success).toBe(false);
      expect(result.message).toContain('Informe telefone ou email');
    });

    it('should handle non-existent lead', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue(null);

      const result = await service.optOut({ telefone: '11999999999' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('não encontrado');
    });
  });

  describe('registerConsent', () => {
    it('should register consent', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l1' });

      const result = await service.registerConsent({ leadId: 'l1', aceito: true });
      expect(result.success).toBe(true);
      expect(mockPrisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'validated' } }),
      );
    });

    it('should register opt-out via consent revocation', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l1' });

      const result = await service.registerConsent({ leadId: 'l1', aceito: false });
      expect(result.success).toBe(true);
      expect(mockPrisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'opt_out' } }),
      );
    });

    it('should reject non-existent lead', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);

      const result = await service.registerConsent({ leadId: 'inexistente', aceito: true });
      expect(result.success).toBe(false);
    });
  });

  describe('deleteLead', () => {
    it('should delete lead and related data', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l1' });
      mockPrisma.$transaction.mockImplementation(async (txns: unknown[]) => {
        for (const t of txns as (() => Promise<unknown>)[]) {
          if (typeof t === 'function') await t();
        }
        return [];
      });

      mockPrisma.consentLog.deleteMany.mockResolvedValue({ count: 3 });
      mockPrisma.conversao.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.message.updateMany.mockResolvedValue({ count: 5 });
      mockPrisma.campaignLead.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.lead.delete.mockResolvedValue({ id: 'l1' });

      const result = await service.deleteLead('l1');
      expect(result.success).toBe(true);
    });

    it('should reject non-existent lead', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);

      const result = await service.deleteLead('inexistente');
      expect(result.success).toBe(false);
    });
  });

  describe('exportLead', () => {
    it('should export lead data', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: 'l1',
        nome: 'João',
        empresa: 'ACME',
        cargo: null,
        telefone: null,
        email: 'joao@acme.com',
        linkedin: null,
        origem: 'manual',
        score: 50,
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.message.findMany.mockResolvedValue([]);
      mockPrisma.consentLog.findMany.mockResolvedValue([]);

      const result = await service.exportLead('l1');
      expect(result.success).toBe(true);
      expect(result.data?.lead.nome).toBe('João');
    });

    it('should reject non-existent lead', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);

      const result = await service.exportLead('inexistente');
      expect(result.success).toBe(false);
    });
  });

  describe('getConsentHistory', () => {
    it('should return consent history', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l1' });
      mockPrisma.consentLog.findMany.mockResolvedValue([
        {
          id: 'cl1',
          leadId: 'l1',
          tipo: 'consent',
          descricao: 'Consentimento registrado',
          ip: '127.0.0.1',
          createdAt: new Date(),
        },
      ]);

      const result = await service.getConsentHistory('l1');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should reject non-existent lead', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);

      const result = await service.getConsentHistory('inexistente');
      expect(result.success).toBe(false);
    });
  });
});
