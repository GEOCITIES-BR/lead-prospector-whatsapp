import { describe, it, expect } from 'vitest';
import { GoogleBusinessParser } from '../../src/modules/scraping/google-business/google-business.parser.js';

describe('GoogleBusinessParser', () => {
  const parser = new GoogleBusinessParser();

  describe('parseFromJsonLd', () => {
    it('should parse valid LocalBusiness JSON-LD', () => {
      const jsonLd = [
        {
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: 'Empresa Exemplo Ltda',
          telephone: '(11) 99999-9999',
          url: 'https://exemplo.com.br',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Rua Exemplo, 123',
            addressLocality: 'São Paulo',
            addressRegion: 'SP',
            postalCode: '01001-000',
            addressCountry: 'BR',
          },
          aggregateRating: {
            ratingValue: 4.5,
            reviewCount: 120,
          },
        },
      ];

      const results = parser.parseFromJsonLd(jsonLd as unknown as Record<string, unknown>[]);

      expect(results).toHaveLength(1);
      expect(results[0].nome).toBe('Empresa Exemplo Ltda');
      expect(results[0].telefone).toBe('(11) 99999-9999');
      expect(results[0].website).toBe('https://exemplo.com.br');
      expect(results[0].endereco).toContain('Rua Exemplo');
      expect(results[0].rating).toBe(4.5);
      expect(results[0].totalReviews).toBe(120);
      expect(results[0].origem).toBe('google_business');
    });

    it('should skip non-LocalBusiness types', () => {
      const jsonLd = [
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Site Qualquer',
        },
      ];

      const results = parser.parseFromJsonLd(jsonLd as unknown as Record<string, unknown>[]);
      expect(results).toHaveLength(0);
    });

    it('should handle empty array', () => {
      const results = parser.parseFromJsonLd([]);
      expect(results).toHaveLength(0);
    });

    it('should handle missing optional fields', () => {
      const jsonLd = [
        {
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: 'Empresa Sem Telefone',
        },
      ];

      const results = parser.parseFromJsonLd(jsonLd as unknown as Record<string, unknown>[]);
      expect(results).toHaveLength(1);
      expect(results[0].nome).toBe('Empresa Sem Telefone');
      expect(results[0].telefone).toBeNull();
      expect(results[0].website).toBeNull();
      expect(results[0].endereco).toBeNull();
    });
  });

  describe('parseFromHtml', () => {
    it('should return empty array for HTML without business cards', () => {
      const html = '<html><body><div>Nada aqui</div></body></html>';
      const results = parser.parseFromHtml(html);
      expect(results).toHaveLength(0);
    });

    it('should extract business data from article elements', () => {
      const html = `
        <html>
        <body>
          <div role="article">
            <div role="heading">Padaria do Zé</div>
            <div>⭐⭐⭐⭐⭐ (50)</div>
            <a href="https://padariadoze.com.br">Website</a>
            <div>Rua das Flores, 100 - Centro, São Paulo - SP, 01001-000</div>
          </div>
          <div role="article">
            <div role="heading">Mercado Bom Preço</div>
            <div>⭐⭐⭐ (10)</div>
          </div>
        </body>
        </html>
      `;

      const results = parser.parseFromHtml(html);
      expect(results).toHaveLength(2);
      expect(results[0].nome).toBe('Padaria do Zé');
      expect(results[1].nome).toBe('Mercado Bom Preço');
    });
  });
});
