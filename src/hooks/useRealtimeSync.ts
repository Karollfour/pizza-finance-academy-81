
import { useGlobalRealtime } from './useGlobalRealtime';

interface RealtimeSyncOptions {
  onConnectionChange?: (connected: boolean) => void;
  silent?: boolean;
}

export const useRealtimeSync = (options: RealtimeSyncOptions = {}) => {
  // Usar o sistema centralizado de realtime
  const { isConnected, connectionQuality, forceReconnect } = useGlobalRealtime({
    onConnectionChange: options.onConnectionChange,
    enableHeartbeat: true,
    silent: options.silent
  });

  return {
    isConnected,
    connectionQuality,
    reconnect: forceReconnect
  };
};
