export interface Lead {
  id: string;
  nome: string | null;
  empresa: string | null;
  cargo: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  linkedin: string | null;
  website: string | null;
  endereco: string | null;
  origem: string | null;
  score: number;
  status: LeadStatus;
  created_at: Date;
  updated_at: Date;
}

export type LeadStatus =
  | 'new'
  | 'validated'
  | 'contacted'
  | 'responded'
  | 'converted'
  | 'unqualified'
  | 'opt_out';

export interface Campaign {
  id: string;
  nome: string;
  template: string;
  status: CampaignStatus;
  config: CampaignConfig | null;
  created_at: Date;
  updated_at: Date;
}

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface CampaignConfig {
  delayBetweenMessages: number;
  followUpDelay: number;
  maxFollowUps: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: number[];
}

export interface Message {
  id: string;
  lead_id: string;
  campaign_id: string | null;
  conteudo: string;
  status: MessageStatus;
  enviada_em: Date | null;
  lida_em: Date | null;
  erro: string | null;
}

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Conversao {
  id: string;
  lead_id: string;
  valor: number;
  data: Date;
  descricao: string | null;
}

export interface WhatsAppSession {
  id: string;
  session_name: string;
  phone: string;
  status: SessionStatus;
  qrcode: string | null;
  created_at: Date;
  updated_at: Date;
}

export type SessionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface SessionStatusInfo {
  connected: boolean;
  sessionName: string;
  phone: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface ScrapedLead {
  nome: string | null;
  telefone: string | null;
  website: string | null;
  endereco: string | null;
  categoria: string | null;
  origem: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
