import { describe, it, expect } from 'vitest';
import { GoogleBusinessScraper } from '../../src/modules/scraping/google-business/google-business.scraper.js';

describe('GoogleBusinessScraper', () => {
  let scraper: GoogleBusinessScraper;

  beforeEach(() => {
    scraper = new GoogleBusinessScraper({ headless: true, maxRetries: 1, timeoutMs: 5000 });
  });

  afterEach(async () => {
    await scraper.destroy();
  });

  describe('validate', () => {
    it('should reject empty query', () => {
      expect(scraper.validate({ query: '', location: 'São Paulo' })).toBe(false);
    });

    it('should reject empty location', () => {
      expect(scraper.validate({ query: 'padaria', location: '' })).toBe(false);
    });

    it('should reject maxResults out of range', () => {
      expect(scraper.validate({ query: 'padaria', location: 'SP', maxResults: 0 })).toBe(false);
      expect(scraper.validate({ query: 'padaria', location: 'SP', maxResults: 101 })).toBe(false);
    });

    it('should accept valid input', () => {
      expect(scraper.validate({ query: 'padaria', location: 'São Paulo' })).toBe(true);
      expect(scraper.validate({ query: 'padaria', location: 'SP', maxResults: 50 })).toBe(true);
    });
  });

  describe('scrape', () => {
    it('should return error result for invalid input', async () => {
      const result = await scraper.scrape({ query: '', location: '' });
      expect(result.success).toBe(false);
      expect(result.data).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].source).toBe('validation');
    });

    it('should return metadata with timing info for invalid input', async () => {
      const result = await scraper.scrape({ query: '', location: '' });
      expect(result.metadata.totalFound).toBe(0);
      expect(result.metadata.totalErrors).toBe(1);
      expect(result.metadata.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata.startedAt).toBeInstanceOf(Date);
      expect(result.metadata.finishedAt).toBeInstanceOf(Date);
    });
  });
});
