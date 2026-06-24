import { EmailValidator } from './email-validator.js';
import { PhoneValidator } from './phone-validator.js';
import { Deduplicator } from './deduplicator.js';
import { LeadScorer } from './lead-scorer.js';
import {
  EnrichmentLead,
  ValidationResult,
  DedupResult,
  EnrichmentResult,
  ScoreConfig,
} from './enrichment.types.js';
import { getPrismaClient } from '../../infra/database/prisma-client.js';

export class EnrichmentService {
  private emailValidator: EmailValidator;
  private phoneValidator: PhoneValidator;
  private deduplicator: Deduplicator;
  private scorer: LeadScorer;

  constructor(config?: ScoreConfig) {
    this.emailValidator = new EmailValidator();
    this.phoneValidator = new PhoneValidator();
    this.deduplicator = new Deduplicator();
    this.scorer = new LeadScorer(config);
  }

  async enrichLead(leadId: string): Promise<EnrichmentResult> {
    const prisma = getPrismaClient();

    const dbLead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!dbLead) {
      throw new Error(`Lead ${leadId} não encontrado`);
    }

    const lead: EnrichmentLead = {
      id: dbLead.id,
      nome: dbLead.nome,
      empresa: dbLead.empresa,
      cargo: dbLead.cargo,
      telefone: dbLead.telefone,
      whatsapp: dbLead.whatsapp,
      email: dbLead.email,
      linkedin: dbLead.linkedin,
      website: dbLead.website,
      endereco: dbLead.endereco,
      origem: dbLead.origem,
      score: dbLead.score,
    };

    const validation = this.validateLead(lead);

    const existingLeads = await prisma.lead.findMany({
      where: { id: { not: leadId } },
      take: 100,
    });

    const existing: EnrichmentLead[] = existingLeads.map((l) => ({
      id: l.id,
      nome: l.nome,
      empresa: l.empresa,
      cargo: l.cargo,
      telefone: l.telefone,
      whatsapp: l.whatsapp,
      email: l.email,
      linkedin: l.linkedin,
      website: l.website,
      endereco: l.endereco,
      origem: l.origem,
      score: l.score,
    }));

    const dedup = await this.deduplicator.dedup(lead, existing);

    const finalScore = this.scorer.calculateScore(lead, validation);

    await prisma.lead.update({
      where: { id: leadId },
      data: { score: finalScore, status: 'validated' },
    });

    return {
      leadId,
      validation,
      score: finalScore,
      dedup: dedup.matched ? dedup : null,
      enriched: true,
    };
  }

  async enrichBatch(leadIds: string[]): Promise<EnrichmentResult[]> {
    const results: EnrichmentResult[] = [];

    for (const leadId of leadIds) {
      try {
        const result = await this.enrichLead(leadId);
        results.push(result);
      } catch (err) {
        console.error(
          `[Enrichment] Erro no lead ${leadId}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    return results;
  }

  async findDuplicates(): Promise<{ leadId: string; duplicates: DedupResult[] }[]> {
    const prisma = getPrismaClient();
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'asc' } });

    const allLeads: EnrichmentLead[] = leads.map((l) => ({
      id: l.id,
      nome: l.nome,
      empresa: l.empresa,
      cargo: l.cargo,
      telefone: l.telefone,
      whatsapp: l.whatsapp,
      email: l.email,
      linkedin: l.linkedin,
      website: l.website,
      endereco: l.endereco,
      origem: l.origem,
      score: l.score,
    }));

    const results: { leadId: string; duplicates: DedupResult[] }[] = [];

    for (let i = 0; i < allLeads.length; i++) {
      const lead = allLeads[i];
      const rest = allLeads.slice(i + 1);
      const result = await this.deduplicator.dedup(lead, rest);

      if (result.matched) {
        results.push({ leadId: lead.id!, duplicates: [result] });
      }
    }

    return results;
  }

  private validateLead(lead: EnrichmentLead): ValidationResult {
    const email = this.emailValidator.validate(lead.email);
    const telefone = this.phoneValidator.validate(lead.telefone);

    return {
      email,
      telefone,
      nome: {
        completo: lead.nome !== null && lead.nome.split(' ').length >= 2,
        score: lead.nome !== null && lead.nome.split(' ').length >= 2 ? 5 : 0,
      },
      empresa: {
        presente: lead.empresa !== null && lead.empresa.trim().length > 0,
        score: lead.empresa !== null && lead.empresa.trim().length > 0 ? 5 : 0,
      },
      cargo: {
        presente: lead.cargo !== null && lead.cargo.trim().length > 0,
        score: lead.cargo !== null && lead.cargo.trim().length > 0 ? 5 : 0,
      },
      linkedin: {
        presente: lead.linkedin !== null && lead.linkedin.trim().length > 0,
        score: lead.linkedin !== null && lead.linkedin.trim().length > 0 ? 5 : 0,
      },
    };
  }
}
