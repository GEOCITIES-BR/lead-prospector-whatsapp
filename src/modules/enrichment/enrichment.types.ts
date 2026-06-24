export interface ValidationResult {
  email: { valido: boolean; score: number; mensagem: string };
  telefone: { valido: boolean; score: number; mensagem: string };
  nome: { completo: boolean; score: number };
  empresa: { presente: boolean; score: number };
  cargo: { presente: boolean; score: number };
  linkedin: { presente: boolean; score: number };
}

export interface ScoreRule {
  name: string;
  weight: number;
  apply: (lead: EnrichmentLead) => number;
}

export interface ScoreConfig {
  completenessWeight: number;
  seniorityBonus: number;
  emailValidBonus: number;
  phoneValidBonus: number;
  linkedinBonus: number;
  sourceBonus: Record<string, number>;
}

export interface EnrichmentLead {
  id?: string;
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
}

export interface EnrichmentResult {
  leadId: string;
  validation: ValidationResult;
  score: number;
  dedup: DedupResult | null;
  enriched: boolean;
}

export interface DedupResult {
  matched: boolean;
  matchedLeadId: string | null;
  matchedBy: 'telefone' | 'email' | 'linkedin' | 'nome' | null;
  confidence: number;
}

export interface BatchEnrichmentInput {
  leadIds: string[];
}

export const DEFAULT_SCORE_CONFIG: ScoreConfig = {
  completenessWeight: 0.3,
  seniorityBonus: 15,
  emailValidBonus: 10,
  phoneValidBonus: 10,
  linkedinBonus: 5,
  sourceBonus: {
    google_business: 5,
    linkedin: 10,
  },
};

export const DISPOSABLE_DOMAINS = [
  'tempmail.com',
  'throwaway.com',
  'mailinator.com',
  'guerrillamail.com',
  'sharklasers.com',
  'yopmail.com',
  'trashmail.com',
  '10minutemail.com',
  'jetable.org',
  'mailsac.com',
  'spamgourmet.com',
  'dispostable.com',
  'mailnator.com',
  'getairmail.com',
  'temp-mail.org',
  'fakeinbox.com',
  'maildrop.cc',
  'burnermail.io',
  '20minutemail.com',
  'spambox.us',
];
