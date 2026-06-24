import { EnrichmentLead, DedupResult } from './enrichment.types.js';

export class Deduplicator {
  async dedup(lead: EnrichmentLead, existingLeads: EnrichmentLead[]): Promise<DedupResult> {
    if (existingLeads.length === 0) {
      return { matched: false, matchedLeadId: null, matchedBy: null, confidence: 0 };
    }

    for (const existing of existingLeads) {
      if (existing.id === lead.id) continue;

      if (lead.telefone && existing.telefone) {
        const cleanNew = lead.telefone.replace(/\D/g, '');
        const cleanExisting = existing.telefone.replace(/\D/g, '');
        if (cleanNew === cleanExisting || this.phoneOverlap(cleanNew, cleanExisting)) {
          return {
            matched: true,
            matchedLeadId: existing.id ?? null,
            matchedBy: 'telefone',
            confidence: 0.95,
          };
        }
      }

      if (
        lead.email &&
        existing.email &&
        lead.email.toLowerCase() === existing.email.toLowerCase()
      ) {
        return {
          matched: true,
          matchedLeadId: existing.id ?? null,
          matchedBy: 'email',
          confidence: 0.98,
        };
      }

      if (lead.linkedin && existing.linkedin) {
        const normNew = lead.linkedin.split('?')[0].replace(/\/$/, '');
        const normExisting = existing.linkedin.split('?')[0].replace(/\/$/, '');
        if (normNew.toLowerCase() === normExisting.toLowerCase()) {
          return {
            matched: true,
            matchedLeadId: existing.id ?? null,
            matchedBy: 'linkedin',
            confidence: 0.99,
          };
        }
      }

      if (lead.nome && existing.nome) {
        const score = this.fuzzyNameScore(lead.nome, existing.nome);
        if (score >= 0.85) {
          return {
            matched: true,
            matchedLeadId: existing.id ?? null,
            matchedBy: 'nome',
            confidence: score,
          };
        }
      }
    }

    return { matched: false, matchedLeadId: null, matchedBy: null, confidence: 0 };
  }

  private phoneOverlap(a: string, b: string): boolean {
    if (a.length < 8 || b.length < 8) return false;
    const suffixA = a.slice(-8);
    const suffixB = b.slice(-8);
    return suffixA === suffixB;
  }

  private fuzzyNameScore(name1: string, name2: string): number {
    const a = name1.toLowerCase().trim().replace(/\s+/g, ' ');
    const b = name2.toLowerCase().trim().replace(/\s+/g, ' ');

    if (a === b) return 1;
    if (a.includes(b) || b.includes(a)) return 0.9;

    const tokens1 = a.split(' ');
    const tokens2 = b.split(' ');

    if (tokens1.length < 2 || tokens2.length < 2) return 0;

    const firstNameMatch = tokens1[0] === tokens2[0] ? 0.4 : 0;
    if (firstNameMatch === 0) return 0;

    const set2 = new Set(tokens2);
    const commonTokens = tokens1.filter((t) => set2.has(t) && t.length > 2).length;

    const lastNameScore = commonTokens >= 1 ? 0.5 : 0;

    return firstNameMatch + lastNameScore;
  }
}
