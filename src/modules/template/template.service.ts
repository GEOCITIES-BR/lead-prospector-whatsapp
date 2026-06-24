import { TemplateInput, TemplateUpdateInput, TemplatePreviewInput } from './template.types.js';
import { getPrismaClient } from '../../infra/database/prisma-client.js';
import { getCurrentTenantId } from '../tenant/tenant.context.js';

export class TemplateService {
  async create(input: TemplateInput): Promise<{ id: string }> {
    const prisma = getPrismaClient();

    if (!input.nome || input.nome.trim().length === 0) {
      throw new Error('Nome do template é obrigatório');
    }
    if (!input.conteudo || input.conteudo.trim().length === 0) {
      throw new Error('Conteúdo do template é obrigatório');
    }

    const extractedVars = this.extractVariaveis(input.conteudo);
    const mergedVars = [...new Set([...extractedVars, ...(input.variaveis || [])])];

    const template = await prisma.template.create({
      data: {
        nome: input.nome.trim(),
        conteudo: input.conteudo.trim(),
        variaveis: mergedVars,
        tenantId: getCurrentTenantId(),
      },
    });

    return { id: template.id };
  }

  async update(id: string, input: TemplateUpdateInput): Promise<void> {
    const prisma = getPrismaClient();

    const existing = await prisma.template.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Template ${id} não encontrado`);
    }

    const conteudo = input.conteudo ?? existing.conteudo;
    const variaveis = input.variaveis ?? existing.variaveis;
    const extractedVars = this.extractVariaveis(conteudo);
    const mergedVars = [...new Set([...extractedVars, ...variaveis])];

    await prisma.template.update({
      where: { id },
      data: {
        ...(input.nome !== undefined ? { nome: input.nome.trim() } : {}),
        ...(input.conteudo !== undefined ? { conteudo: input.conteudo.trim() } : {}),
        variaveis: mergedVars,
      },
    });
  }

  async delete(id: string): Promise<void> {
    const prisma = getPrismaClient();

    const existing = await prisma.template.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Template ${id} não encontrado`);
    }

    await prisma.template.delete({ where: { id } });
  }

  async getById(id: string) {
    const prisma = getPrismaClient();
    const template = await prisma.template.findUnique({ where: { id } });

    if (!template) {
      throw new Error(`Template ${id} não encontrado`);
    }

    return template;
  }

  async list(page = 1, limit = 20) {
    const prisma = getPrismaClient();

    const [data, total] = await Promise.all([
      prisma.template.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.template.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  preview(input: TemplatePreviewInput): string {
    if (!input.conteudo) return '';

    let result = input.conteudo;

    for (const [key, value] of Object.entries(input.dados)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
      result = result.replace(regex, value || '');
    }

    result = result.replace(/\{\{\s*\w+\s*\}\}/g, '');

    return result.trim();
  }

  apply(templateId: string, leadId: string): Promise<string> {
    return this.applyTemplate(templateId, leadId);
  }

  async applyTemplate(templateId: string, leadId: string): Promise<string> {
    const prisma = getPrismaClient();

    const [template, lead] = await Promise.all([
      prisma.template.findUnique({ where: { id: templateId } }),
      prisma.lead.findUnique({ where: { id: leadId } }),
    ]);

    if (!template) {
      throw new Error(`Template ${templateId} não encontrado`);
    }
    if (!lead) {
      throw new Error(`Lead ${leadId} não encontrado`);
    }

    return this.preview({
      conteudo: template.conteudo,
      dados: {
        nome: lead.nome || '',
        empresa: lead.empresa || '',
        cargo: lead.cargo || '',
        telefone: lead.telefone || '',
        email: lead.email || '',
        linkedin: lead.linkedin || '',
        origem: lead.origem || '',
        score: String(lead.score || ''),
      },
    });
  }

  extractVariaveis(conteudo: string): string[] {
    const regex = /\{\{\s*(\w+)\s*\}\}/g;
    const vars: string[] = [];
    let match;
    while ((match = regex.exec(conteudo)) !== null) {
      const varName = match[1].trim();
      if (varName && !vars.includes(varName)) {
        vars.push(varName);
      }
    }
    return vars;
  }
}
