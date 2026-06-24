import { WahaClient } from './client.js';
import { WahaWebhookPayload } from './types.js';

export class WahaWebhookService {
  constructor(
    private readonly wahaClient: WahaClient,
    private readonly webhookBaseUrl: string,
  ) {}

  async registerWebhook(): Promise<void> {
    await this.wahaClient.setWebhook({
      url: `${this.webhookBaseUrl}/api/whatsapp/webhook`,
      events: ['message'],
    });
  }

  async handleWebhook(payload: WahaWebhookPayload): Promise<void> {
    if (payload.event === 'message') {
      const { from, body, timestamp } = payload.payload;
      console.log('[webhook] Mensagem recebida:', { from, body, timestamp });

      // TODO: processar mensagem recebida
      // 1. Identificar lead pelo telefone
      // 2. Registrar resposta
      // 3. Atualizar status da campanha
      // 4. Disparar automação n8n se configurado
    }
  }
}
