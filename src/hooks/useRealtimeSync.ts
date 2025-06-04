
import { useGlobalRealtime } from './useGlobalRealtime';

interface RealtimeSyncOptions {
  onConnectionChange?: (connected: boolean) => void;
  silent?: boolean;
}

export const useRealtimeSync = (options: RealtimeSyncOptions = {}) => {
  // Use the centralized realtime system
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
