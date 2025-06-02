
import { useState, useCallback } from 'react';
import LoginScreen from '@/components/LoginScreen';
import LojinhaScreen from '@/components/LojinhaScreen';
import ProducaoScreen from '@/components/ProducaoScreen';
import EquipeScreen from '@/components/EquipeScreen';
import AvaliadorScreen from '@/components/AvaliadorScreen';
import SeletorEquipes from '@/components/SeletorEquipes';
import { useGlobalRealtime } from '@/hooks/useGlobalRealtime';
import { GlobalRealtimeContext } from '@/hooks/useGlobalRealtime';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('producao');
  const [selectedTeam, setSelectedTeam] = useState<{ nome: string; id: string } | null>(null);

  // Inicializar sistema global de realtime - completamente silencioso
  const { contextValue } = useGlobalRealtime({
    enableHeartbeat: true,
    silent: true
  });

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setSelectedTeam(null);
    setActiveTab('producao');
  };

  const handleEquipeSelecionada = useCallback((equipeNome: string, equipeId: string) => {
    // Atualizar estado atomicamente para evitar condições de corrida
    setSelectedTeam({ nome: equipeNome, id: equipeId });
    setActiveTab('equipes');
  }, []);

  const handleVoltarSeletor = useCallback(() => {
    setSelectedTeam(null);
    // Manter na aba equipes para melhor UX
  }, []);

  // Se não estiver logado, mostrar tela de login
  if (!isLoggedIn) {
    return (
      <GlobalRealtimeContext.Provider value={contextValue}>
        <LoginScreen onLogin={handleLogin} />
      </GlobalRealtimeContext.Provider>
    );
  }

  return (
    <GlobalRealtimeContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 to-red-100">
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

        {/* Sistema de Abas Principal */}
        <div className="pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-white/80 backdrop-blur-sm">
                <TabsTrigger value="producao" className="text-red-600 data-[state=active]:bg-red-100">
                  🍽️ Produção
                </TabsTrigger>
                <TabsTrigger value="lojinha" className="text-orange-600 data-[state=active]:bg-orange-100">
                  🏪 Lojinha
                </TabsTrigger>
                <TabsTrigger value="avaliador" className="text-purple-600 data-[state=active]:bg-purple-100">
                  🧑‍🏫 Avaliador
                </TabsTrigger>
                <TabsTrigger value="equipes" className="text-green-600 data-[state=active]:bg-green-100">
                  👥 Equipes
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="producao" className="mt-0">
              <ProducaoScreen />
            </TabsContent>

            <TabsContent value="lojinha" className="mt-0">
              <LojinhaScreen />
            </TabsContent>

            <TabsContent value="avaliador" className="mt-0">
              <AvaliadorScreen />
            </TabsContent>

            <TabsContent value="equipes" className="mt-0">
              {selectedTeam ? (
                <div>
                  <div className="flex justify-center mb-4">
                    <Button 
                      onClick={handleVoltarSeletor}
                      variant="outline"
                      className="bg-white/90 backdrop-blur-sm"
                    >
                      ← Voltar para Seleção de Equipes
                    </Button>
                  </div>
                  <EquipeScreen teamName={selectedTeam.nome} teamId={selectedTeam.id} />
                </div>
              ) : (
                <SeletorEquipes onEquipeSelecionada={handleEquipeSelecionada} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </GlobalRealtimeContext.Provider>
  );
};

export default Index;
