import { WahaClient } from './client.js';
import { getPrismaClient } from '../../infra/database/prisma-client.js';
import { SendResult } from '../../shared/types/index.js';
import { getCurrentTenantId } from '../../modules/tenant/tenant.context.js';

export class WahaMessageService {
  constructor(
    private readonly wahaClient: WahaClient,
    private readonly sessionName: string = 'default',
  ) {}

  async sendText(leadId: string, phone: string, text: string): Promise<SendResult> {
    const prisma = getPrismaClient();

    try {
      const chatId = `${phone}@c.us`;

      const result = await this.wahaClient.sendText(this.sessionName, chatId, text);

      await prisma.message.create({
        data: {
          leadId: leadId,
          conteudo: text,
          status: 'sent',
          enviadaEm: new Date(),
          tenantId: getCurrentTenantId(),
        },
      });

      return { success: true, messageId: result.id };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';

      await prisma.message.create({
        data: {
          leadId: leadId,
          conteudo: text,
          status: 'failed',
          erro: errorMessage,
          tenantId: getCurrentTenantId(),
        },
      });

      return { success: false, error: errorMessage };
    }
  }

  async sendImage(
    leadId: string,
    phone: string,
    imageUrl: string,
    caption?: string,
  ): Promise<SendResult> {
    const prisma = getPrismaClient();

    try {
      const chatId = `${phone}@c.us`;

      const result = await this.wahaClient.sendImage(this.sessionName, chatId, imageUrl, caption);

      await prisma.message.create({
        data: {
          leadId: leadId,
          conteudo: caption || `[Imagem] ${imageUrl}`,
          status: 'sent',
          enviadaEm: new Date(),
          tenantId: getCurrentTenantId(),
        },
      });

      return { success: true, messageId: result.id };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';

      await prisma.message.create({
        data: {
          leadId: leadId,
          conteudo: caption || `[Imagem] ${imageUrl}`,
          status: 'failed',
          erro: errorMessage,
          tenantId: getCurrentTenantId(),
        },
      });

      return { success: false, error: errorMessage };
    }
  }
}
