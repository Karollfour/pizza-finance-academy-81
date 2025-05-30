
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Rodada } from '@/types/database';

export const useRodadas = () => {
  const [rodadaAtual, setRodadaAtual] = useState<Rodada | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRodadaAtual = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rodadas')
        .select('*')
        .in('status', ['aguardando', 'ativa'])
        .order('numero', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setRodadaAtual(data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar rodada');
    } finally {
      setLoading(false);
    }
  };

  const iniciarRodada = async (rodadaId: string) => {
    try {
      const { error } = await supabase
        .from('rodadas')
        .update({
          status: 'ativa',
          iniciou_em: new Date().toISOString()
        })
        .eq('id', rodadaId);

      if (error) throw error;
      await fetchRodadaAtual();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar rodada');
      throw err;
    }
  };

  const finalizarRodada = async (rodadaId: string) => {
    try {
      const { error } = await supabase
        .from('rodadas')
        .update({
          status: 'finalizada',
          finalizou_em: new Date().toISOString()
        })
        .eq('id', rodadaId);

      if (error) throw error;
      await fetchRodadaAtual();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao finalizar rodada');
      throw err;
    }
  };

  const criarNovaRodada = async (numero: number, tempoLimite: number = 300) => {
    try {
      const { data, error } = await supabase
        .from('rodadas')
        .insert({
          numero,
          tempo_limite: tempoLimite,
          status: 'aguardando'
        })
        .select()
        .single();

      if (error) throw error;
      await fetchRodadaAtual();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar rodada');
      throw err;
    }
  };

  useEffect(() => {
    fetchRodadaAtual();
  }, []);

  return {
    rodadaAtual,
    loading,
    error,
    iniciarRodada,
    finalizarRodada,
    criarNovaRodada,
    refetch: fetchRodadaAtual
  };
};
