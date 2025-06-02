
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
      setRodadaAtual(data ? (data as Rodada) : null);
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

      // Incrementar o contador após criar a rodada com sucesso
      await supabase.rpc('obter_proximo_numero_rodada');
      
      await fetchRodadaAtual();
      return data as Rodada;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar rodada');
      throw err;
    }
  };

  // Escutar mudanças em tempo real para rodadas (silencioso)
  useEffect(() => {
    console.log('Configurando escuta em tempo real para rodadas');
    
    const channel = supabase
      .channel('rodadas-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rodadas'
        },
        (payload) => {
          console.log('Rodada atualizada:', payload);
          const rodadaAtualizada = payload.new as Rodada;
          
          if (payload.eventType === 'UPDATE') {
            // Atualizar rodada local se for a atual
            setRodadaAtual(prev => {
              if (prev?.id === rodadaAtualizada.id) {
                return rodadaAtualizada;
              }
              return prev;
            });
          } else if (payload.eventType === 'INSERT') {
            // Nova rodada criada
            if (rodadaAtualizada.status === 'aguardando') {
              setRodadaAtual(rodadaAtualizada);
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Removendo escuta em tempo real para rodadas');
      supabase.removeChannel(channel);
    };
  }, []);

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
