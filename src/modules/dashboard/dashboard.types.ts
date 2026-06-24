export interface DashboardOverview {
  totalLeads: number;
  totalCampanhas: number;
  totalMensagens: number;
  totalTemplates: number;
  leadsContacted: number;
  leadsPendentes: number;
  taxaConversao: number;
}

export interface LeadSourceItem {
  origem: string;
  total: number;
}

export interface LeadStatusItem {
  status: string;
  total: number;
}

export interface ScoreDistribution {
  faixa: string;
  min: number;
  max: number;
  total: number;
}

export interface LeadScoreData {
  media: number;
  min: number;
  max: number;
  distribuicao: ScoreDistribution[];
}

export interface CampaignPerformanceItem {
  id: string;
  nome: string;
  status: string;
  totalLeads: number;
  enviados: number;
  falhos: number;
  pendentes: number;
  taxaSucesso: number;
}

export interface MessageTimelineItem {
  data: string;
  total: number;
  enviados: number;
  falhos: number;
}
