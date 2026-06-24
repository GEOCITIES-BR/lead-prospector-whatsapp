export interface GoogleBusinessSearchInput {
  query: string;
  location: string;
  maxResults?: number;
}

export interface GoogleBusinessResult {
  nome: string;
  telefone: string | null;
  website: string | null;
  endereco: string | null;
  categoria: string | null;
  rating: number | null;
  totalReviews: number | null;
  horarioFuncionamento: string | null;
  origem: 'google_business';
}

export interface GoogleBusinessScraperConfig {
  headless?: boolean;
  rateLimitMs?: number;
  maxRetries?: number;
  timeoutMs?: number;
  maxResultsPerSearch?: number;
}
