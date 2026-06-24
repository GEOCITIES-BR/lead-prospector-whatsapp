import {
  N8nSendMessagePayload,
  N8nScrapeGooglePayload,
  N8nScrapeLinkedinPayload,
  N8nEnrichLeadPayload,
  N8nCreateLeadPayload,
} from './n8n.types.js';
import { getPrismaClient } from '../../infra/database/prisma-client.js';
import { MessageService } from '../message/message.service.js';
import { WahaClient } from '../../integrations/waha/client.js';
import { getCurrentTenantId } from '../tenant/tenant.context.js';

export class N8nService {
  private messageService: MessageService;

  constructor() {
    const env = process.env as Record<string, string>;
    this.messageService = new MessageService({
      apiUrl: env.WAHA_API_URL || 'http://localhost:3002',
      apiKey: env.WAHA_API_KEY || '',
      sessionName: env.WAHA_SESSION_NAME || 'default',
    });
  }

  async handleSendMessage(payload: N8nSendMessagePayload) {
    if (!payload.leadId || !payload.conteudo) {
      return { success: false, error: 'leadId e conteudo são obrigatórios' };
    }

    return this.messageService.send({
      leadId: payload.leadId,
      conteudo: payload.conteudo,
      tipo: payload.tipo,
      imageUrl: payload.imageUrl,
    });
  }

  async handleScrapeGoogle(payload: N8nScrapeGooglePayload) {
    if (!payload.query || !payload.location) {
      return { success: false, error: 'query e location são obrigatórios' };
    }

    try {
      const { GoogleBusinessService } =
        await import('../scraping/google-business/google-business.service.js');
      const service = new GoogleBusinessService();
      const result = await service.searchAndSave({
        query: payload.query,
        location: payload.location,
        maxResults: payload.maxResults,
      });
      return { success: true, data: result.data, metadata: result.metadata };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  }

  async handleScrapeLinkedin(payload: N8nScrapeLinkedinPayload) {
    if (!payload.keyword) {
      return { success: false, error: 'keyword é obrigatório' };
    }

    try {
      const { LinkedInService } = await import('../scraping/linkedin/linkedin.service.js');
      const service = new LinkedInService();
      const result = await service.searchAndSave({
        keyword: payload.keyword,
        location: payload.location,
        company: payload.company,
        maxResults: payload.maxResults,
      });
      return { success: true, data: result.data, metadata: result.metadata };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  }

  async handleEnrichLead(payload: N8nEnrichLeadPayload) {
    if (!payload.leadId) {
      return { success: false, error: 'leadId é obrigatório' };
    }

    try {
      const { EnrichmentService } = await import('../enrichment/enrichment.service.js');
      const service = new EnrichmentService();
      const result = await service.enrichLead(payload.leadId);
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  }

  async handleCreateLead(payload: N8nCreateLeadPayload) {
    if (!payload.nome) {
      return { success: false, error: 'nome é obrigatório' };
    }

    try {
      const prisma = getPrismaClient();
      const lead = await prisma.lead.create({
        data: {
          nome: payload.nome,
          empresa: payload.empresa || null,
          cargo: payload.cargo || null,
          telefone: payload.telefone || null,
          email: payload.email || null,
          linkedin: payload.linkedin || null,
          origem: payload.origem || 'n8n',
          tenantId: getCurrentTenantId(),
        },
      });
      return { success: true, data: { id: lead.id } };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  }

  async configureWahaWebhooks(wahaApiUrl: string, wahaApiKey: string, n8nWebhookUrl: string) {
    try {
      const client = new WahaClient(wahaApiUrl, wahaApiKey);
      await client.setWebhook({
        url: `${n8nWebhookUrl}/api/n8n/webhooks/waha`,
        events: ['message', 'message.ack'],
      });
      return { success: true, message: 'Webhooks WAHA configurados' };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao configurar webhooks',
      };
    }
  }
}
