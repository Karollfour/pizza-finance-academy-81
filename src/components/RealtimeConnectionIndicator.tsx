
import { Badge } from '@/components/ui/badge';
import { useGlobalRealtimeContext } from '@/hooks/useGlobalRealtime';

interface RealtimeConnectionIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

const RealtimeConnectionIndicator = ({ 
  showDetails = false, 
  className = "" 
}: RealtimeConnectionIndicatorProps) => {
  const { isConnected, connectionQuality, lastHeartbeat } = useGlobalRealtimeContext();

  const getStatusColor = () => {
    if (!isConnected) return 'bg-red-500 hover:bg-red-600';
    
    switch (connectionQuality) {
      case 'excellent': return 'bg-green-500 hover:bg-green-600';
      case 'good': return 'bg-blue-500 hover:bg-blue-600';
      case 'poor': return 'bg-yellow-500 hover:bg-yellow-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusIcon = () => {
    if (!isConnected) return '🔴';
    
    switch (connectionQuality) {
      case 'excellent': return '🟢';
      case 'good': return '🔵';
      case 'poor': return '🟡';
      default: return '⚪';
    }
  };

  const getStatusText = () => {
    if (!isConnected) return 'Offline';
    
    switch (connectionQuality) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Bom';
      case 'poor': return 'Instável';
      default: return 'Conectado';
    }
  };

  if (!showDetails) {
    return (
      <Badge 
        variant="secondary"
        className={`${getStatusColor()} text-white text-xs ${className}`}
      >
        {getStatusIcon()} {getStatusText()}
      </Badge>
    );
  }

  return (
    <div className={`bg-white/90 backdrop-blur-sm border rounded-lg p-3 shadow-lg ${className}`}>
      <div className="flex items-center space-x-2 mb-2">
        <Badge 
          variant="secondary"
          className={`${getStatusColor()} text-white`}
        >
          {getStatusIcon()} {getStatusText()}
        </Badge>
        {isConnected && (
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        )}
      </div>
      
      {showDetails && (
        <div className="text-xs text-gray-600 space-y-1">
          <div>Status: {isConnected ? 'Conectado' : 'Desconectado'}</div>
          <div>Qualidade: {connectionQuality}</div>
          {lastHeartbeat && (
            <div>
              Último ping: {lastHeartbeat.toLocaleTimeString('pt-BR')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealtimeConnectionIndicator;
