export interface LinkedInSearchInput {
  keyword: string;
  location?: string;
  company?: string;
  maxResults?: number;
}

export interface LinkedInProfileResult {
  nome: string;
  headline: string | null;
  empresa: string | null;
  cargo: string | null;
  linkedin: string | null;
  localizacao: string | null;
  conexao: string | null;
  origem: 'linkedin';
}

export interface LinkedInScraperConfig {
  headless?: boolean;
  rateLimitMs?: number;
  maxRetries?: number;
  timeoutMs?: number;
  maxResultsPerSearch?: number;
  sessionFile?: string;
}

export interface LinkedInCredentials {
  email: string;
  password: string;
}
