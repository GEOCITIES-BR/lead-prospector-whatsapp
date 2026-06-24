import { DISPOSABLE_DOMAINS } from './enrichment.types.js';

export class EmailValidator {
  validate(email: string | null): { valido: boolean; score: number; mensagem: string } {
    if (!email || email.trim().length === 0) {
      return { valido: false, score: 0, mensagem: 'Email não informado' };
    }

    const trimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmed)) {
      return { valido: false, score: 0, mensagem: 'Formato de email inválido' };
    }

    if (trimmed.length > 254) {
      return { valido: false, score: 0, mensagem: 'Email muito longo (>254 caracteres)' };
    }

    const domain = trimmed.split('@')[1];
    if (!domain || domain.length > 253) {
      return { valido: false, score: 0, mensagem: 'Domínio inválido' };
    }

    if (DISPOSABLE_DOMAINS.includes(domain)) {
      return { valido: false, score: 1, mensagem: 'Domínio descartável detectado' };
    }

    const hasValidTld = this.validTld(domain);
    if (!hasValidTld) {
      return { valido: false, score: 0, mensagem: 'TLD não reconhecido' };
    }

    return { valido: true, score: 10, mensagem: 'Email válido' };
  }

  private validTld(domain: string): boolean {
    const parts = domain.split('.');
    const tld = parts[parts.length - 1];
    if (!tld || tld.length < 2) return false;

    const knownTlds = [
      'com',
      'com.br',
      'org',
      'net',
      'io',
      'co',
      'app',
      'dev',
      'br',
      'gov',
      'edu',
      'info',
      'biz',
      'me',
      'tv',
      'xyz',
      'pro',
      'tech',
      'cloud',
      'shop',
      'store',
      'online',
      'site',
    ];

    const fullDomainTld = parts.slice(-2).join('.');
    return knownTlds.includes(fullDomainTld) || knownTlds.includes(tld);
  }
}
