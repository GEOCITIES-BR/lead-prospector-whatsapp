import puppeteer, { Browser, Page } from 'puppeteer';
import {
  LinkedInSearchInput,
  LinkedInProfileResult,
  LinkedInScraperConfig,
  LinkedInCredentials,
} from './linkedin.types.js';
import { LinkedInParser } from './linkedin.parser.js';
import { LinkedInSessionManager } from './linkedin.session.js';
import { RateLimiter } from '../rate-limiter.js';
import { Scraper, ScraperResult, ScraperError } from '../scraper.interface.js';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

export class LinkedInScraper implements Scraper<LinkedInSearchInput, LinkedInProfileResult> {
  private browser: Browser | null = null;
  private parser: LinkedInParser;
  private sessionManager: LinkedInSessionManager;
  private rateLimiter: RateLimiter;
  private readonly config: Required<LinkedInScraperConfig>;
  private credentials: LinkedInCredentials | null = null;

  constructor(config: LinkedInScraperConfig = {}) {
    this.parser = new LinkedInParser();
    this.sessionManager = new LinkedInSessionManager();
    this.config = {
      headless: config.headless ?? true,
      rateLimitMs: config.rateLimitMs ?? 3000,
      maxRetries: config.maxRetries ?? 3,
      timeoutMs: config.timeoutMs ?? 30000,
      maxResultsPerSearch: config.maxResultsPerSearch ?? 25,
      sessionFile: config.sessionFile ?? '',
    };
    this.rateLimiter = new RateLimiter(this.config.rateLimitMs, 1);
  }

  setCredentials(credentials: LinkedInCredentials): void {
    this.credentials = credentials;
  }

  validate(input: LinkedInSearchInput): boolean {
    if (!input.keyword || input.keyword.trim().length === 0) return false;
    if (input.maxResults !== undefined && (input.maxResults < 1 || input.maxResults > 100))
      return false;
    return true;
  }

  async scrape(input: LinkedInSearchInput): Promise<ScraperResult<LinkedInProfileResult>> {
    const startedAt = new Date();
    const errors: ScraperError[] = [];
    const results: LinkedInProfileResult[] = [];

    if (!this.validate(input)) {
      return {
        success: false,
        data: [],
        errors: [
          { source: 'validation', message: 'Parâmetros de busca inválidos', retryable: false },
        ],
        metadata: {
          totalFound: 0,
          totalScraped: 0,
          totalErrors: 1,
          startedAt,
          finishedAt: new Date(),
          durationMs: 0,
        },
      };
    }

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        await this.rateLimiter.waitIfNeeded();
        await this.ensureBrowser();

        const page = await this.createPage();

        try {
          if (this.credentials) {
            const loggedIn = await this.sessionManager.login(page, this.credentials);
            if (!loggedIn) {
              errors.push({
                source: 'linkedin_auth',
                message: 'Falha na autenticação',
                retryable: false,
              });
              break;
            }
          }

          const pageResults = await this.searchLinkedIn(page, input);
          results.push(...pageResults);
        } finally {
          await page.close();
        }

        break;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        const isRetryable = attempt < this.config.maxRetries - 1;

        errors.push({
          source: 'linkedin_scraper',
          message: errorMessage,
          retryable: isRetryable,
        });

        if (!isRetryable) break;

        const backoffMs = Math.pow(2, attempt) * 2000;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    const finishedAt = new Date();

    return {
      success: errors.length === 0 || errors.every((e) => e.retryable),
      data: results.slice(0, input.maxResults || this.config.maxResultsPerSearch),
      errors,
      metadata: {
        totalFound: results.length,
        totalScraped: results.length,
        totalErrors: errors.length,
        startedAt,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      },
    };
  }

  async destroy(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async ensureBrowser(): Promise<void> {
    if (!this.browser || !this.browser.connected) {
      this.browser = await puppeteer.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--window-size=1920,1080',
        ],
      });
    }
  }

  private async createPage(): Promise<Page> {
    const page = await this.browser!.newPage();
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setDefaultTimeout(this.config.timeoutMs);

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    });

    await page.evaluateOnNewDocument(() => {
      const nav = (globalThis as Record<string, any>).navigator;
      Object.defineProperty(nav, 'webdriver', { get: () => false });
      Object.defineProperty(nav, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(nav, 'languages', { get: () => ['pt-BR', 'pt', 'en'] });
    });

    return page;
  }

  private async searchLinkedIn(
    page: Page,
    input: LinkedInSearchInput,
  ): Promise<LinkedInProfileResult[]> {
    const params = new URLSearchParams({
      keywords: input.keyword,
      ...(input.location ? { locationUnion: input.location } : {}),
      ...(input.company ? { currentCompany: input.company } : {}),
    });

    const url = `https://www.linkedin.com/search/results/people/?${params.toString()}`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: this.config.timeoutMs });

    await this.randomDelay(2000, 4000);

    await page
      .waitForSelector('.reusable-search__result-container', { timeout: 10000 })
      .catch(() => {});

    await this.autoScroll(page);

    const html = await page.content();
    return this.parser.parseSearchResults(html);
  }

  private async autoScroll(page: Page): Promise<void> {
    const maxScrolls = 5;
    for (let i = 0; i < maxScrolls; i++) {
      await page.evaluate(() => {
        const w = globalThis as Record<string, any>;
        w.scrollBy(0, w.innerHeight);
      });
      await this.randomDelay(1500, 3000);
    }
  }

  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = min + Math.random() * (max - min);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
