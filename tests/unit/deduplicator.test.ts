import { describe, it, expect } from 'vitest';
import { Deduplicator } from '../../src/modules/enrichment/deduplicator.js';
import { EnrichmentLead } from '../../src/modules/enrichment/enrichment.types.js';

const dedup = new Deduplicator();

function makeLead(overrides: Partial<EnrichmentLead> = {}): EnrichmentLead {
  return {
    id: 'lead-1',
    nome: 'João Silva',
    empresa: 'TechCorp',
    cargo: 'Engenheiro',
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

describe('Deduplicator', () => {
  it('should return no match when no existing leads', async () => {
    const result = await dedup.dedup(makeLead(), []);
    expect(result.matched).toBe(false);
    expect(result.confidence).toBe(0);
  });

  it('should match by identical phone', async () => {
    const existing = [
      makeLead({ id: 'lead-2', telefone: '(11) 99999-9999', nome: 'João S. Silva' }),
    ];
    const result = await dedup.dedup(makeLead(), existing);
    expect(result.matched).toBe(true);
    expect(result.matchedBy).toBe('telefone');
    expect(result.confidence).toBe(0.95);
  });

  it('should match by phone suffix (last 8 digits)', async () => {
    const existing = [makeLead({ id: 'lead-2', telefone: '+55 11 99999-9999', nome: 'João S.' })];
    const result = await dedup.dedup(makeLead(), existing);
    expect(result.matched).toBe(true);
    expect(result.matchedBy).toBe('telefone');
  });

  it('should match by identical email', async () => {
    const existing = [
      makeLead({ id: 'lead-2', telefone: '(21) 88888-8888', email: 'joao@techcorp.com' }),
    ];
    const result = await dedup.dedup(makeLead(), existing);
    expect(result.matched).toBe(true);
    expect(result.matchedBy).toBe('email');
    expect(result.confidence).toBe(0.98);
  });

  it('should match by LinkedIn URL', async () => {
    const existing = [
      makeLead({
        id: 'lead-2',
        telefone: '(21) 88888-8888',
        email: null,
        linkedin: 'https://linkedin.com/in/joao-silva',
      }),
    ];
    const result = await dedup.dedup(makeLead(), existing);
    expect(result.matched).toBe(true);
    expect(result.matchedBy).toBe('linkedin');
    expect(result.confidence).toBe(0.99);
  });

  it('should not match different leads', async () => {
    const existing = [
      makeLead({
        id: 'lead-2',
        nome: 'Maria Souza',
        telefone: '(21) 88888-8888',
        email: 'maria@empresa.com',
        linkedin: 'https://linkedin.com/in/maria-souza',
      }),
    ];
    const result = await dedup.dedup(makeLead(), existing);
    expect(result.matched).toBe(false);
  });
});
