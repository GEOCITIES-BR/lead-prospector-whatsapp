import { describe, it, expect } from 'vitest';
import { LeadScorer } from '../../src/modules/enrichment/lead-scorer.js';
import { EnrichmentLead, ValidationResult } from '../../src/modules/enrichment/enrichment.types.js';

const scorer = new LeadScorer();

function makeValidation(overrides: Partial<ValidationResult> = {}): ValidationResult {
  return {
    email: { valido: true, score: 10, mensagem: 'Email válido' },
    telefone: { valido: true, score: 10, mensagem: 'Telefone celular válido' },
    nome: { completo: true, score: 5 },
    empresa: { presente: true, score: 5 },
    cargo: { presente: true, score: 5 },
    linkedin: { presente: true, score: 5 },
    ...overrides,
  };
}

function makeLead(overrides: Partial<EnrichmentLead> = {}): EnrichmentLead {
  return {
    id: 'lead-1',
    nome: 'João Silva',
    empresa: 'TechCorp',
    cargo: 'Engenheiro de Software',
    telefone: '(11) 99999-9999',
    whatsapp: null,
    email: 'joao@techcorp.com',
    linkedin: 'https://linkedin.com/in/joao-silva',
    website: null,
    endereco: null,
    origem: 'linkedin',
    score: 0,
    ...overrides,
  };
}

describe('LeadScorer', () => {
  it('should calculate base score from completeness', () => {
    const score = scorer.calculateScore(makeLead(), makeValidation());
    expect(score).toBeGreaterThanOrEqual(20);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should give seniority bonus for CEO', () => {
    const lead = makeLead({ cargo: 'CEO' });
    const score = scorer.calculateScore(lead, makeValidation());
    const baseScore = scorer.calculateScore(makeLead({ cargo: 'Analista' }), makeValidation());
    expect(score).toBeGreaterThan(baseScore);
  });

  it('should give seniority bonus for Director', () => {
    const lead = makeLead({ cargo: 'Diretor de Marketing' });
    const score = scorer.calculateScore(lead, makeValidation());
    const baseScore = scorer.calculateScore(makeLead({ cargo: 'Assistente' }), makeValidation());
    expect(score).toBeGreaterThan(baseScore);
  });

  it('should add linkedin bonus', () => {
    const withLinkedin = scorer.calculateScore(makeLead(), makeValidation());
    const withoutLinkedin = scorer.calculateScore(makeLead({ linkedin: null }), makeValidation());
    expect(withLinkedin).toBeGreaterThan(withoutLinkedin);
  });

  it('should add source bonus for linkedin', () => {
    const linkedinLead = makeLead({ origem: 'linkedin' });
    const googleLead = makeLead({ origem: 'google_business' });
    const scoreLinkedin = scorer.calculateScore(linkedinLead, makeValidation());
    const scoreGoogle = scorer.calculateScore(googleLead, makeValidation());
    expect(scoreLinkedin).toBeGreaterThan(scoreGoogle);
  });

  it('should cap score at 100', () => {
    const fullLead = makeLead({
      nome: 'João Silva Santos',
      empresa: 'TechCorp Ltda',
      cargo: 'CEO',
      telefone: '(11) 99999-9999',
      email: 'joao@techcorp.com',
      linkedin: 'https://linkedin.com/in/joao-silva',
    });
    const score = scorer.calculateScore(fullLead, makeValidation());
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should not go below 0', () => {
    const emptyLead = makeLead({
      nome: null,
      empresa: null,
      cargo: null,
      telefone: null,
      email: null,
      linkedin: null,
    });
    const invalidValidation = makeValidation({
      email: { valido: false, score: 0, mensagem: 'invalido' },
      telefone: { valido: false, score: 0, mensagem: 'invalido' },
      nome: { completo: false, score: 0 },
      empresa: { presente: false, score: 0 },
      cargo: { presente: false, score: 0 },
      linkedin: { presente: false, score: 0 },
    });
    const score = scorer.calculateScore(emptyLead, invalidValidation);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});
