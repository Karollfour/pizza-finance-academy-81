
import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseGlobalSyncOptions {
  enabled?: boolean;
  silent?: boolean;
}

export const useGlobalSync = (options: UseGlobalSyncOptions = {}) => {
  const { enabled = true, silent = true } = options;
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);
  const deviceIdRef = useRef<string>('');
  const lastUpdateRef = useRef<number>(0);

  // Gerar ID único para este dispositivo
  useEffect(() => {
    deviceIdRef.current = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Função para invalidar todas as queries críticas
  const invalidateAllQueries = useCallback(() => {
    const now = Date.now();
    
    // Evitar atualizações muito frequentes (debounce de 100ms)
    if (now - lastUpdateRef.current < 100) {
      return;
    }

    try {
      // Invalidar todas as queries importantes para sincronização
      queryClient.invalidateQueries({ queryKey: ['rodadas'] });
      queryClient.invalidateQueries({ queryKey: ['pizzas'] });
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      queryClient.invalidateQueries({ queryKey: ['equipes'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['sabores'] });
      queryClient.invalidateQueries({ queryKey: ['historico-sabores'] });
      queryClient.invalidateQueries({ queryKey: ['contador-rodada'] });

      lastUpdateRef.current = now;

      if (!silent) {
        console.log('🔄 Global sync executado', new Date().toLocaleTimeString());
      }
    } catch (error) {
      if (!silent) {
        console.error('Erro no global sync:', error);
      }
    }
  }, [queryClient, silent]);

  // Configurar canal de realtime para sincronização global
  const setupRealtimeSync = useCallback(() => {
    if (channelRef.current && isSubscribedRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }

    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const channelName = `global-sync-${uniqueId}`;

    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false }
        }
      })
      // Escutar mudanças em todas as tabelas críticas
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rodadas' }, () => {
        invalidateAllQueries();
        // Disparar evento customizado para atualização imediata
        window.dispatchEvent(new CustomEvent('global-data-changed', { 
          detail: { table: 'rodadas', timestamp: Date.now() } 
        }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pizzas' }, () => {
        invalidateAllQueries();
        window.dispatchEvent(new CustomEvent('global-data-changed', { 
          detail: { table: 'pizzas', timestamp: Date.now() } 
        }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'historico_sabores_rodada' }, () => {
        invalidateAllQueries();
        window.dispatchEvent(new CustomEvent('global-data-changed', { 
          detail: { table: 'historico_sabores_rodada', timestamp: Date.now() } 
        }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contadores_jogo' }, () => {
        invalidateAllQueries();
        window.dispatchEvent(new CustomEvent('global-data-changed', { 
          detail: { table: 'contadores_jogo', timestamp: Date.now() } 
        }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'compras' }, () => {
        invalidateAllQueries();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipes' }, () => {
        invalidateAllQueries();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos_loja' }, () => {
        invalidateAllQueries();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sabores_pizza' }, () => {
        invalidateAllQueries();
      })
      // Broadcast para sincronização entre dispositivos
      .on('broadcast', { event: 'force_sync' }, (payload) => {
        if (payload.payload?.deviceId !== deviceIdRef.current) {
          const timeDiff = Date.now() - (payload.payload?.timestamp || 0);
          if (timeDiff < 5000) { // Apenas eventos recentes
            invalidateAllQueries();
          }
        }
      });

    if (!isSubscribedRef.current) {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
          if (!silent) {
            console.log('✅ Global sync ativo');
          }
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          isSubscribedRef.current = false;
          if (!silent) {
            console.log('❌ Global sync desconectado');
          }
        }
      });
      channelRef.current = channel;
    }
  }, [invalidateAllQueries, silent]);

  // Função para forçar sincronização em todos os dispositivos
  const forceGlobalSync = useCallback(() => {
    invalidateAllQueries();
    
    // Notificar outros dispositivos
    if (channelRef.current && isSubscribedRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'force_sync',
        payload: {
          timestamp: Date.now(),
          deviceId: deviceIdRef.current
        }
      });
    }
  }, [invalidateAllQueries]);

  // Configurar sincronização inicial
  useEffect(() => {
    if (!enabled) return;

    setupRealtimeSync();

    // Cleanup ao desmontar
    return () => {
      if (channelRef.current && isSubscribedRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [enabled, setupRealtimeSync]);

  // Escutar eventos de visibilidade para reconectar quando necessário
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Reconectar quando a página volta ao foco
        setTimeout(() => {
          if (!isSubscribedRef.current) {
            setupRealtimeSync();
          }
          // Sincronizar dados imediatamente
          invalidateAllQueries();
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, setupRealtimeSync, invalidateAllQueries]);

  return {
    forceGlobalSync,
    isConnected: isSubscribedRef.current,
    deviceId: deviceIdRef.current
  };
};
