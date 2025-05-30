
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProdutoLoja } from '@/types/database';

export const useProdutos = () => {
  const [produtos, setProdutos] = useState<ProdutoLoja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('produtos_loja')
        .select('*')
        .eq('disponivel', true)
        .order('nome');

      if (error) throw error;
      setProdutos(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const criarProduto = async (nome: string, unidade: string, valorUnitario: number) => {
    try {
      const { data, error } = await supabase
        .from('produtos_loja')
        .insert({
          nome,
          unidade,
          valor_unitario: valorUnitario
        })
        .select()
        .single();

      if (error) throw error;
      await fetchProdutos();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar produto');
      throw err;
    }
  };

  const atualizarProduto = async (id: string, dados: Partial<ProdutoLoja>) => {
    try {
      const { error } = await supabase
        .from('produtos_loja')
        .update(dados)
        .eq('id', id);

      if (error) throw error;
      await fetchProdutos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar produto');
      throw err;
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  return {
    produtos,
    loading,
    error,
    criarProduto,
    atualizarProduto,
    refetch: fetchProdutos
  };
};
