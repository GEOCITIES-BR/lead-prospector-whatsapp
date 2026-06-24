export interface ScraperConfig {
  rateLimitMs: number;
  maxRetries: number;
  timeoutMs: number;
}

export interface ScraperResult<T> {
  success: boolean;
  data: T[];
  errors: ScraperError[];
  metadata: ScraperMetadata;
}

export interface ScraperError {
  source: string;
  message: string;
  retryable: boolean;
}

export interface ScraperMetadata {
  totalFound: number;
  totalScraped: number;
  totalErrors: number;
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
}

export interface Scraper<TInput, TOutput> {
  scrape(input: TInput): Promise<ScraperResult<TOutput>>;
  validate(input: TInput): boolean;
}
