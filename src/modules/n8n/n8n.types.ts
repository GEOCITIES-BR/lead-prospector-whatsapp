export interface N8nSendMessagePayload {
  leadId: string;
  conteudo: string;
  tipo?: 'text' | 'image';
  imageUrl?: string;
}

export interface N8nScrapeGooglePayload {
  query: string;
  location: string;
  maxResults?: number;
}

export interface N8nScrapeLinkedinPayload {
  keyword: string;
  location?: string;
  company?: string;
  maxResults?: number;
}

export interface N8nEnrichLeadPayload {
  leadId: string;
}

export interface N8nCreateLeadPayload {
  nome: string;
  empresa?: string;
  cargo?: string;
  telefone?: string;
  email?: string;
  linkedin?: string;
  origem?: string;
}

export interface N8nWebhookConfig {
  url: string;
  events: string[];
}

export const N8N_EVENTS = [
  'message.received',
  'message.sent',
  'message.failed',
  'lead.created',
  'lead.enriched',
  'campaign.executed',
] as const;

export type N8nEvent = (typeof N8N_EVENTS)[number];
