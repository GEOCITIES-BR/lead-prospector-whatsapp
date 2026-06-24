export interface OptOutInput {
  telefone?: string;
  email?: string;
  motivo?: string;
}

export interface ConsentInput {
  leadId: string;
  aceito: boolean;
  ip?: string;
}

export interface ConsentLogEntry {
  id: string;
  leadId: string;
  tipo: string;
  descricao: string | null;
  ip: string | null;
  createdAt: Date;
}

export interface LeadExport {
  lead: {
    id: string;
    nome: string | null;
    empresa: string | null;
    cargo: string | null;
    telefone: string | null;
    email: string | null;
    linkedin: string | null;
    origem: string | null;
    score: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
  mensagens: Array<{
    id: string;
    conteudo: string;
    status: string;
    enviadaEm: Date | null;
  }>;
  consentimento: ConsentLogEntry[];
}
