export interface TemplateInput {
  nome: string;
  conteudo: string;
  variaveis: string[];
}

export interface TemplatePreviewInput {
  conteudo: string;
  dados: Record<string, string>;
}

export interface TemplateUpdateInput {
  nome?: string;
  conteudo?: string;
  variaveis?: string[];
}

export const VARIAVEIS_PADRAO = [
  'nome',
  'empresa',
  'cargo',
  'telefone',
  'email',
  'linkedin',
  'origem',
  'score',
] as const;

export type VariavelPadrao = (typeof VARIAVEIS_PADRAO)[number];
