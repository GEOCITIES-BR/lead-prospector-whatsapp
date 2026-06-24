import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  template: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  lead: {
    findUnique: vi.fn(),
  },
};

vi.mock('../../src/infra/database/prisma-client.js', () => ({
  getPrismaClient: () => mockPrisma,
}));

import { TemplateService } from '../../src/modules/template/template.service.js';

const service = new TemplateService();

describe('TemplateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractVariaveis', () => {
    it('should extract variables from template content', () => {
      const vars = service.extractVariaveis('Olá {{nome}}, sua empresa {{empresa}} nos contratou');
      expect(vars).toEqual(['nome', 'empresa']);
    });

    it('should handle no variables', () => {
      const vars = service.extractVariaveis('Mensagem sem variáveis');
      expect(vars).toEqual([]);
    });

    it('should deduplicate repeated variables', () => {
      const vars = service.extractVariaveis('{{nome}} {{nome}} {{empresa}}');
      expect(vars).toEqual(['nome', 'empresa']);
    });

    it('should handle whitespace inside brackets', () => {
      const vars = service.extractVariaveis('{{  nome  }}');
      expect(vars).toEqual(['nome']);
    });
  });

  describe('preview', () => {
    it('should replace variables with provided data', () => {
      const result = service.preview({
        conteudo: 'Olá {{nome}}, tudo bem?',
        dados: { nome: 'João' },
      });
      expect(result).toBe('Olá João, tudo bem?');
    });

    it('should replace multiple variables', () => {
      const result = service.preview({
        conteudo: '{{nome}} trabalha na {{empresa}} como {{cargo}}',
        dados: { nome: 'Maria', empresa: 'TechCorp', cargo: 'Engenheira' },
      });
      expect(result).toBe('Maria trabalha na TechCorp como Engenheira');
    });

    it('should remove unreplaced variables', () => {
      const result = service.preview({
        conteudo: 'Olá {{nome}}, sua empresa {{empresa}}',
        dados: { nome: 'João' },
      });
      expect(result).toBe('Olá João, sua empresa');
    });

    it('should return empty for empty content', () => {
      const result = service.preview({ conteudo: '', dados: {} });
      expect(result).toBe('');
    });
  });

  describe('create', () => {
    it('should create a template', async () => {
      mockPrisma.template.create.mockResolvedValue({ id: 'template-1' });

      const result = await service.create({
        nome: 'Boas Vindas',
        conteudo: 'Olá {{nome}}, bem-vindo!',
        variaveis: [],
      });

      expect(result.id).toBe('template-1');
      expect(mockPrisma.template.create).toHaveBeenCalledWith({
        data: {
          nome: 'Boas Vindas',
          conteudo: 'Olá {{nome}}, bem-vindo!',
          variaveis: ['nome'],
          tenantId: 'default',
        },
      });
    });

    it('should reject empty nome', async () => {
      await expect(service.create({ nome: '', conteudo: 'teste', variaveis: [] })).rejects.toThrow(
        'Nome do template é obrigatório',
      );
    });

    it('should reject empty conteudo', async () => {
      await expect(service.create({ nome: 'Teste', conteudo: '', variaveis: [] })).rejects.toThrow(
        'Conteúdo do template é obrigatório',
      );
    });
  });

  describe('list', () => {
    it('should list templates with pagination', async () => {
      mockPrisma.template.findMany.mockResolvedValue([{ id: 't1', nome: 'Template 1' }]);
      mockPrisma.template.count.mockResolvedValue(1);

      const result = await service.list(1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('getById', () => {
    it('should return template by id', async () => {
      mockPrisma.template.findUnique.mockResolvedValue({ id: 't1', nome: 'Teste' });

      const result = await service.getById('t1');
      expect(result.id).toBe('t1');
    });

    it('should throw for non-existent template', async () => {
      mockPrisma.template.findUnique.mockResolvedValue(null);

      await expect(service.getById('inexistente')).rejects.toThrow(
        'Template inexistente não encontrado',
      );
    });
  });

  describe('applyTemplate', () => {
    it('should apply template with lead data', async () => {
      mockPrisma.template.findUnique.mockResolvedValue({
        id: 't1',
        conteudo: 'Olá {{nome}} da {{empresa}}!',
      });
      mockPrisma.lead.findUnique.mockResolvedValue({
        nome: 'João Silva',
        empresa: 'TechCorp',
        cargo: null,
        telefone: null,
        email: null,
        linkedin: null,
        origem: null,
        score: 0,
      });

      const result = await service.applyTemplate('t1', 'lead-1');
      expect(result).toBe('Olá João Silva da TechCorp!');
    });

    it('should throw if template not found', async () => {
      mockPrisma.template.findUnique.mockResolvedValue(null);

      await expect(service.applyTemplate('inexistente', 'lead-1')).rejects.toThrow(
        'Template inexistente não encontrado',
      );
    });
  });
});
