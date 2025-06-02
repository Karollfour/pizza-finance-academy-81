
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeSyncOptions {
  onConnectionChange?: (connected: boolean) => void;
  silent?: boolean;
}

export const useRealtimeSync = (options: RealtimeSyncOptions = {}) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const setupConnection = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel('global-sync')
      .on('system', {}, (payload) => {
        console.log('Realtime system event:', payload);
        
        if (payload.type === 'PRESENCE_JOIN') {
          console.log('Cliente conectado ao realtime');
          options.onConnectionChange?.(true);
          reconnectAttemptsRef.current = 0;
        } else if (payload.type === 'PRESENCE_LEAVE') {
          console.log('Cliente desconectado do realtime');
          options.onConnectionChange?.(false);
        }
      })
      .subscribe((status) => {
        console.log('Status da conexão realtime:', status);
        
        if (status === 'SUBSCRIBED') {
          options.onConnectionChange?.(true);
          reconnectAttemptsRef.current = 0;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          options.onConnectionChange?.(false);
          
          // Tentar reconectar automaticamente silenciosamente
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            
            setTimeout(() => {
              console.log(`Tentativa de reconexão ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
              setupConnection();
            }, Math.pow(2, reconnectAttemptsRef.current) * 1000);
          }
        }
      });

    channelRef.current = channel;
    return channel;
  };

  useEffect(() => {
    const channel = setupConnection();

    // Detectar mudanças na visibilidade da página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && channelRef.current?.state !== 'joined') {
        setupConnection();
      }
    };

    // Detectar mudanças na conectividade de rede
    const handleOnline = () => {
      if (channelRef.current?.state !== 'joined') {
        setupConnection();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return {
    isConnected: channelRef.current?.state === 'joined',
    reconnect: setupConnection
  };
};
