export interface CreateCampaignInput {
  nome: string;
  templateId: string;
  config?: CampaignConfig;
}

export interface UpdateCampaignInput {
  nome?: string;
  templateId?: string;
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  config?: CampaignConfig;
}

export interface CampaignConfig {
  delayBetweenMessagesMs: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: number[];
  maxMessagesPerDay: number;
}

export interface AddLeadsInput {
  leadIds: string[];
}

export interface ScheduleCampaignInput {
  scheduledAt: string;
}

export const DEFAULT_CAMPAIGN_CONFIG: CampaignConfig = {
  delayBetweenMessagesMs: 10000,
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  workingDays: [1, 2, 3, 4, 5],
  maxMessagesPerDay: 50,
};
