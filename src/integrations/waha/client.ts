import axios, { AxiosInstance } from 'axios';
import {
  WahaSession,
  WahaSendTextPayload,
  WahaSendImagePayload,
  WahaWebhookConfig,
} from './types.js';
import { ProviderError } from '../../shared/errors/index.js';

export class WahaClient {
  private client: AxiosInstance;

  constructor(baseUrl: string, apiKey: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      },
    });
  }

  async getSessions(): Promise<WahaSession[]> {
    try {
      const response = await this.client.get<WahaSession[]>('/api/sessions');
      return response.data;
    } catch (err) {
      throw new ProviderError('WAHA', `Erro ao listar sessões: ${this.extractError(err)}`);
    }
  }

  async createSession(name: string): Promise<WahaSession> {
    try {
      const response = await this.client.post<WahaSession>('/api/sessions', { name });
      return response.data;
    } catch (err) {
      throw new ProviderError('WAHA', `Erro ao criar sessão: ${this.extractError(err)}`);
    }
  }

  async getSessionQrCode(sessionName: string): Promise<string> {
    try {
      const response = await this.client.get(`/api/sessions/${sessionName}/qr`);
      return response.data.qrcode || response.data;
    } catch (err) {
      throw new ProviderError('WAHA', `Erro ao obter QR Code: ${this.extractError(err)}`);
    }
  }

  async deleteSession(sessionName: string): Promise<void> {
    try {
      await this.client.delete(`/api/sessions/${sessionName}`);
    } catch (err) {
      throw new ProviderError('WAHA', `Erro ao deletar sessão: ${this.extractError(err)}`);
    }
  }

  async sendText(session: string, chatId: string, text: string): Promise<{ id: string }> {
    try {
      const payload: WahaSendTextPayload = { session, chatId, text };
      const response = await this.client.post<{ id: string }>('/api/sendText', payload);
      return response.data;
    } catch (err) {
      throw new ProviderError('WAHA', `Erro ao enviar texto: ${this.extractError(err)}`);
    }
  }

  async sendImage(
    session: string,
    chatId: string,
    imageUrl: string,
    caption?: string,
  ): Promise<{ id: string }> {
    try {
      const payload: WahaSendImagePayload = { session, chatId, image: imageUrl, caption };
      const response = await this.client.post<{ id: string }>('/api/sendImage', payload);
      return response.data;
    } catch (err) {
      throw new ProviderError('WAHA', `Erro ao enviar imagem: ${this.extractError(err)}`);
    }
  }

  async setWebhook(config: WahaWebhookConfig): Promise<void> {
    try {
      await this.client.post('/api/webhooks', config);
    } catch (err) {
      throw new ProviderError('WAHA', `Erro ao configurar webhook: ${this.extractError(err)}`);
    }
  }

  private extractError(err: unknown): string {
    if (axios.isAxiosError(err)) {
      return err.response?.data?.message || err.message || 'Erro desconhecido';
    }
    if (err instanceof Error) {
      return err.message;
    }
    return String(err);
  }
}
