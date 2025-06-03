
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SaborPizza } from '@/types/database';

interface HistoricoSaborRodada {
  id: string;
  rodada_id: string;
  sabor_id: string;
  ordem: number;
  definido_em: string;
  definido_por: string | null;
  created_at: string;
  sabor?: SaborPizza;
}

export const useHistoricoSaboresRodada = (rodadaId?: string) => {
  const [historico, setHistorico] = useState<HistoricoSaborRodada[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  const fetchHistorico = async () => {
    if (!rodadaId) {
      setHistorico([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('historico_sabores_rodada')
        .select(`
          *,
          sabor:sabores_pizza(*)
        `)
        .eq('rodada_id', rodadaId)
        .order('ordem', { ascending: true });

      if (error) throw error;
      setHistorico(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const adicionarSabor = async (saborId: string, definidoPor?: string) => {
    if (!rodadaId) return;

    try {
      // Obter próxima ordem
      const proximaOrdem = historico.length + 1;

      const { error } = await supabase
        .from('historico_sabores_rodada')
        .insert({
          rodada_id: rodadaId,
          sabor_id: saborId,
          ordem: proximaOrdem,
          definido_por: definidoPor || 'Professor'
        });

      if (error) throw error;
      
      // Refetch para atualizar a lista
      await fetchHistorico();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar sabor');
      return false;
    }
  };

  const cleanupChannel = () => {
    if (channelRef.current && isSubscribedRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }
  };

  // Escutar mudanças em tempo real
  useEffect(() => {
    if (!rodadaId) return;

    // Cleanup previous channel
    cleanupChannel();

    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const channelName = `historico-sabores-${rodadaId}-${uniqueId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'historico_sabores_rodada',
          filter: `rodada_id=eq.${rodadaId}`
        },
        () => {
          fetchHistorico();
        }
      );

    if (!isSubscribedRef.current) {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        }
      });
      channelRef.current = channel;
    }

    return () => {
      cleanupChannel();
    };
  }, [rodadaId]);

  useEffect(() => {
    fetchHistorico();
  }, [rodadaId]);

  return {
    historico,
    loading,
    error,
    adicionarSabor,
    refetch: fetchHistorico,
    saborAtual: historico.length > 0 ? historico[historico.length - 1] : null
  };
};
