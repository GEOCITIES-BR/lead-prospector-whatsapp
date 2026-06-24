import { describe, it, expect, vi } from 'vitest';
import { LinkedInScraper } from '../../src/modules/scraping/linkedin/linkedin.scraper.js';

describe('LinkedInScraper', () => {
  let scraper: LinkedInScraper;

  beforeEach(() => {
    scraper = new LinkedInScraper({ headless: true, maxRetries: 1, timeoutMs: 5000 });
  });

  afterEach(async () => {
    await scraper.destroy();
  });

  describe('validate', () => {
    it('should reject empty keyword', () => {
      expect(scraper.validate({ keyword: '' })).toBe(false);
    });

    it('should reject whitespace-only keyword', () => {
      expect(scraper.validate({ keyword: '   ' })).toBe(false);
    });

    it('should reject maxResults out of lower range', () => {
      expect(scraper.validate({ keyword: 'engenheiro', maxResults: 0 })).toBe(false);
    });

    it('should reject maxResults out of upper range', () => {
      expect(scraper.validate({ keyword: 'engenheiro', maxResults: 101 })).toBe(false);
    });

    it('should accept valid keyword only', () => {
      expect(scraper.validate({ keyword: 'engenheiro de software' })).toBe(true);
    });

    it('should accept input with all optional fields', () => {
      expect(
        scraper.validate({
          keyword: 'engenheiro',
          location: 'São Paulo',
          company: 'Google',
          maxResults: 10,
        }),
      ).toBe(true);
    });
  });

  describe('scrape', () => {
    it('should return error result for invalid input', async () => {
      const result = await scraper.scrape({ keyword: '' });
      expect(result.success).toBe(false);
      expect(result.data).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].source).toBe('validation');
    });

    it('should return metadata with timing info for invalid input', async () => {
      const result = await scraper.scrape({ keyword: '' });
      expect(result.metadata.totalFound).toBe(0);
      expect(result.metadata.totalErrors).toBe(1);
      expect(result.metadata.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata.startedAt).toBeInstanceOf(Date);
      expect(result.metadata.finishedAt).toBeInstanceOf(Date);
    });
  });
});
