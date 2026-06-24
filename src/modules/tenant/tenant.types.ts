export interface CreateTenantInput {
  nome: string;
  slug: string;
}

export interface TenantData {
  id: string;
  nome: string;
  slug: string;
  active: boolean;
  config: Record<string, unknown> | null;
  createdAt: string;
}
