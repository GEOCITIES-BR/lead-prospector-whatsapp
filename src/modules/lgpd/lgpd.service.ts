import { getPrismaClient } from '../../infra/database/prisma-client.js';
import { OptOutInput, ConsentInput, LeadExport, ConsentLogEntry } from './lgpd.types.js';

export class LgpdService {
  async optOut(input: OptOutInput): Promise<{ success: boolean; message: string }> {
    if (!input.telefone && !input.email) {
      return { success: false, message: 'Informe telefone ou email para opt-out' };
    }

    const prisma = getPrismaClient();

    const where = input.telefone ? { telefone: input.telefone } : { email: input.email };

    const lead = await prisma.lead.findFirst({ where });

    if (!lead) {
      return { success: false, message: 'Lead não encontrado' };
    }

    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'opt_out' },
    });

    await prisma.campaignLead.updateMany({
      where: { leadId: lead.id, status: { in: ['pending', 'scheduled'] } },
      data: { status: 'opted_out' },
    });

    await prisma.consentLog.create({
      data: {
        leadId: lead.id,
        tipo: 'opt-out',
        descricao: input.motivo || null,
      },
    });

    return { success: true, message: 'Opt-out registrado com sucesso' };
  }

  async registerConsent(input: ConsentInput): Promise<{ success: boolean; message: string }> {
    const prisma = getPrismaClient();

    const lead = await prisma.lead.findUnique({ where: { id: input.leadId } });

    if (!lead) {
      return { success: false, message: 'Lead não encontrado' };
    }

    const newStatus = input.aceito ? 'validated' : 'opt_out';

    await prisma.lead.update({
      where: { id: input.leadId },
      data: { status: newStatus },
    });

    await prisma.consentLog.create({
      data: {
        leadId: input.leadId,
        tipo: input.aceito ? 'consent' : 'opt-out',
        descricao: input.aceito ? 'Consentimento registrado' : 'Consentimento revogado',
        ip: input.ip || null,
      },
    });

    return {
      success: true,
      message: input.aceito ? 'Consentimento registrado' : 'Opt-out registrado',
    };
  }

  async deleteLead(leadId: string): Promise<{ success: boolean; message: string }> {
    const prisma = getPrismaClient();

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });

    if (!lead) {
      return { success: false, message: 'Lead não encontrado' };
    }

    await prisma.$transaction([
      prisma.consentLog.deleteMany({ where: { leadId } }),
      prisma.conversao.deleteMany({ where: { leadId } }),
      prisma.message.updateMany({ where: { leadId }, data: { leadId: 'deleted' } }),
      prisma.campaignLead.deleteMany({ where: { leadId } }),
      prisma.lead.delete({ where: { id: leadId } }),
    ]);

    return { success: true, message: 'Lead e dados associados removidos' };
  }

  async exportLead(
    leadId: string,
  ): Promise<{ success: boolean; data?: LeadExport; message?: string }> {
    const prisma = getPrismaClient();

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return { success: false, message: 'Lead não encontrado' };
    }

    const mensagens = await prisma.message.findMany({
      where: { leadId },
      select: { id: true, conteudo: true, status: true, enviadaEm: true },
    });

    const consentimento = await prisma.consentLog.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: {
        lead: {
          id: lead.id,
          nome: lead.nome,
          empresa: lead.empresa,
          cargo: lead.cargo,
          telefone: lead.telefone,
          email: lead.email,
          linkedin: lead.linkedin,
          origem: lead.origem,
          score: lead.score,
          status: lead.status,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
        },
        mensagens,
        consentimento,
      },
    };
  }

  async getConsentHistory(
    leadId: string,
  ): Promise<{ success: boolean; data?: ConsentLogEntry[]; message?: string }> {
    const prisma = getPrismaClient();

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });

    if (!lead) {
      return { success: false, message: 'Lead não encontrado' };
    }

    const logs = await prisma.consentLog.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: logs };
  }
}
