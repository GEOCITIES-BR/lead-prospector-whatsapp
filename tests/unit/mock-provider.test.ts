import { describe, it, expect, beforeEach } from 'vitest';
import { MockWhatsAppProvider } from '../../src/providers/whatsapp/mock.provider.js';

describe('MockWhatsAppProvider', () => {
  let provider: MockWhatsAppProvider;

  beforeEach(() => {
    provider = new MockWhatsAppProvider();
  });

  it('should start disconnected', async () => {
    const status = await provider.getSessionStatus();
    expect(status.connected).toBe(false);
  });

  it('should fail to send when disconnected', async () => {
    const result = await provider.sendText('5511999999999', 'teste');
    expect(result.success).toBe(false);
    expect(result.error).toBe('WhatsApp não conectado');
  });

  it('should connect successfully', async () => {
    await provider.connect();
    const status = await provider.getSessionStatus();
    expect(status.connected).toBe(true);
  });

  it('should send text after connecting', async () => {
    await provider.connect();
    const result = await provider.sendText('5511999999999', 'teste');
    expect(result.success).toBe(true);
    expect(result.messageId).toContain('mock_');
  });

  it('should send image after connecting', async () => {
    await provider.connect();
    const result = await provider.sendImage(
      '5511999999999',
      'https://example.com/img.jpg',
      'caption',
    );
    expect(result.success).toBe(true);
    expect(result.messageId).toContain('mock_img_');
  });

  it('should disconnect successfully', async () => {
    await provider.connect();
    await provider.disconnect();
    const status = await provider.getSessionStatus();
    expect(status.connected).toBe(false);
  });
});
