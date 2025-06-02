
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

interface ConnectionStatusProps {
  showDetails?: boolean;
  silent?: boolean;
}

const ConnectionStatus = ({ showDetails = false, silent = false }: ConnectionStatusProps) => {
  const [isConnected, setIsConnected] = useState(false);
  
  useRealtimeSync({
    onConnectionChange: setIsConnected,
    silent
  });

  // Se estiver em modo silencioso, não renderiza nada
  if (silent) {
    return null;
  }

  if (!showDetails) {
    return (
      <Badge 
        variant={isConnected ? "default" : "destructive"}
        className={`${
          isConnected 
            ? 'bg-green-500 hover:bg-green-600' 
            : 'bg-red-500 hover:bg-red-600'
        } text-white text-xs`}
      >
        {isConnected ? '🟢 Online' : '🔴 Offline'}
      </Badge>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge 
        variant={isConnected ? "default" : "destructive"}
        className={`${
          isConnected 
            ? 'bg-green-500 hover:bg-green-600' 
            : 'bg-red-500 hover:bg-red-600'
        } text-white px-3 py-1`}
      >
        {isConnected ? (
          <>
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
            Conectado ao tempo real
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
            Desconectado
          </>
        )}
      </Badge>
    </div>
  );
};

export default ConnectionStatus;
