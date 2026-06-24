import { WahaClient } from '../../integrations/waha/client.js';
import { getPrismaClient } from '../../infra/database/prisma-client.js';
import { PrismaClient } from '@prisma/client';
import { WahaProviderConfig } from './waha.provider.js';

export interface WahaSessionInfo {
  sessionName: string;
  status: string;
  phone: string;
  qrcode: string | null;
}

export class WahaSessionManager {
  private client: WahaClient;
  private prisma: PrismaClient;
  private readonly config: WahaProviderConfig;

  constructor(config: WahaProviderConfig) {
    this.config = config;
    this.client = new WahaClient(config.apiUrl, config.apiKey);
    this.prisma = getPrismaClient();
  }

  async start(): Promise<WahaSessionInfo> {
    try {
      const session = await this.client.createSession(this.config.sessionName);
      const wahaStatus = session.status;

      await this.prisma.whatsAppSession.upsert({
        where: { sessionName: this.config.sessionName },
        create: {
          sessionName: this.config.sessionName,
          status: this.mapStatus(wahaStatus),
        },
        update: {
          status: this.mapStatus(wahaStatus),
        },
      });

      return {
        sessionName: this.config.sessionName,
        status: wahaStatus,
        phone: '',
        qrcode: null,
      };
    } catch (err) {
      await this.prisma.whatsAppSession.upsert({
        where: { sessionName: this.config.sessionName },
        create: {
          sessionName: this.config.sessionName,
          status: 'error',
        },
        update: {
          status: 'error',
        },
      });

      throw new Error(
        `Falha ao iniciar sessão: ${err instanceof Error ? err.message : 'desconhecido'}`,
      );
    }
  }

  async stop(): Promise<void> {
    try {
      await this.client.deleteSession(this.config.sessionName);
    } catch {
      // Ignore se já não existir
    }

    await this.prisma.whatsAppSession.upsert({
      where: { sessionName: this.config.sessionName },
      create: {
        sessionName: this.config.sessionName,
        status: 'disconnected',
      },
      update: {
        status: 'disconnected',
        qrcode: null,
      },
    });
  }

  async getStatus(): Promise<WahaSessionInfo> {
    try {
      const sessions = await this.client.getSessions();
      const session = sessions.find((s) => s.name === this.config.sessionName);

      const status = session?.status || 'STOPPED';

      const dbSession = await this.prisma.whatsAppSession.upsert({
        where: { sessionName: this.config.sessionName },
        create: {
          sessionName: this.config.sessionName,
          status: this.mapStatus(status),
        },
        update: {
          status: this.mapStatus(status),
        },
      });

      return {
        sessionName: this.config.sessionName,
        status,
        phone: dbSession.phone || '',
        qrcode: dbSession.qrcode,
      };
    } catch {
      const dbSession = await this.prisma.whatsAppSession.findUnique({
        where: { sessionName: this.config.sessionName },
      });

      return {
        sessionName: this.config.sessionName,
        status: 'STOPPED',
        phone: dbSession?.phone || '',
        qrcode: dbSession?.qrcode || null,
      };
    }
  }

  async getQrCode(): Promise<string> {
    try {
      const qrcode = await this.client.getSessionQrCode(this.config.sessionName);

      await this.prisma.whatsAppSession.upsert({
        where: { sessionName: this.config.sessionName },
        create: {
          sessionName: this.config.sessionName,
          status: 'connecting',
          qrcode,
        },
        update: {
          qrcode,
          status: 'connecting',
        },
      });

      return qrcode;
    } catch (err) {
      throw new Error(
        `Falha ao obter QR Code: ${err instanceof Error ? err.message : 'desconhecido'}`,
      );
    }
  }

  async fetchAndUpdateQrCode(): Promise<string | null> {
    try {
      return await this.getQrCode();
    } catch {
      return null;
    }
  }

  private mapStatus(wahaStatus: string): 'connecting' | 'connected' | 'disconnected' | 'error' {
    switch (wahaStatus) {
      case 'WORKING':
        return 'connected';
      case 'STARTING':
      case 'SCAN_QR_CODE':
        return 'connecting';
      case 'STOPPED':
        return 'disconnected';
      default:
        return 'error';
    }
  }
}
