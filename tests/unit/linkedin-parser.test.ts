import { describe, it, expect } from 'vitest';
import { LinkedInParser } from '../../src/modules/scraping/linkedin/linkedin.parser.js';

const parser = new LinkedInParser();

describe('LinkedInParser', () => {
  describe('parseSearchResults', () => {
    it('should extract profile data from search result cards', () => {
      const html = `<!DOCTYPE html><html><body>
        <div class="reusable-search__result-container">
          <div class="entity-result__title-text">
            <a href="https://www.linkedin.com/in/joao-silva-123456">João Silva</a>
          </div>
          <div class="entity-result__primary-subtitle">Engenheiro de Software na TechCorp</div>
          <div class="entity-result__secondary-subtitle">TechCorp</div>
          <div class="entity-result__tertiary-subtitle">São Paulo, Brasil</div>
          <div class="entity-result__badge-text">2º grau</div>
        </div>
        <div class="reusable-search__result-container">
          <div class="entity-result__title-text">
            <a href="https://www.linkedin.com/in/maria-souza-789012">Maria Souza</a>
          </div>
          <div class="entity-result__primary-subtitle">Product Manager</div>
          <div class="entity-result__tertiary-subtitle">Rio de Janeiro, Brasil</div>
        </div>
      </body></html>`;

      const results = parser.parseSearchResults(html);

      expect(results).toHaveLength(2);
      expect(results[0].nome).toBe('João Silva');
      expect(results[0].cargo).toBe('Engenheiro de Software na TechCorp');
      expect(results[0].empresa).toBe('TechCorp');
      expect(results[0].linkedin).toBe('https://www.linkedin.com/in/joao-silva-123456');
      expect(results[0].localizacao).toBe('São Paulo, Brasil');
      expect(results[0].conexao).toBe('2º grau');
      expect(results[0].origem).toBe('linkedin');
    });

    it('should handle missing optional fields', () => {
      const html = `<!DOCTYPE html><html><body>
        <div class="reusable-search__result-container">
          <div class="entity-result__title-text">
            <a href="https://www.linkedin.com/in/pedro-alves">Pedro Alves</a>
          </div>
        </div>
      </body></html>`;

      const results = parser.parseSearchResults(html);
      expect(results).toHaveLength(1);
      expect(results[0].nome).toBe('Pedro Alves');
      expect(results[0].cargo).toBeNull();
      expect(results[0].empresa).toBeNull();
      expect(results[0].localizacao).toBeNull();
      expect(results[0].conexao).toBeNull();
    });

    it('should skip cards without name', () => {
      const html = `<!DOCTYPE html><html><body>
        <div class="reusable-search__result-container">
          <span>No link here</span>
        </div>
      </body></html>`;

      const results = parser.parseSearchResults(html);
      expect(results).toHaveLength(0);
    });

    it('should remove query params from profile URLs', () => {
      const html = `<!DOCTYPE html><html><body>
        <div class="reusable-search__result-container">
          <div class="entity-result__title-text">
            <a href="https://www.linkedin.com/in/ana-beatriz-123?ref=search">Ana Beatriz</a>
          </div>
        </div>
      </body></html>`;

      const results = parser.parseSearchResults(html);
      expect(results).toHaveLength(1);
      expect(results[0].linkedin).toBe('https://www.linkedin.com/in/ana-beatriz-123');
    });

    it('should return empty array for HTML without result containers', () => {
      const html = '<html><body><div>no results</div></body></html>';
      const results = parser.parseSearchResults(html);
      expect(results).toHaveLength(0);
    });
  });

  describe('parseHeadline', () => {
    it('should extract cargo and empresa from "na" pattern', () => {
      const [cargo, empresa] = (parser as any).parseHeadline('Software Engineer na Google', '');
      expect(cargo).toBe('Software Engineer');
      expect(empresa).toBe('Google');
    });

    it('should extract cargo and empresa from "em" pattern', () => {
      const [cargo, empresa] = (parser as any).parseHeadline('Analista em XP Inc', '');
      expect(cargo).toBe('Analista');
      expect(empresa).toBe('XP Inc');
    });

    it('should use subtitle as empresa when available', () => {
      const [cargo, empresa] = (parser as any).parseHeadline('CTO', 'Minha Empresa Ltda');
      expect(cargo).toBe('CTO');
      expect(empresa).toBe('Minha Empresa Ltda');
    });

    it('should return null for empty headline', () => {
      const [cargo, empresa] = (parser as any).parseHeadline(null, '');
      expect(cargo).toBeNull();
      expect(empresa).toBeNull();
    });
  });
});
