import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  lead: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  message: {
    create: vi.fn(),
    update: vi.fn(),
    findFirst: vi.fn(),
  },
  whatsAppSession: {
    upsert: vi.fn().mockResolvedValue({
      sessionName: 'test-session',
      status: 'connected',
      phone: '',
      qrcode: null,
    }),
    findUnique: vi.fn().mockResolvedValue(null),
  },
};

vi.mock('../../src/infra/database/prisma-client.js', () => ({
  getPrismaClient: () => mockPrisma,
}));

vi.mock('../../src/integrations/waha/client.js', () => ({
  WahaClient: vi.fn().mockImplementation(() => ({
    getSessions: vi.fn().mockResolvedValue([{ name: 'test-session', status: 'WORKING' }]),
    createSession: vi.fn().mockResolvedValue({ name: 'test-session', status: 'WORKING' }),
    deleteSession: vi.fn().mockResolvedValue(undefined),
    sendText: vi.fn().mockResolvedValue({ id: 'waha_msg_123' }),
    sendImage: vi.fn().mockResolvedValue({ id: 'waha_img_456' }),
    getSessionQrCode: vi.fn().mockResolvedValue('data:image/png;base64,qrcode_data'),
    setWebhook: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { MessageService } from '../../src/modules/message/message.service.js';

describe('MessageService', () => {
  let service: MessageService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MessageService({
      apiUrl: 'http://localhost:3002',
      apiKey: 'test-key',
      sessionName: 'test-session',
    });
  });

  it('should return error for missing lead', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(null);
    const result = await service.send({
      leadId: 'inexistente',
      conteudo: 'teste',
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Lead não encontrado');
  });

  it('should start session', async () => {
    const result = await service.startSession();
    expect(result.sessionName).toBe('test-session');
    expect(result.status).toBe('WORKING');
  });

  it('should stop session without error', async () => {
    await expect(service.stopSession()).resolves.not.toThrow();
  });

  it('should get session status', async () => {
    const result = await service.getSessionStatus();
    expect(result.sessionName).toBe('test-session');
  });

  it('should get QR code', async () => {
    const qrcode = await service.getQrCode();
    expect(qrcode).toContain('qrcode');
  });

  it('should return error for opt-out lead', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'lead-optout',
      nome: 'Maria',
      telefone: '(11) 88888-8888',
      status: 'opt_out',
    });

    const result = await service.send({
      leadId: 'lead-optout',
      conteudo: 'teste',
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('opt-out');
  });

  it('should send text message for existing lead with phone', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'lead-1',
      nome: 'João',
      telefone: '(11) 99999-9999',
      whatsapp: null,
      status: 'new',
    });
    mockPrisma.message.create.mockResolvedValue({ id: 'msg-1' });
    mockPrisma.message.update.mockResolvedValue({ id: 'msg-1' });
    mockPrisma.lead.update.mockResolvedValue({ id: 'lead-1' });

    const result = await service.send({
      leadId: 'lead-1',
      conteudo: 'Olá, tudo bem?',
    });
    expect(result.success).toBe(true);
    expect(result.messageId).toBe('waha_msg_123');
  });
});
