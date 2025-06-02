
interface ConnectionStatusProps {
  showDetails?: boolean;
  silent?: boolean;
}

const ConnectionStatus = ({ showDetails = false, silent = false }: ConnectionStatusProps) => {
  // Componente vazio - apenas mantém a conexão realtime sem mostrar status
  return null;
};

export default ConnectionStatus;
