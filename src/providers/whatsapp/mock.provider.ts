import { WhatsAppProvider } from './whatsapp.provider';
import { SendResult, SessionStatusInfo } from '../../shared/types';

export class MockWhatsAppProvider implements WhatsAppProvider {
  private connected = false;

  async sendText(phone: string, message: string): Promise<SendResult> {
    if (!this.connected) {
      return { success: false, error: 'WhatsApp não conectado' };
    }

    console.log('[MockWhatsApp] Enviando texto:', { phone, message });
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    };
  }

  async sendImage(phone: string, imageUrl: string, caption?: string): Promise<SendResult> {
    if (!this.connected) {
      return { success: false, error: 'WhatsApp não conectado' };
    }

    console.log('[MockWhatsApp] Enviando imagem:', { phone, imageUrl, caption });
    return {
      success: true,
      messageId: `mock_img_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    };
  }

  async getSessionStatus(): Promise<SessionStatusInfo> {
    return {
      connected: this.connected,
      sessionName: 'mock-session',
      phone: '5511999999999',
    };
  }

  async getQRCode(): Promise<string> {
    return 'mock_qr_code_data';
  }

  async connect(): Promise<void> {
    this.connected = true;
    console.log('[MockWhatsApp] Conectado.');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log('[MockWhatsApp] Desconectado.');
  }
}
