
import { useState } from 'react';
import LoginScreen from '@/components/LoginScreen';
import LojinhaScreen from '@/components/LojinhaScreen';
import ProducaoScreen from '@/components/ProducaoScreen';
import EquipeScreen from '@/components/EquipeScreen';
import AvaliadorScreen from '@/components/AvaliadorScreen';
import SeletorEquipes from '@/components/SeletorEquipes';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [currentUser, setCurrentUser] = useState<{
    type: string;
    teamId?: string;
  } | null>(null);

  const handleLogin = (userType: string, teamId?: string) => {
    setCurrentUser({ type: userType, teamId });
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleEquipeSelecionada = (equipeNome: string) => {
    setCurrentUser({ type: 'equipe', teamId: equipeNome });
  };

  // Se não estiver logado, mostrar tela de login
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Renderizar tela baseada no tipo de usuário
  const renderScreen = () => {
    switch (currentUser.type) {
      case 'lojinha':
        return <LojinhaScreen />;
      case 'producao':
        return <ProducaoScreen />;
      case 'avaliador':
        return <AvaliadorScreen />;
      case 'equipe':
        return <EquipeScreen teamName={currentUser.teamId || 'Equipe Sem Nome'} />;
      case 'seletor_equipes':
        return <SeletorEquipes onEquipeSelecionada={handleEquipeSelecionada} />;
      default:
        return <LoginScreen onLogin={handleLogin} />;
    }
  };

  return (
    <div className="relative">
      {/* Botão de Logout fixo */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="bg-white/90 backdrop-blur-sm border-2 border-orange-200 hover:bg-orange-50"
        >
          🚪 Sair
        </Button>
      </div>

      {/* Navegação rápida para demonstração */}
      <div className="fixed top-4 left-4 z-50 space-x-2">
        <Button
          onClick={() => setCurrentUser({ type: 'producao' })}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm border-2 border-red-200 hover:bg-red-50"
        >
          🍽️ Produção
        </Button>
        <Button
          onClick={() => setCurrentUser({ type: 'lojinha' })}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm border-2 border-orange-200 hover:bg-orange-50"
        >
          🏪 Lojinha
        </Button>
        <Button
          onClick={() => setCurrentUser({ type: 'avaliador' })}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm border-2 border-purple-200 hover:bg-purple-50"
        >
          🧑‍🏫 Avaliador
        </Button>
        <Button
          onClick={() => setCurrentUser({ type: 'seletor_equipes' })}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm border-2 border-green-200 hover:bg-green-50"
        >
          👥 Equipes
        </Button>
      </div>

      {renderScreen()}
    </div>
  );
};

export default Index;
