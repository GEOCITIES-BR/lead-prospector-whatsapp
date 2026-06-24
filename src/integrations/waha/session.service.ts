import { WahaClient } from './client.js';
import { getPrismaClient } from '../../infra/database/prisma-client.js';

export class WahaSessionService {
  constructor(private readonly wahaClient: WahaClient) {}

  async createSession(sessionName: string): Promise<{ qrcode: string }> {
    const prisma = getPrismaClient();

    const existing = await prisma.whatsAppSession.findUnique({
      where: { sessionName: sessionName },
    });

    if (existing) {
      throw new Error(`Sessão ${sessionName} já existe`);
    }

    await this.wahaClient.createSession(sessionName);

    const qrcode = await this.wahaClient.getSessionQrCode(sessionName);

    await prisma.whatsAppSession.create({
      data: {
        sessionName: sessionName,
        status: 'connecting',
        qrcode,
      },
    });

    return { qrcode };
  }

  async getSessionStatus(
    sessionName: string,
  ): Promise<{ connected: boolean; qrcode: string | null }> {
    const prisma = getPrismaClient();

    const session = await prisma.whatsAppSession.findUnique({
      where: { sessionName: sessionName },
    });

    if (!session) {
      return { connected: false, qrcode: null };
    }

    return {
      connected: session.status === 'connected',
      qrcode: session.qrcode,
    };
  }

  async listSessions() {
    const prisma = getPrismaClient();
    return prisma.whatsAppSession.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteSession(sessionName: string): Promise<void> {
    const prisma = getPrismaClient();

    await this.wahaClient.deleteSession(sessionName);

    await prisma.whatsAppSession.deleteMany({
      where: { sessionName: sessionName },
    });
  }
}
