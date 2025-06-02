
interface RealtimeConnectionIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

const RealtimeConnectionIndicator = ({ 
  showDetails = false, 
  className = "" 
}: RealtimeConnectionIndicatorProps) => {
  // Componente vazio - não mostra mais status de conexão
  return null;
};

export default RealtimeConnectionIndicator;
