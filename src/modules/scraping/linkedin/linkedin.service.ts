import { LinkedInScraper } from './linkedin.scraper.js';
import {
  LinkedInSearchInput,
  LinkedInProfileResult,
  LinkedInScraperConfig,
  LinkedInCredentials,
} from './linkedin.types.js';
import { getPrismaClient } from '../../../infra/database/prisma-client.js';
import { ScraperResult } from '../scraper.interface.js';
import { getCurrentTenantId } from '../../tenant/tenant.context.js';

export class LinkedInService {
  private scraper: LinkedInScraper;

  constructor(config?: LinkedInScraperConfig) {
    this.scraper = new LinkedInScraper(config);
  }

  setCredentials(credentials: LinkedInCredentials): void {
    this.scraper.setCredentials(credentials);
  }

  async searchAndSave(input: LinkedInSearchInput): Promise<ScraperResult<LinkedInProfileResult>> {
    const result = await this.scraper.scrape(input);

    if (result.data.length > 0) {
      await this.saveLeads(result.data);
    }

    return result;
  }

  private async saveLeads(leads: LinkedInProfileResult[]): Promise<void> {
    const prisma = getPrismaClient();

    for (const lead of leads) {
      try {
        const existing = lead.linkedin
          ? await prisma.lead.findFirst({ where: { linkedin: lead.linkedin } })
          : null;

        if (existing) continue;

        await prisma.lead.create({
          data: {
            nome: lead.nome,
            empresa: lead.empresa,
            cargo: lead.cargo,
            linkedin: lead.linkedin,
            origem: 'linkedin',
            score: 0,
            status: 'new',
            tenantId: getCurrentTenantId(),
          },
        });
      } catch (err) {
        console.error(
          '[LinkedInService] Erro ao salvar lead:',
          err instanceof Error ? err.message : err,
        );
      }
    }
  }

  async destroy(): Promise<void> {
    await this.scraper.destroy();
  }
}
