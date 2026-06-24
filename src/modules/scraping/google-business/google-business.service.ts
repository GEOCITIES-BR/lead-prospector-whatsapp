import { GoogleBusinessScraper } from './google-business.scraper.js';
import {
  GoogleBusinessSearchInput,
  GoogleBusinessResult,
  GoogleBusinessScraperConfig,
} from './google-business.types.js';
import { getPrismaClient } from '../../../infra/database/prisma-client.js';
import { ScraperResult } from '../scraper.interface.js';
import { getCurrentTenantId } from '../../tenant/tenant.context.js';

export class GoogleBusinessService {
  private scraper: GoogleBusinessScraper;

  constructor(config?: GoogleBusinessScraperConfig) {
    this.scraper = new GoogleBusinessScraper(config);
  }

  async searchAndSave(
    input: GoogleBusinessSearchInput,
  ): Promise<ScraperResult<GoogleBusinessResult>> {
    const result = await this.scraper.scrape(input);

    if (result.data.length > 0) {
      await this.saveLeads(result.data, input);
    }

    return result;
  }

  private async saveLeads(
    leads: GoogleBusinessResult[],
    _input: GoogleBusinessSearchInput,
  ): Promise<void> {
    const prisma = getPrismaClient();

    for (const lead of leads) {
      try {
        const existing = lead.telefone
          ? await prisma.lead.findFirst({ where: { telefone: lead.telefone } })
          : null;

        if (existing) continue;

        await prisma.lead.create({
          data: {
            nome: lead.nome,
            telefone: lead.telefone,
            website: lead.website,
            endereco: lead.endereco,
            origem: 'google_business',
            score: 0,
            status: 'new',
            tenantId: getCurrentTenantId(),
          },
        });
      } catch (err) {
        console.error(
          '[GoogleBusinessService] Erro ao salvar lead:',
          err instanceof Error ? err.message : err,
        );
      }
    }
  }

  async destroy(): Promise<void> {
    await this.scraper.destroy();
  }
}
