import { WhatsAppProvider } from '../../providers/whatsapp/whatsapp.provider.js';
import {
  WahaWhatsAppProvider,
  WahaProviderConfig,
} from '../../providers/whatsapp/waha.provider.js';
import { WahaSessionManager } from '../../providers/whatsapp/waha-session.js';
import { getPrismaClient } from '../../infra/database/prisma-client.js';
import { getCurrentTenantId } from '../tenant/tenant.context.js';

export interface SendMessageInput {
  leadId: string;
  conteudo: string;
  tipo?: 'text' | 'image';
  imageUrl?: string;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class MessageService {
  private provider: WhatsAppProvider;
  private sessionManager: WahaSessionManager;

  constructor(config: WahaProviderConfig) {
    this.provider = new WahaWhatsAppProvider(config);
    this.sessionManager = new WahaSessionManager(config);
  }

  async send(input: SendMessageInput): Promise<SendMessageResult> {
    const prisma = getPrismaClient();

    try {
      const lead = await prisma.lead.findUnique({ where: { id: input.leadId } });
      if (!lead) {
        return { success: false, error: 'Lead não encontrado' };
      }

      if (lead.status === 'opt_out') {
        return { success: false, error: 'Lead opt-out: não é permitido enviar mensagens' };
      }

      const phone = lead.whatsapp || lead.telefone;
      if (!phone) {
        return { success: false, error: 'Lead não possui telefone cadastrado' };
      }

      const cleanedPhone = phone.replace(/\D/g, '');

      const dbMessage = await prisma.message.create({
        data: {
          leadId: input.leadId,
          conteudo: input.conteudo,
          status: 'pending',
          tenantId: getCurrentTenantId(),
        },
      });

      let sendResult;
      if (input.tipo === 'image' && input.imageUrl) {
        sendResult = await this.provider.sendImage(cleanedPhone, input.imageUrl, input.conteudo);
      } else {
        sendResult = await this.provider.sendText(cleanedPhone, input.conteudo);
      }

      if (sendResult.success) {
        await prisma.message.update({
          where: { id: dbMessage.id },
          data: {
            status: 'sent',
            enviadaEm: new Date(),
          },
        });

        await prisma.lead.update({
          where: { id: input.leadId },
          data: { status: 'contacted' },
        });

        return { success: true, messageId: sendResult.messageId };
      }

      await prisma.message.update({
        where: { id: dbMessage.id },
        data: {
          status: 'failed',
          erro: sendResult.error || 'Erro desconhecido',
        },
      });

      return { success: false, error: sendResult.error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar mensagem';

      try {
        const failedMessage = await prisma.message.findFirst({
          where: { leadId: input.leadId, conteudo: input.conteudo, status: 'pending' },
          orderBy: { id: 'desc' },
        });

        if (failedMessage) {
          await prisma.message.update({
            where: { id: failedMessage.id },
            data: { status: 'failed', erro: errorMessage },
          });
        }
      } catch {
        // silent
      }

      return { success: false, error: errorMessage };
    }
  }

  async getSessionStatus() {
    return this.sessionManager.getStatus();
  }

  async startSession() {
    return this.sessionManager.start();
  }

  async stopSession() {
    return this.sessionManager.stop();
  }

  async getQrCode() {
    return this.sessionManager.getQrCode();
  }
}
