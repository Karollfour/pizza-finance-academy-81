
import { useState, useEffect } from 'react';

export interface Sabor {
  id: string;
  nome: string;
  descricao?: string;
  disponivel: boolean;
  created_at: string;
}

export const useSabores = () => {
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const criarSabor = async (nome: string, descricao?: string) => {
    try {
      const novoSabor: Sabor = {
        id: Date.now().toString(),
        nome,
        descricao,
        disponivel: true,
        created_at: new Date().toISOString()
      };
      
      setSabores(prev => [...prev, novoSabor]);
      return novoSabor;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar sabor');
      throw err;
    }
  };

  const atualizarSabor = async (id: string, dados: Partial<Sabor>) => {
    try {
      setSabores(prev => prev.map(sabor => 
        sabor.id === id ? { ...sabor, ...dados } : sabor
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar sabor');
      throw err;
    }
  };

  const inicializarSaboresDefault = () => {
    const saboresDefault = [
      { nome: 'Pepperoni', descricao: 'Pizza de pepperoni com queijo mussarela' },
      { nome: 'Mussarela', descricao: 'Pizza de queijo mussarela' },
      { nome: 'Portuguesa', descricao: 'Pizza portuguesa com presunto, ovos, cebola e azeitonas' }
    ];

    const saboresIniciais: Sabor[] = saboresDefault.map((sabor, index) => ({
      id: (index + 1).toString(),
      nome: sabor.nome,
      descricao: sabor.descricao,
      disponivel: true,
      created_at: new Date().toISOString()
    }));

    setSabores(saboresIniciais);
  };

  useEffect(() => {
    inicializarSaboresDefault();
  }, []);

  return {
    sabores,
    loading,
    error,
    criarSabor,
    atualizarSabor,
    refetch: () => {}
  };
};
