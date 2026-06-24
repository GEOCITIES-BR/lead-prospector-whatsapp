import {
  CreateCampaignInput,
  UpdateCampaignInput,
  AddLeadsInput,
  DEFAULT_CAMPAIGN_CONFIG,
} from './campaign.types.js';
import { getPrismaClient } from '../../infra/database/prisma-client.js';
import { TemplateService } from '../template/template.service.js';
import { MessageService } from '../message/message.service.js';
import { getCurrentTenantId } from '../tenant/tenant.context.js';

export class CampaignService {
  private templateService: TemplateService;

  constructor() {
    this.templateService = new TemplateService();
  }

  async create(input: CreateCampaignInput) {
    const prisma = getPrismaClient();

    if (!input.nome || input.nome.trim().length === 0) {
      throw new Error('Nome da campanha é obrigatório');
    }
    if (!input.templateId) {
      throw new Error('templateId é obrigatório');
    }

    const template = await prisma.template.findUnique({ where: { id: input.templateId } });
    if (!template) {
      throw new Error(`Template ${input.templateId} não encontrado`);
    }

    const campaign = await prisma.campaign.create({
      data: {
        nome: input.nome.trim(),
        templateId: input.templateId,
        config: (input.config || DEFAULT_CAMPAIGN_CONFIG) as any,
        tenantId: getCurrentTenantId(),
      },
    });

    return campaign;
  }

  async update(id: string, input: UpdateCampaignInput) {
    const prisma = getPrismaClient();

    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Campanha ${id} não encontrada`);
    }

    if (input.templateId) {
      const template = await prisma.template.findUnique({ where: { id: input.templateId } });
      if (!template) {
        throw new Error(`Template ${input.templateId} não encontrado`);
      }
    }

    const data: Record<string, unknown> = {};
    if (input.nome !== undefined) data.nome = input.nome.trim();
    if (input.templateId !== undefined) data.templateId = input.templateId;
    if (input.config !== undefined) data.config = input.config as any;

    const campaign = await prisma.campaign.update({ where: { id }, data });
    return campaign;
  }

  async delete(id: string) {
    const prisma = getPrismaClient();

    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Campanha ${id} não encontrada`);
    }

    await prisma.campaignLead.deleteMany({ where: { campaignId: id } });
    await prisma.message.updateMany({ where: { campanhaId: id }, data: { campanhaId: null } });
    await prisma.campaign.delete({ where: { id } });
  }

  async getById(id: string) {
    const prisma = getPrismaClient();

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { template: true, _count: { select: { leads: true, mensagens: true } } },
    });

    if (!campaign) {
      throw new Error(`Campanha ${id} não encontrada`);
    }

    return campaign;
  }

  async list(page = 1, limit = 20) {
    const prisma = getPrismaClient();

    const [data, total] = await Promise.all([
      prisma.campaign.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { leads: true, mensagens: true } } },
      }),
      prisma.campaign.count(),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async addLeads(campaignId: string, input: AddLeadsInput) {
    const prisma = getPrismaClient();

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      throw new Error(`Campanha ${campaignId} não encontrada`);
    }

    const existing = await prisma.campaignLead.findMany({
      where: { campaignId, leadId: { in: input.leadIds } },
    });
    const existingIds = new Set(existing.map((cl) => cl.leadId));

    const toCreate = input.leadIds
      .filter((id) => !existingIds.has(id))
      .map((leadId) => ({ leadId, campaignId }));

    if (toCreate.length > 0) {
      await prisma.campaignLead.createMany({ data: toCreate });
    }

    return { added: toCreate.length, skipped: input.leadIds.length - toCreate.length };
  }

  async removeLead(campaignId: string, leadId: string) {
    const prisma = getPrismaClient();

    await prisma.campaignLead.delete({
      where: { leadId_campaignId: { leadId, campaignId } },
    });
  }

  async listLeads(campaignId: string, page = 1, limit = 20) {
    const prisma = getPrismaClient();

    const [data, total] = await Promise.all([
      prisma.campaignLead.findMany({
        where: { campaignId },
        skip: (page - 1) * limit,
        take: limit,
        include: { lead: true },
        orderBy: { lead: { nome: 'asc' } },
      }),
      prisma.campaignLead.count({ where: { campaignId } }),
    ]);

    return {
      data: data.map((cl) => ({
        ...cl.lead,
        campaignStatus: cl.status,
        scheduledAt: cl.scheduledAt,
        sentAt: cl.sentAt,
        erro: cl.erro,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async execute(campaignId: string, messageService: MessageService) {
    const prisma = getPrismaClient();

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { template: true },
    });

    if (!campaign) throw new Error(`Campanha ${campaignId} não encontrada`);
    if (!campaign.template) throw new Error(`Campanha ${campaignId} não possui template`);

    const pendingLeads = await prisma.campaignLead.findMany({
      where: { campaignId, status: 'pending' },
      include: { lead: true },
      take: 50,
    });

    if (pendingLeads.length === 0) {
      return { sent: 0, failed: 0, total: 0, message: 'Nenhum lead pendente' };
    }

    let sent = 0;
    let failed = 0;

    for (const cl of pendingLeads) {
      try {
        const conteudo = await this.templateService.applyTemplate(campaign.template.id, cl.lead.id);

        const result = await messageService.send({
          leadId: cl.lead.id,
          conteudo,
        });

        if (result.success) {
          await prisma.campaignLead.update({
            where: { leadId_campaignId: { leadId: cl.lead.id, campaignId } },
            data: { status: 'sent', sentAt: new Date() },
          });
          sent++;
        } else {
          await prisma.campaignLead.update({
            where: { leadId_campaignId: { leadId: cl.lead.id, campaignId } },
            data: { status: 'failed', erro: result.error },
          });
          failed++;
        }
      } catch (err) {
        await prisma.campaignLead.update({
          where: { leadId_campaignId: { leadId: cl.lead.id, campaignId } },
          data: {
            status: 'failed',
            erro: err instanceof Error ? err.message : 'Erro desconhecido',
          },
        });
        failed++;
      }
    }

    return { sent, failed, total: pendingLeads.length };
  }

  async schedule(campaignId: string, scheduledAt: string) {
    const prisma = getPrismaClient();

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new Error(`Campanha ${campaignId} não encontrada`);

    const date = new Date(scheduledAt);
    if (isNaN(date.getTime())) {
      throw new Error('Data de agendamento inválida');
    }

    await prisma.campaignLead.updateMany({
      where: { campaignId, status: 'pending' },
      data: { status: 'scheduled', scheduledAt: date },
    });

    return { scheduledAt: date.toISOString(), count: 0 };
  }
}
