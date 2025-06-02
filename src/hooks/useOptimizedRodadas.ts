
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Rodada } from '@/types/database';
import { toast } from 'sonner';

interface RodadaEvent {
  type: 'CREATED' | 'STARTED' | 'FINISHED' | 'UPDATED';
  rodada: Rodada;
  timestamp: string;
}

export const useOptimizedRodadas = () => {
  const [rodadaAtual, setRodadaAtual] = useState<Rodada | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchRodadaAtual = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const { data, error } = await supabase
        .from('rodadas')
        .select('*')
        .in('status', ['aguardando', 'ativa'])
        .order('numero', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      const novaRodada = data ? (data as Rodada) : null;
      
      // Verificar se houve mudança real
      if (JSON.stringify(novaRodada) !== JSON.stringify(rodadaAtual)) {
        setRodadaAtual(novaRodada);
        setLastUpdate(new Date());
        
        // Broadcast silencioso do evento para outros hooks
        if (novaRodada && typeof window !== 'undefined') {
          const event: RodadaEvent = {
            type: novaRodada.status === 'ativa' ? 'STARTED' : 'UPDATED',
            rodada: novaRodada,
            timestamp: new Date().toISOString()
          };
          
          window.dispatchEvent(new CustomEvent('rodada-updated', { 
            detail: event 
          }));
        }
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar rodada');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [rodadaAtual]);

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
      
      // Fetch imediato para atualizar estado local
      await fetchRodadaAtual(true);
      
      // Broadcast global do início da rodada
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rodada-iniciada', { 
          detail: { 
            rodadaId,
            timestamp: new Date().toISOString() 
          } 
        }));
      }
      
      toast.success('🚀 Rodada iniciada!', {
        duration: 2000,
      });
      
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
      
      // Fetch imediato para atualizar estado local
      await fetchRodadaAtual(true);
      
      // Broadcast global do fim da rodada
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rodada-finalizada', { 
          detail: { 
            rodadaId,
            timestamp: new Date().toISOString() 
          } 
        }));
      }
      
      toast.success('🏁 Rodada finalizada!', {
        duration: 2000,
      });
      
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
      
      // Fetch imediato para atualizar estado local
      await fetchRodadaAtual(true);
      
      // Broadcast global da criação da rodada
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rodada-criada', { 
          detail: { 
            rodada: data as Rodada,
            timestamp: new Date().toISOString() 
          } 
        }));
      }
      
      toast.success(`🎯 Rodada ${numero} criada!`, {
        duration: 2000,
      });
      
      return data as Rodada;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar rodada');
      throw err;
    }
  };

  // Escutar mudanças em tempo real otimizado
  useEffect(() => {
    const channel = supabase
      .channel('rodadas-optimized')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rodadas'
        },
        async (payload) => {
          const rodadaAtualizada = payload.new as Rodada;
          
          if (payload.eventType === 'UPDATE') {
            // Verificar se é a rodada atual
            if (rodadaAtual?.id === rodadaAtualizada.id) {
              setRodadaAtual(rodadaAtualizada);
              setLastUpdate(new Date());
              
              // Notificar sobre mudanças importantes silenciosamente
              if (rodadaAtual.status !== rodadaAtualizada.status) {
                const evento = rodadaAtualizada.status === 'ativa' ? 'STARTED' : 
                              rodadaAtualizada.status === 'finalizada' ? 'FINISHED' : 'UPDATED';
                
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('rodada-updated', { 
                    detail: { 
                      type: evento,
                      rodada: rodadaAtualizada,
                      timestamp: new Date().toISOString() 
                    } 
                  }));
                }
                
                // Notificações específicas para mudanças de status
                if (rodadaAtualizada.status === 'ativa') {
                  toast.success('🚀 Rodada iniciada!', {
                    duration: 3000,
                  });
                } else if (rodadaAtualizada.status === 'finalizada') {
                  toast.info('🏁 Rodada finalizada!', {
                    duration: 3000,
                  });
                }
              }
              
              // Notificar sobre mudanças no tempo limite
              if (rodadaAtual.tempo_limite !== rodadaAtualizada.tempo_limite) {
                console.log('Tempo limite alterado no banco:', rodadaAtualizada.tempo_limite);
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('rodada-tempo-alterado', { 
                    detail: { 
                      rodadaId: rodadaAtualizada.id,
                      novoTempoLimite: rodadaAtualizada.tempo_limite,
                      timestamp: new Date().toISOString() 
                    } 
                  }));
                }
              }
            }
          } else if (payload.eventType === 'INSERT') {
            // Nova rodada criada
            if (rodadaAtualizada.status === 'aguardando') {
              setRodadaAtual(rodadaAtualizada);
              setLastUpdate(new Date());
              
              toast.success(`🎯 Nova rodada ${rodadaAtualizada.numero} criada!`, {
                duration: 3000,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rodadaAtual]);

  // Escutar eventos customizados globais
  useEffect(() => {
    const handleRodadaEvent = (event: CustomEvent) => {
      console.log('Hook recebeu evento:', event.type, event.detail);
      // Refetch silencioso para garantir sincronização
      fetchRodadaAtual(true);
    };

    window.addEventListener('rodada-updated', handleRodadaEvent as EventListener);
    window.addEventListener('rodada-iniciada', handleRodadaEvent as EventListener);
    window.addEventListener('rodada-finalizada', handleRodadaEvent as EventListener);
    window.addEventListener('rodada-criada', handleRodadaEvent as EventListener);
    window.addEventListener('rodada-tempo-alterado', handleRodadaEvent as EventListener);

    return () => {
      window.removeEventListener('rodada-updated', handleRodadaEvent as EventListener);
      window.removeEventListener('rodada-iniciada', handleRodadaEvent as EventListener);
      window.removeEventListener('rodada-finalizada', handleRodadaEvent as EventListener);
      window.removeEventListener('rodada-criada', handleRodadaEvent as EventListener);
      window.removeEventListener('rodada-tempo-alterado', handleRodadaEvent as EventListener);
    };
  }, [fetchRodadaAtual]);

  // Initial fetch
  useEffect(() => {
    fetchRodadaAtual();
  }, []);

  return {
    rodadaAtual,
    loading,
    error,
    lastUpdate,
    iniciarRodada,
    finalizarRodada,
    criarNovaRodada,
    refetch: () => fetchRodadaAtual(false)
  };
};
