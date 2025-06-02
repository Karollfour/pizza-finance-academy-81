
import { useEffect, useRef, useState, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface GlobalRealtimeContextType {
  isConnected: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  lastHeartbeat: Date | null;
  forceReconnect: () => void;
}

export const GlobalRealtimeContext = createContext<GlobalRealtimeContextType>({
  isConnected: false,
  connectionQuality: 'disconnected',
  lastHeartbeat: null,
  forceReconnect: () => {}
});

export const useGlobalRealtimeContext = () => useContext(GlobalRealtimeContext);

interface UseGlobalRealtimeOptions {
  onConnectionChange?: (connected: boolean) => void;
  enableHeartbeat?: boolean;
  silent?: boolean;
}

export const useGlobalRealtime = (options: UseGlobalRealtimeOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'disconnected'>('disconnected');
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 3;
  const baseReconnectDelay = 2000;

  const updateConnectionStatus = (connected: boolean, quality?: 'excellent' | 'good' | 'poor') => {
    setIsConnected(connected);
    setConnectionQuality(connected ? (quality || 'good') : 'disconnected');
    options.onConnectionChange?.(connected);
    
    if (connected) {
      setLastHeartbeat(new Date());
      reconnectAttemptsRef.current = 0;
    }
  };

  const startHeartbeat = () => {
    if (!options.enableHeartbeat) return;
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (channelRef.current?.state === 'joined') {
        setLastHeartbeat(new Date());
        // Send heartbeat
        channelRef.current.send({
          type: 'broadcast',
          event: 'heartbeat',
          payload: { timestamp: Date.now() }
        });
      }
    }, 30000); // Heartbeat every 30 seconds
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  const setupConnection = () => {
    // Cleanup existing connection
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel('global-realtime-sync', {
        config: {
          presence: {
            key: `user-${Math.random().toString(36).substr(2, 9)}`
          }
        }
      })
      .on('presence', { event: 'sync' }, () => {
        console.log('🔄 Realtime: Presence sync');
        updateConnectionStatus(true, 'excellent');
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('✅ Realtime: Client joined', key);
        updateConnectionStatus(true, 'excellent');
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('❌ Realtime: Client left', key);
      })
      .on('broadcast', { event: 'heartbeat' }, (payload) => {
        console.log('💓 Realtime: Heartbeat received');
        setLastHeartbeat(new Date());
        updateConnectionStatus(true, 'excellent');
      })
      .subscribe((status) => {
        console.log('🌐 Realtime status:', status);
        
        if (status === 'SUBSCRIBED') {
          updateConnectionStatus(true, 'excellent');
          startHeartbeat();
          
          if (!options.silent) {
            toast.success('🟢 Conectado ao tempo real', {
              duration: 2000,
            });
          }
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          updateConnectionStatus(false);
          stopHeartbeat();
          
          // Intelligent reconnection with exponential backoff
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
            reconnectAttemptsRef.current++;
            
            console.log(`🔄 Tentativa de reconexão ${reconnectAttemptsRef.current}/${maxReconnectAttempts} em ${delay}ms`);
            
            setTimeout(() => {
              setupConnection();
            }, delay);
          } else {
            if (!options.silent) {
              toast.error('🔴 Falha na conexão em tempo real', {
                duration: 4000,
                action: {
                  label: 'Tentar novamente',
                  onClick: () => forceReconnect()
                }
              });
            }
          }
        }
      });

    channelRef.current = channel;
    return channel;
  };

  const forceReconnect = () => {
    console.log('🔄 Forçando reconexão...');
    reconnectAttemptsRef.current = 0;
    updateConnectionStatus(false);
    setupConnection();
  };

  // Network state monitoring
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Rede online detectada');
      if (!isConnected) {
        forceReconnect();
      }
    };

    const handleOffline = () => {
      console.log('❌ Rede offline detectada');
      updateConnectionStatus(false);
      stopHeartbeat();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Página visível - verificando conexão');
        // Verificar se ainda estamos conectados após voltar ao foco
        setTimeout(() => {
          if (!isConnected || channelRef.current?.state !== 'joined') {
            forceReconnect();
          }
        }, 1000);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConnected]);

  // Initialize connection
  useEffect(() => {
    const channel = setupConnection();

    return () => {
      stopHeartbeat();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    connectionQuality,
    lastHeartbeat,
    forceReconnect,
    contextValue: {
      isConnected,
      connectionQuality,
      lastHeartbeat,
      forceReconnect
    }
  };
};
