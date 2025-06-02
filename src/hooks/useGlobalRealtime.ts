
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
  const isInitializedRef = useRef(false);

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
    // Prevent multiple initializations
    if (isInitializedRef.current) {
      return;
    }

    // Cleanup existing connection
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create unique channel name with timestamp and random component
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const channelName = `global-realtime-presence-${uniqueId}`;

    const channel = supabase
      .channel(channelName, {
        config: {
          presence: {
            key: `global-user-${uniqueId}`
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
          isInitializedRef.current = true;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          updateConnectionStatus(false);
          isInitializedRef.current = false;
          
          // Reconexão silenciosa
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
            reconnectAttemptsRef.current++;
            
            setTimeout(() => {
              if (!isInitializedRef.current) {
                setupConnection();
              }
            }, delay);
          }
        }
      });

    channelRef.current = channel;
    return channel;
  };

  const forceReconnect = () => {
    isInitializedRef.current = false;
    reconnectAttemptsRef.current = 0;
    updateConnectionStatus(false);
    setupConnection();
  };

  // Network state monitoring - completamente silencioso
  useEffect(() => {
    const handleOnline = () => {
      if (!isConnected && !isInitializedRef.current) {
        forceReconnect();
      }
    };

    const handleOffline = () => {
      updateConnectionStatus(false);
      isInitializedRef.current = false;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(() => {
          if (!isConnected || channelRef.current?.state !== 'joined') {
            if (!isInitializedRef.current) {
              forceReconnect();
            }
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
    setupConnection();

    return () => {
      isInitializedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
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
