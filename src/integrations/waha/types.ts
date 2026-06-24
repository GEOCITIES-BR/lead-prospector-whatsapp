export interface WahaSession {
  name: string;
  status: 'STARTING' | 'SCAN_QR_CODE' | 'WORKING' | 'STOPPED' | 'ERROR';
  config?: Record<string, unknown>;
}

export interface WahaSendTextPayload {
  session: string;
  chatId: string;
  text: string;
}

export interface WahaSendImagePayload {
  session: string;
  chatId: string;
  image: string;
  caption?: string;
}

export interface WahaWebhookPayload {
  event: string;
  session: string;
  payload: {
    from: string;
    body: string;
    fromMe: boolean;
    timestamp: number;
  };
}

export interface WahaWebhookConfig {
  url: string;
  events: string[];
}
