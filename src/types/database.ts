export interface Equipe {
  id: string;
  nome: string;
  professor_responsavel: string;
  created_at: string;
  saldo_inicial: number;
  gasto_total: number;
  ganho_total: number;
  cor_tema?: string;
  emblema?: string;
  ordem?: number;
}

export interface ProdutoLoja {
  id: string;
  nome: string;
  unidade: string;
  valor_unitario: number;
  disponivel: boolean;
  durabilidade: number | null;
  descricao: string | null;
  imagem: string | null;
  created_at: string;
}

export interface SaborPizza {
  id: string;
  nome: string;
  descricao: string | null;
  disponivel: boolean;
  imagem: string | null;
  created_at: string;
}

export interface Rodada {
  id: string;
  numero: number;
  tempo_limite: number;
  iniciou_em: string | null;
  finalizou_em: string | null;
  status: 'aguardando' | 'ativa' | 'pausada' | 'finalizada';
  created_at: string;
}

export interface Compra {
  id: string;
  equipe_id: string;
  produto_id: string | null;
  rodada_id: string | null;
  quantidade: number;
  valor_total: number;
  tipo: 'material' | 'viagem';
  descricao: string | null;
  created_at: string;
}

export interface Pizza {
  id: string;
  equipe_id: string;
  rodada_id: string;
  sabor_id: string | null;
  status: 'em_producao' | 'pronta' | 'avaliada';
  resultado: 'aprovada' | 'reprovada' | null;
  tempo_producao_segundos: number | null;
  justificativa_reprovacao: string | null;
  avaliado_por: string | null;
  created_at: string;
  updated_at: string;
  // Campos de join
  sabor?: SaborPizza;
}

export interface HistoricoSaborRodada {
  id: string;
  rodada_id: string;
  sabor_id: string;
  ordem: number;
  definido_em: string;
  definido_por: string | null;
  created_at: string;
  // Campos de join
  sabor?: SaborPizza;
}

export interface Configuracao {
  id: string;
  chave: string;
  valor: string;
  descricao: string | null;
  updated_at: string;
}
