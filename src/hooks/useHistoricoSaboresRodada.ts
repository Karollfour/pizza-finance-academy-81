
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HistoricoSaborRodada {
  id: string;
  rodada_id: string;
  sabor_id: string;
  ordem: number;
  created_at: string;
  sabor?: {
    nome: string;
    descricao?: string;
  };
}

export const useHistoricoSaboresRodada = (rodadaId?: string) => {
  const [historico, setHistorico] = useState<HistoricoSaborRodada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  const fetchHistorico = async (silent = false) => {
    if (!rodadaId) {
      setHistorico([]);
      setLoading(false);
      return;
    }

    try {
      if (!silent) setLoading(true);
      
      const { data, error } = await supabase
        .from('historico_sabores_rodada')
        .select(`
          *,
          sabor:sabores_pizza(nome, descricao)
        `)
        .eq('rodada_id', rodadaId)
        .order('ordem', { ascending: true });

      if (error) throw error;
      
      const historicoFormatado = (data || []).map(item => ({
        ...item,
        sabor: item.sabor
      })) as HistoricoSaborRodada[];
      
      setHistorico(historicoFormatado);
      setError(null);
      
    } catch (err) {
      console.error('Erro ao carregar histórico de sabores:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar histórico');
    } finally {
      if (!silent) setLoading(false);
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

    // Cleanup any existing subscription
    cleanupChannel();

    // Create unique channel name
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
        (payload) => {
          console.log('Histórico de sabores atualizado:', payload);
          // Refetch imediato para garantir dados atualizados
          fetchHistorico(true);
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

  // Escutar eventos globais para atualização imediata
  useEffect(() => {
    const handleGlobalDataChange = (event: CustomEvent) => {
      const { table } = event.detail;
      if (table === 'historico_sabores_rodada' && rodadaId) {
        setTimeout(() => {
          fetchHistorico(true);
        }, 100);
      }
    };

    window.addEventListener('global-data-changed', handleGlobalDataChange as EventListener);

    return () => {
      window.removeEventListener('global-data-changed', handleGlobalDataChange as EventListener);
    };
  }, [rodadaId]);

  useEffect(() => {
    fetchHistorico();
  }, [rodadaId]);

  return {
    historico,
    loading,
    error,
    refetch: () => fetchHistorico(false)
  };
};
