import { WhatsAppProvider } from './whatsapp.provider.js';
import { SendResult, SessionStatusInfo } from '../../shared/types/index.js';
import { WahaClient } from '../../integrations/waha/client.js';

export interface WahaProviderConfig {
  apiUrl: string;
  apiKey: string;
  sessionName: string;
}

export class WahaWhatsAppProvider implements WhatsAppProvider {
  private client: WahaClient;
  private readonly sessionName: string;

  constructor(config: WahaProviderConfig) {
    this.client = new WahaClient(config.apiUrl, config.apiKey);
    this.sessionName = config.sessionName;
  }

  async sendText(phone: string, message: string): Promise<SendResult> {
    try {
      const chatId = `${phone}@c.us`;
      const result = await this.client.sendText(this.sessionName, chatId, message);
      return { success: true, messageId: result.id };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar mensagem';
      return { success: false, error: errorMessage };
    }
  }

  async sendImage(phone: string, imageUrl: string, caption?: string): Promise<SendResult> {
    try {
      const chatId = `${phone}@c.us`;
      const result = await this.client.sendImage(this.sessionName, chatId, imageUrl, caption);
      return { success: true, messageId: result.id };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar imagem';
      return { success: false, error: errorMessage };
    }
  }

  async getSessionStatus(): Promise<SessionStatusInfo> {
    try {
      const sessions = await this.client.getSessions();
      const session = sessions.find((s) => s.name === this.sessionName);

      return {
        connected: session?.status === 'WORKING',
        sessionName: this.sessionName,
        phone: '',
      };
    } catch {
      return {
        connected: false,
        sessionName: this.sessionName,
        phone: '',
      };
    }
  }

  async getQRCode(): Promise<string> {
    try {
      return await this.client.getSessionQrCode(this.sessionName);
    } catch (err) {
      throw new Error(
        `Erro ao obter QR Code: ${err instanceof Error ? err.message : 'desconhecido'}`,
      );
    }
  }

  async connect(): Promise<void> {
    try {
      await this.client.createSession(this.sessionName);
    } catch (err) {
      throw new Error(`Erro ao conectar: ${err instanceof Error ? err.message : 'desconhecido'}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.deleteSession(this.sessionName);
    } catch (err) {
      throw new Error(
        `Erro ao desconectar: ${err instanceof Error ? err.message : 'desconhecido'}`,
      );
    }
  }
}
