import { SendResult, SessionStatusInfo } from '../../shared/types';

export interface WhatsAppProvider {
  sendText(phone: string, message: string): Promise<SendResult>;
  sendImage(phone: string, imageUrl: string, caption?: string): Promise<SendResult>;
  getSessionStatus(): Promise<SessionStatusInfo>;
  getQRCode(): Promise<string>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
