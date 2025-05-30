
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Compra } from '@/types/database';

export const useCompras = (equipeId?: string) => {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompras = async () => {
    try {
      setLoading(true);
      let query = supabase.from('compras').select('*');
      
      if (equipeId) {
        query = query.eq('equipe_id', equipeId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setCompras((data || []) as Compra[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar compras');
    } finally {
      setLoading(false);
    }
  };

  const registrarCompra = async (
    equipeId: string,
    produtoId: string | null,
    rodadaId: string | null,
    quantidade: number,
    valorTotal: number,
    tipo: 'material' | 'viagem',
    descricao?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('compras')
        .insert({
          equipe_id: equipeId,
          produto_id: produtoId,
          rodada_id: rodadaId,
          quantidade,
          valor_total: valorTotal,
          tipo,
          descricao
        })
        .select()
        .single();

      if (error) throw error;
      await fetchCompras();
      return data as Compra;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar compra');
      throw err;
    }
  };

  const calcularGastoTotal = (equipeId: string): number => {
    return compras
      .filter(compra => compra.equipe_id === equipeId)
      .reduce((total, compra) => total + compra.valor_total, 0);
  };

  useEffect(() => {
    fetchCompras();
  }, [equipeId]);

  return {
    compras,
    loading,
    error,
    registrarCompra,
    calcularGastoTotal,
    refetch: fetchCompras
  };
};
