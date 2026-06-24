import {
  EnrichmentLead,
  ScoreConfig,
  ValidationResult,
  DEFAULT_SCORE_CONFIG,
} from './enrichment.types.js';

const SENIORITY_KEYWORDS: Record<string, number> = {
  ceo: 20,
  cfo: 20,
  cto: 20,
  coo: 20,
  cmo: 20,
  diretor: 15,
  director: 15,
  vp: 15,
  'vice-presidente': 15,
  gerente: 10,
  manager: 10,
  head: 12,
  coordenador: 8,
  coordinator: 8,
  analista: 5,
  analyst: 5,
  assistente: 3,
  assistant: 3,
  estagiário: 1,
  intern: 1,
  trainee: 2,
  proprietário: 18,
  owner: 18,
  founder: 20,
  fundador: 20,
  sócio: 18,
  partner: 18,
};

export class LeadScorer {
  private config: ScoreConfig;

  constructor(config: ScoreConfig = DEFAULT_SCORE_CONFIG) {
    this.config = config;
  }

  calculateScore(lead: EnrichmentLead, validation: ValidationResult): number {
    let score = lead.score || 0;

    score += this.completenessScore(lead);
    score += this.seniorityScore(lead);
    score += validation.email.score;
    score += validation.telefone.score;

    if (lead.linkedin) score += this.config.linkedinBonus;

    if (lead.origem && this.config.sourceBonus[lead.origem]) {
      score += this.config.sourceBonus[lead.origem];
    }

    return Math.min(Math.max(Math.round(score), 0), 100);
  }

  private completenessScore(lead: EnrichmentLead): number {
    const fields = [lead.nome, lead.email, lead.telefone, lead.empresa, lead.cargo];
    const filled = fields.filter(
      (f) => f !== null && f !== undefined && f.trim().length > 0,
    ).length;
    const ratio = filled / fields.length;
    return Math.round(ratio * 30);
  }

  private seniorityScore(lead: EnrichmentLead): number {
    if (!lead.cargo) return 0;

    const cargo = lead.cargo.toLowerCase();
    const tokens = cargo.split(/[\s,]+/);

    for (const token of tokens) {
      if (SENIORITY_KEYWORDS[token]) {
        return SENIORITY_KEYWORDS[token];
      }
    }

    for (const [keyword, value] of Object.entries(SENIORITY_KEYWORDS)) {
      if (cargo.includes(keyword)) {
        return value;
      }
    }

    return 0;
  }
}
