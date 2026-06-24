import { load } from 'cheerio';
import { LinkedInProfileResult } from './linkedin.types.js';

export class LinkedInParser {
  parseSearchResults(html: string): LinkedInProfileResult[] {
    const $ = load(html);
    const results: LinkedInProfileResult[] = [];

    const $cards = $('.reusable-search__result-container');

    for (let i = 0; i < $cards.length; i++) {
      try {
        const card = $($cards[i] as any) as any;
        const parsed = this.parseSearchCard(card);
        if (parsed) {
          results.push(parsed);
        }
      } catch {
        // skip malformed card
      }
    }

    return results;
  }

  parseProfilePage(html: string): Partial<LinkedInProfileResult> {
    const $ = load(html);

    const $h1s = $('h1');
    const nome = $h1s.length > 0 ? ($($h1s[0] as any) as any).text().trim() : null;

    return {
      nome: nome || undefined,
      origem: 'linkedin',
    };
  }

  private parseSearchCard($card: any): LinkedInProfileResult | null {
    const linkEl = $card.find('a[href*="/in/"]').first();
    const linkedin = linkEl.attr('href') || null;
    const nome = linkEl.text().trim() || $card.find('.entity-result__title-text').text().trim();

    if (!nome) return null;

    const headline = $card.find('.entity-result__primary-subtitle').text().trim() || null;
    const subtitle = $card.find('.entity-result__secondary-subtitle').text().trim();

    const [cargo, empresa] = this.parseHeadline(headline, subtitle);

    const localizacao = $card.find('.entity-result__tertiary-subtitle').text().trim() || null;
    const conexao = $card.find('.entity-result__badge-text').text().trim() || null;

    return {
      nome,
      headline,
      empresa,
      cargo,
      linkedin: linkedin ? linkedin.split('?')[0] : null,
      localizacao,
      conexao,
      origem: 'linkedin',
    };
  }

  private parseHeadline(headline: string | null, subtitle: string): [string | null, string | null] {
    if (!headline) return [null, null];

    if (subtitle) {
      return [headline, subtitle];
    }

    const parts = headline.split(' na ');
    if (parts.length === 2) {
      return [parts[0].trim(), parts[1].trim()];
    }

    const partsEm = headline.split(' em ');
    if (partsEm.length === 2) {
      return [partsEm[0].trim(), partsEm[1].trim()];
    }

    return [headline, null];
  }
}
