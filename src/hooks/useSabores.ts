
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Sabor {
  id: string;
  nome: string;
  descricao?: string;
  disponivel: boolean;
  created_at: string;
}

export const useSabores = () => {
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSabores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sabores_pizza')
        .select('*')
        .eq('disponivel', true)
        .order('nome');

      if (error) throw error;
      setSabores(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar sabores');
    } finally {
      setLoading(false);
    }
  };

  const criarSabor = async (nome: string, descricao?: string) => {
    try {
      const { data, error } = await supabase
        .from('sabores_pizza')
        .insert({
          nome,
          descricao
        })
        .select()
        .single();

      if (error) throw error;
      await fetchSabores();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar sabor');
      throw err;
    }
  };

  const atualizarSabor = async (id: string, dados: Partial<Sabor>) => {
    try {
      const { error } = await supabase
        .from('sabores_pizza')
        .update(dados)
        .eq('id', id);

      if (error) throw error;
      await fetchSabores();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar sabor');
      throw err;
    }
  };

  const inicializarSaboresDefault = async () => {
    try {
      const saboresDefault = [
        { nome: 'Pepperoni', descricao: 'Pizza de pepperoni com queijo mussarela' },
        { nome: 'Mussarela', descricao: 'Pizza de queijo mussarela' },
        { nome: 'Portuguesa', descricao: 'Pizza portuguesa com presunto, ovos, cebola e azeitonas' }
      ];

      for (const sabor of saboresDefault) {
        const { data: existing } = await supabase
          .from('sabores_pizza')
          .select('id')
          .eq('nome', sabor.nome)
          .single();

        if (!existing) {
          await criarSabor(sabor.nome, sabor.descricao);
        }
      }
    } catch (err) {
      console.error('Erro ao inicializar sabores:', err);
    }
  };

  useEffect(() => {
    fetchSabores();
    inicializarSaboresDefault();
  }, []);

  return {
    sabores,
    loading,
    error,
    criarSabor,
    atualizarSabor,
    refetch: fetchSabores
  };
};
