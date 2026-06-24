import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  lead: {
    create: vi.fn(),
  },
};

vi.mock('../../src/infra/database/prisma-client.js', () => ({
  getPrismaClient: () => mockPrisma,
}));

const mockMessageService = {
  send: vi.fn(),
};

vi.mock('../../src/modules/message/message.service.js', () => ({
  MessageService: vi.fn(() => mockMessageService),
}));

const mockGoogleService = {
  searchAndSave: vi.fn(),
};

const mockLinkedinService = {
  searchAndSave: vi.fn(),
};

const mockEnrichmentService = {
  enrichLead: vi.fn(),
};

vi.mock('../../src/modules/scraping/google-business/google-business.service.js', () => ({
  GoogleBusinessService: vi.fn(() => mockGoogleService),
}));

vi.mock('../../src/modules/scraping/linkedin/linkedin.service.js', () => ({
  LinkedInService: vi.fn(() => mockLinkedinService),
}));

vi.mock('../../src/modules/enrichment/enrichment.service.js', () => ({
  EnrichmentService: vi.fn(() => mockEnrichmentService),
}));

import { N8nService } from '../../src/modules/n8n/n8n.service.js';

const service = new N8nService();

describe('N8nService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleSendMessage', () => {
    it('should send a message', async () => {
      mockMessageService.send.mockResolvedValue({ success: true, data: { id: 'm1' } });

      const result = await service.handleSendMessage({
        leadId: 'l1',
        conteudo: 'Hello',
      });

      expect(result.success).toBe(true);
      expect(mockMessageService.send).toHaveBeenCalledWith({
        leadId: 'l1',
        conteudo: 'Hello',
        tipo: undefined,
        imageUrl: undefined,
      });
    });

    it('should reject missing fields', async () => {
      const result = await service.handleSendMessage({
        leadId: '',
        conteudo: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('obrigatórios');
    });
  });

  describe('handleScrapeGoogle', () => {
    it('should scrape Google', async () => {
      mockGoogleService.searchAndSave.mockResolvedValue({
        data: [{ nome: 'Empresa A' }],
        metadata: { total: 1 },
      });

      const result = await service.handleScrapeGoogle({
        query: 'restaurante',
        location: 'São Paulo',
        maxResults: 5,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should reject missing fields', async () => {
      const result = await service.handleScrapeGoogle({
        query: '',
        location: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('obrigatórios');
    });

    it('should handle service errors', async () => {
      mockGoogleService.searchAndSave.mockRejectedValue(new Error('Erro no scraping'));

      const result = await service.handleScrapeGoogle({
        query: 'restaurante',
        location: 'São Paulo',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro no scraping');
    });
  });

  describe('handleScrapeLinkedin', () => {
    it('should scrape LinkedIn', async () => {
      mockLinkedinService.searchAndSave.mockResolvedValue({
        data: [{ nome: 'João Silva' }],
        metadata: { total: 1 },
      });

      const result = await service.handleScrapeLinkedin({
        keyword: 'engenheiro',
        location: 'Brasil',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should reject missing keyword', async () => {
      const result = await service.handleScrapeLinkedin({ keyword: '' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('obrigatório');
    });
  });

  describe('handleEnrichLead', () => {
    it('should enrich a lead', async () => {
      mockEnrichmentService.enrichLead.mockResolvedValue({
        score: 85,
        validacoes: { emailValido: true },
      });

      const result = await service.handleEnrichLead({ leadId: 'l1' });
      expect(result.success).toBe(true);
      expect(result.data.score).toBe(85);
    });

    it('should reject missing leadId', async () => {
      const result = await service.handleEnrichLead({ leadId: '' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('obrigatório');
    });
  });

  describe('handleCreateLead', () => {
    it('should create a lead', async () => {
      mockPrisma.lead.create.mockResolvedValue({ id: 'l1' });

      const result = await service.handleCreateLead({
        nome: 'Maria',
        empresa: 'ACME',
        origem: 'n8n',
      });

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('l1');
      expect(mockPrisma.lead.create).toHaveBeenCalledWith({
        data: {
          nome: 'Maria',
          empresa: 'ACME',
          cargo: null,
          telefone: null,
          email: null,
          linkedin: null,
          origem: 'n8n',
          tenantId: 'default',
        },
      });
    });

    it('should reject missing nome', async () => {
      const result = await service.handleCreateLead({ nome: '' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('obrigatório');
    });
  });
});
