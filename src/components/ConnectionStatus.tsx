
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import RealtimeConnectionIndicator from './RealtimeConnectionIndicator';

interface ConnectionStatusProps {
  showDetails?: boolean;
  silent?: boolean;
}

const ConnectionStatus = ({ showDetails = false, silent = false }: ConnectionStatusProps) => {
  useRealtimeSync({
    silent
  });

  // Se estiver em modo silencioso, não renderiza nada
  if (silent) {
    return null;
  }

  if (!showDetails) {
    return <RealtimeConnectionIndicator showDetails={false} />;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <RealtimeConnectionIndicator showDetails={true} />
    </div>
  );
};

export default ConnectionStatus;
