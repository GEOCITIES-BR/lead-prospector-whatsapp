import puppeteer, { Browser, Page } from 'puppeteer';
import {
  GoogleBusinessSearchInput,
  GoogleBusinessResult,
  GoogleBusinessScraperConfig,
} from './google-business.types.js';
import { GoogleBusinessParser } from './google-business.parser.js';
import { RateLimiter } from '../rate-limiter.js';
import { Scraper, ScraperResult, ScraperError } from '../scraper.interface.js';

// Used inside Puppeteer evaluate context

export class GoogleBusinessScraper implements Scraper<
  GoogleBusinessSearchInput,
  GoogleBusinessResult
> {
  private browser: Browser | null = null;
  private parser: GoogleBusinessParser;
  private rateLimiter: RateLimiter;
  private readonly config: Required<GoogleBusinessScraperConfig>;

  constructor(config: GoogleBusinessScraperConfig = {}) {
    this.parser = new GoogleBusinessParser();
    this.config = {
      headless: config.headless ?? true,
      rateLimitMs: config.rateLimitMs ?? 2000,
      maxRetries: config.maxRetries ?? 3,
      timeoutMs: config.timeoutMs ?? 30000,
      maxResultsPerSearch: config.maxResultsPerSearch ?? 20,
    };
    this.rateLimiter = new RateLimiter(this.config.rateLimitMs, 1);
  }

  validate(input: GoogleBusinessSearchInput): boolean {
    if (!input.query || input.query.trim().length === 0) return false;
    if (!input.location || input.location.trim().length === 0) return false;
    if (input.maxResults !== undefined && (input.maxResults < 1 || input.maxResults > 100))
      return false;
    return true;
  }

  async scrape(input: GoogleBusinessSearchInput): Promise<ScraperResult<GoogleBusinessResult>> {
    const startedAt = new Date();
    const errors: ScraperError[] = [];
    const results: GoogleBusinessResult[] = [];

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

        const page = await this.browser!.newPage();
        await page.setDefaultTimeout(this.config.timeoutMs);
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        );

        try {
          const pageResults = await this.searchGoogleMaps(page, input);
          results.push(...pageResults);
        } finally {
          await page.close();
        }

        break;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        const isRetryable = attempt < this.config.maxRetries - 1;

        errors.push({
          source: 'google_business_scraper',
          message: errorMessage,
          retryable: isRetryable,
        });

        if (!isRetryable) break;

        const backoffMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    const finishedAt = new Date();

    return {
      success: errors.length === 0 || errors.some((e) => !e.retryable),
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
          '--window-size=1920,1080',
        ],
      });
    }
  }

  private async searchGoogleMaps(
    page: Page,
    input: GoogleBusinessSearchInput,
  ): Promise<GoogleBusinessResult[]> {
    const searchQuery = encodeURIComponent(`${input.query} ${input.location}`);
    const url = `https://www.google.com/maps/search/${searchQuery}`;

    await page.goto(url, { waitUntil: 'networkidle2', timeout: this.config.timeoutMs });

    await page.waitForSelector('[role="article"]', { timeout: 10000 }).catch(() => {});

    await this.autoScroll(page);

    const html = await page.content();

    const jsonLd = await this.extractJsonLd(page);

    const parsedResults = this.parser.parseFromHtml(html);
    const jsonLdResults = this.parser.parseFromJsonLd(jsonLd);

    const seen = new Set<string>();
    const allResults: GoogleBusinessResult[] = [];

    for (const result of [...parsedResults, ...jsonLdResults]) {
      const key = result.nome.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        allResults.push(result);
      }
    }

    return allResults;
  }

  private async autoScroll(page: Page): Promise<void> {
    const scrollFn = (): Promise<void> => {
      const scrollContainer: { scrollTop: number; scrollHeight: number } =
        (globalThis as any).document.querySelector('[role="feed"]') ||
        (globalThis as any).document.body;
      let prevHeight = 0;
      const maxScrolls = 10;
      return new Promise((resolve) => {
        const doScroll = (i: number): void => {
          if (i >= maxScrolls) {
            resolve();
            return;
          }
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
          setTimeout(() => {
            const newHeight = scrollContainer.scrollHeight;
            if (newHeight === prevHeight) {
              resolve();
              return;
            }
            prevHeight = newHeight;
            doScroll(i + 1);
          }, 1500);
        };
        doScroll(0);
      });
    };
    await page.evaluate(scrollFn);
  }

  private async extractJsonLd(page: Page): Promise<Record<string, unknown>[]> {
    const extractFn = (): Record<string, unknown>[] => {
      // @ts-expect-error - document is available in Puppeteer browser context
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      const results: Record<string, unknown>[] = [];
      scripts.forEach((script: any) => {
        try {
          const parsed = JSON.parse(script.textContent || '');
          if (Array.isArray(parsed)) {
            results.push(...parsed);
          } else {
            results.push(parsed);
          }
        } catch {
          // ignore malformed json-ld
        }
      });
      return results;
    };
    return page.evaluate(extractFn);
  }
}
