import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOptimizedRodadas } from '@/hooks/useOptimizedRodadas';
import { usePizzas } from '@/hooks/usePizzas';
import { useEquipes } from '@/hooks/useEquipes';
import { useCompras } from '@/hooks/useCompras';
import { useSabores } from '@/hooks/useSabores';
import { usePersistedState } from '@/hooks/usePersistedState';
import DashboardLojinha from './DashboardLojinha';
import ComprasPorEquipe from './ComprasPorEquipe';
import { toast } from 'sonner';

const LojinhaScreen = () => {
  const { rodadaAtual } = useOptimizedRodadas();
  const { equipes } = useEquipes();
  const { pizzas } = usePizzas();
  const { compras } = useCompras();
  const { sabores } = useSabores();
  
  // Persistir estado da tela ativa
  const [activeTab, setActiveTab] = usePersistedState('lojinha-active-tab', 'dashboard');
  const [selectedEquipe, setSelectedEquipe] = usePersistedState('lojinha-selected-equipe', '');

  // Estados para estatísticas
  const [estatisticasGerais, setEstatisticasGerais] = useState({
    totalPizzas: 0,
    pizzasAprovadas: 0,
    pizzasReprovadas: 0,
    pizzasPendentes: 0,
    totalGastos: 0,
    equipesAtivas: 0
  });

  // Calcular estatísticas em tempo real
  useEffect(() => {
    const totalPizzas = pizzas.length;
    const pizzasAprovadas = pizzas.filter(p => p.resultado === 'aprovada').length;
    const pizzasReprovadas = pizzas.filter(p => p.resultado === 'reprovada').length;
    const pizzasPendentes = pizzas.filter(p => p.status === 'pronta').length;
    const totalGastos = compras.reduce((sum, c) => sum + c.valor_total, 0);
    const equipesAtivas = equipes.length;

    setEstatisticasGerais({
      totalPizzas,
      pizzasAprovadas,
      pizzasReprovadas,
      pizzasPendentes,
      totalGastos,
      equipesAtivas
    });
  }, [pizzas, compras, equipes]);

  // Escutar eventos globais para feedback em tempo real
  useEffect(() => {
    const handlePizzaEnviada = (event: CustomEvent) => {
      const { pizza } = event.detail;
      toast.success(`🍕 Nova pizza ${pizza.sabor?.nome || 'sem sabor'} enviada para avaliação!`, {
        duration: 3000,
      });
    };

    const handlePizzaAvaliada = (event: CustomEvent) => {
      const { resultado } = event.detail;
      const emoji = resultado === 'aprovada' ? '✅' : '❌';
      toast.info(`${emoji} Pizza ${resultado}!`, {
        duration: 3000,
      });
    };

    const handleCompraRealizada = (event: CustomEvent) => {
      const { valor } = event.detail;
      toast.info(`💰 Nova compra: R$ ${valor.toFixed(2)}`, {
        duration: 2000,
      });
    };

    window.addEventListener('pizza-enviada-com-sabor', handlePizzaEnviada as EventListener);
    window.addEventListener('pizza-avaliada', handlePizzaAvaliada as EventListener);
    window.addEventListener('compra-realizada', handleCompraRealizada as EventListener);

    return () => {
      window.removeEventListener('pizza-enviada-com-sabor', handlePizzaEnviada as EventListener);
      window.removeEventListener('pizza-avaliada', handlePizzaAvaliada as EventListener);
      window.removeEventListener('compra-realizada', handleCompraRealizada as EventListener);
    };
  }, []);

  const getSaborNome = (saborId: string) => {
    const sabor = sabores.find(s => s.id === saborId);
    return sabor?.nome || 'Sabor não informado';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">🏪 Lojinha Virtual</h1>
          <p className="text-gray-600">Gerencie compras, vendas e monitore o progresso das equipes</p>
          
          {/* Status da Rodada */}
          <Card className="mt-4 shadow-lg border-2 border-blue-200">
            <CardContent className="p-4">
              {rodadaAtual ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-blue-600">Rodada {rodadaAtual.numero}</div>
                    <div className="text-sm text-gray-600 capitalize">{rodadaAtual.status}</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-600">{estatisticasGerais.pizzasAprovadas}</div>
                    <div className="text-sm text-gray-600">Aprovadas</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-orange-600">{estatisticasGerais.pizzasPendentes}</div>
                    <div className="text-sm text-gray-600">Pendentes</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-purple-600">R$ {estatisticasGerais.totalGastos.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Total Gastos</div>
                  </div>
                </div>
              ) : (
                <div className="text-lg text-gray-600">Nenhuma rodada ativa</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo Principal com Abas Persistentes */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
            <TabsTrigger value="compras">💰 Compras por Equipe</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-6">
            <DashboardLojinha />
          </TabsContent>
          
          <TabsContent value="compras" className="mt-6">
            <ComprasPorEquipe 
              selectedEquipe={selectedEquipe}
              onEquipeChange={setSelectedEquipe}
            />
          </TabsContent>
        </Tabs>

        {/* Estatísticas Rápidas */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center p-4 bg-white shadow-lg">
            <div className="text-2xl font-bold text-blue-600">{estatisticasGerais.totalPizzas}</div>
            <div className="text-sm text-gray-600">Total de Pizzas</div>
          </Card>
          <Card className="text-center p-4 bg-white shadow-lg">
            <div className="text-2xl font-bold text-green-600">{estatisticasGerais.pizzasAprovadas}</div>
            <div className="text-sm text-gray-600">Aprovadas</div>
          </Card>
          <Card className="text-center p-4 bg-white shadow-lg">
            <div className="text-2xl font-bold text-red-600">{estatisticasGerais.pizzasReprovadas}</div>
            <div className="text-sm text-gray-600">Reprovadas</div>
          </Card>
          <Card className="text-center p-4 bg-white shadow-lg">
            <div className="text-2xl font-bold text-purple-600">{estatisticasGerais.equipesAtivas}</div>
            <div className="text-sm text-gray-600">Equipes Ativas</div>
          </Card>
        </div>

        {/* Lista de Pizzas Recentes - Atualização em Tempo Real */}
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-600">🍕 Pizzas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {pizzas
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 10)
                .map((pizza) => {
                  const equipe = equipes.find(e => e.id === pizza.equipe_id);
                  const saborNome = pizza.sabor?.nome || 'Sabor não informado';
                  
                  return (
                    <div key={pizza.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">🍕</div>
                        <div>
                          <div className="font-medium">{equipe?.nome || 'Equipe desconhecida'}</div>
                          <div className="text-sm text-gray-600">
                            {saborNome} • {new Date(pizza.created_at).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      <Badge 
                        className={
                          pizza.resultado === 'aprovada' ? 'bg-green-500' :
                          pizza.resultado === 'reprovada' ? 'bg-red-500' :
                          pizza.status === 'pronta' ? 'bg-blue-500' : 'bg-yellow-500'
                        }
                      >
                        {pizza.resultado === 'aprovada' ? 'Aprovada' :
                         pizza.resultado === 'reprovada' ? 'Reprovada' :
                         pizza.status === 'pronta' ? 'Aguardando' : 'Em Produção'}
                      </Badge>
                    </div>
                  );
                })}
              
              {pizzas.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🍕</div>
                  <p>Nenhuma pizza produzida ainda</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LojinhaScreen;
