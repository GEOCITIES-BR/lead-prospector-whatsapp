import { load } from 'cheerio';
import { GoogleBusinessResult } from './google-business.types.js';

export class GoogleBusinessParser {
  parseFromHtml(html: string): GoogleBusinessResult[] {
    const $ = load(html);
    const results: GoogleBusinessResult[] = [];

    const $cards = $('[role="article"]');

    for (let i = 0; i < $cards.length; i++) {
      try {
        const card = $($cards[i] as any) as any;
        const parsed = this.parseCard(card);
        if (parsed) {
          results.push(parsed);
        }
      } catch {
        // skip malformed card
      }
    }

    return results;
  }

  parseFromJsonLd(jsonLd: Record<string, unknown>[]): GoogleBusinessResult[] {
    const results: GoogleBusinessResult[] = [];

    for (const item of jsonLd) {
      if (item['@type'] !== 'LocalBusiness' && item['@type'] !== 'Organization') continue;

      results.push({
        nome: String(item.name || ''),
        telefone: item.telephone ? String(item.telephone) : null,
        website: item.url ? String(item.url) : null,
        endereco: item.address ? this.parseAddress(item.address as Record<string, unknown>) : null,
        categoria: String(item['@type'] || ''),
        rating: item.aggregateRating
          ? Number((item.aggregateRating as Record<string, unknown>).ratingValue) || null
          : null,
        totalReviews: item.aggregateRating
          ? Number((item.aggregateRating as Record<string, unknown>).reviewCount) || null
          : null,
        horarioFuncionamento: null,
        origem: 'google_business',
      });
    }

    return results;
  }

  private parseCard($card: any): GoogleBusinessResult | null {
    const nome = $card.find('[role="heading"]').first().text().trim();

    if (!nome) return null;

    return {
      nome,
      telefone: this.extractPhone($card),
      website: this.extractWebsite($card),
      endereco: this.extractAddress($card),
      categoria: null,
      rating: this.extractRating($card).value,
      totalReviews: this.extractRating($card).count,
      horarioFuncionamento: null,
      origem: 'google_business',
    };
  }

  private extractPhone($card: any): string | null {
    const text = $card.text();
    const phoneRegex = /(?:\+?\d{1,3}[-\s]?)?\(?\d{2,3}\)?[-\s]?\d{4,5}[-\s]?\d{4}/;
    const match = text.match(phoneRegex);
    return match ? match[0].trim() : null;
  }

  private extractWebsite($card: any): string | null {
    const link = $card.find('a[href*="http"]').first();
    const href = link.attr('href');
    if (!href) return null;
    try {
      const url = new URL(href);
      return url.origin;
    } catch {
      return href;
    }
  }

  private extractAddress($card: any): string | null {
    const text = $card.text();
    const addressIndicators = [',', 'Rua', 'Avenida', 'Av.', 'Praça', 'Travessa'];
    const lines: string[] = text
      .split('\n')
      .map((l: string) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      for (const indicator of addressIndicators) {
        if (line.includes(indicator) && /\d{5}/.test(line)) {
          return line;
        }
      }
    }

    return null;
  }

  private extractRating($card: any): { value: number | null; count: number | null } {
    const text = $card.text();
    const ratingMatch = text.match(/(\d[,.]\d)\s*\((\d+)\)/);
    if (ratingMatch) {
      return {
        value: parseFloat(ratingMatch[1].replace(',', '.')),
        count: parseInt(ratingMatch[2], 10),
      };
    }
    return { value: null, count: null };
  }

  private parseAddress(address: Record<string, unknown>): string | null {
    if (typeof address.streetAddress === 'string') {
      return [
        address.streetAddress,
        address.addressLocality,
        address.addressRegion,
        address.postalCode,
        address.addressCountry,
      ]
        .filter(Boolean)
        .join(', ');
    }
    return address.name ? String(address.name) : null;
  }
}
