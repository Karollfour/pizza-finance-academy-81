
export interface Equipe {
  id: string;
  nome: string;
  saldo_inicial: number;
  gasto_total: number;
  professor_responsavel: string | null;
  created_at: string;
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

export interface Rodada {
  id: string;
  numero: number;
  tempo_limite: number;
  iniciou_em: string | null;
  finalizou_em: string | null;
  status: 'aguardando' | 'ativa' | 'finalizada';
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
  status: 'em_producao' | 'pronta' | 'avaliada';
  resultado: 'aprovada' | 'reprovada' | null;
  tempo_producao_segundos: number | null;
  justificativa_reprovacao: string | null;
  avaliado_por: string | null;
  created_at: string;
  updated_at: string;
}

export interface Configuracao {
  id: string;
  chave: string;
  valor: string;
  descricao: string | null;
  updated_at: string;
}
