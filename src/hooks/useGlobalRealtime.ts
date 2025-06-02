
import { useEffect, useRef, useState, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

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
        updateConnectionStatus(true, 'excellent');
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        updateConnectionStatus(true, 'excellent');
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Silencioso - sem logs
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          updateConnectionStatus(true, 'excellent');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          updateConnectionStatus(false);
          
          // Reconexão silenciosa
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
            reconnectAttemptsRef.current++;
            
            setTimeout(() => {
              setupConnection();
            }, delay);
          }
        }
      });

    channelRef.current = channel;
    return channel;
  };

  const forceReconnect = () => {
    reconnectAttemptsRef.current = 0;
    updateConnectionStatus(false);
    setupConnection();
  };

  // Network state monitoring - completamente silencioso
  useEffect(() => {
    const handleOnline = () => {
      if (!isConnected) {
        forceReconnect();
      }
    };

    const handleOffline = () => {
      updateConnectionStatus(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
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
