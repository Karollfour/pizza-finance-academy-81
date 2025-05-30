
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Pizza {
  id: string;
  teamName: string;
  status: 'production' | 'ready' | 'evaluated';
  round: number;
  completedAt?: Date;
}

const ProducaoScreen = () => {
  const [currentRound, setCurrentRound] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutos
  const [isRoundActive, setIsRoundActive] = useState(true);
  
  const [pizzasInProduction, setPizzasInProduction] = useState<Pizza[]>([
    { id: '1', teamName: 'Equipe Pepperoni', status: 'production', round: 1 },
    { id: '2', teamName: 'Equipe Margherita', status: 'production', round: 1 },
    { id: '3', teamName: 'Equipe Calabresa', status: 'production', round: 1 },
  ]);

  const [pizzasNext1, setPizzasNext1] = useState<Pizza[]>([]);
  const [pizzasNext2, setPizzasNext2] = useState<Pizza[]>([]);
  const [completedPizzas, setCompletedPizzas] = useState<Pizza[]>([]);

  const [teamsReady, setTeamsReady] = useState(new Set<string>());

  useEffect(() => {
    if (isRoundActive && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      setIsRoundActive(false);
      // Finalizar rodada automaticamente
      finalizeRound();
    }
  }, [timeRemaining, isRoundActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTeamReady = (teamName: string) => {
    const newTeamsReady = new Set(teamsReady);
    newTeamsReady.add(teamName);
    setTeamsReady(newTeamsReady);

    // Verificar se 50% das equipes estão prontas
    const totalTeams = pizzasInProduction.length;
    const readyTeams = newTeamsReady.size;
    
    if (readyTeams >= Math.ceil(totalTeams * 0.5)) {
      advanceProduction();
    }
  };

  const advanceProduction = () => {
    // Mover pizzas "Em Produção" para "Concluídas"
    const newCompleted = pizzasInProduction.map(pizza => ({
      ...pizza,
      status: 'ready' as const,
      completedAt: new Date(),
    }));

    // Mover "Seguinte 1" para "Em Produção"
    const newProduction = pizzasNext1.map(pizza => ({
      ...pizza,
      status: 'production' as const,
    }));

    // Mover "Seguinte 2" para "Seguinte 1"
    const newNext1 = pizzasNext2.map(pizza => ({ ...pizza }));

    setCompletedPizzas([...completedPizzas, ...newCompleted]);
    setPizzasInProduction(newProduction);
    setPizzasNext1(newNext1);
    setPizzasNext2([]);
    setTeamsReady(new Set());
  };

  const finalizeRound = () => {
    setIsRoundActive(false);
    // Aqui você enviaria os dados para o dashboard
    console.log('Dados da rodada finalizados:', {
      round: currentRound,
      completed: completedPizzas,
      teamsReady: Array.from(teamsReady),
    });
  };

  const progressPercentage = ((300 - timeRemaining) / 300) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-600 mb-2">
            🍽️ Central de Produção
          </h1>
          <p className="text-gray-600">Acompanhe o status das pizzas em tempo real</p>
        </div>

        {/* Timer e Status da Rodada */}
        <Card className="pizza-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Rodada {currentRound}</span>
              <Badge variant={isRoundActive ? "default" : "secondary"}>
                {isRoundActive ? "Em Andamento" : "Finalizada"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600 mb-2">
                  {formatTime(timeRemaining)}
                </div>
                <Progress value={progressPercentage} className="w-full" />
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{teamsReady.size}</div>
                  <div className="text-sm text-blue-700">Equipes Prontas</div>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{completedPizzas.length}</div>
                  <div className="text-sm text-green-700">Pizzas Concluídas</div>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{pizzasInProduction.length}</div>
                  <div className="text-sm text-orange-700">Em Produção</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status da Produção */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Em Produção */}
          <Card className="border-2 border-red-300 bg-gradient-to-br from-red-50 to-red-100">
            <CardHeader className="text-center">
              <CardTitle className="text-red-600">
                🧑‍🍳 Em Produção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pizzasInProduction.map((pizza) => (
                  <div key={pizza.id} className="bg-white p-3 rounded-lg shadow border-l-4 border-red-500">
                    <div className="font-bold text-gray-800">{pizza.teamName}</div>
                    <div className="text-sm text-gray-600">Pizza #{pizza.id}</div>
                    {teamsReady.has(pizza.teamName) && (
                      <Badge className="mt-2 bg-green-500">✅ Pronta</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Seguinte 1 */}
          <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader className="text-center">
              <CardTitle className="text-orange-600">
                📦 Seguinte 1
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pizzasNext1.length > 0 ? (
                  pizzasNext1.map((pizza) => (
                    <div key={pizza.id} className="bg-white p-3 rounded-lg shadow border-l-4 border-orange-500">
                      <div className="font-bold text-gray-800">{pizza.teamName}</div>
                      <div className="text-sm text-gray-600">Pizza #{pizza.id}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-3xl mb-2">⏳</div>
                    <p>Aguardando próximas pizzas</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seguinte 2 */}
          <Card className="border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardHeader className="text-center">
              <CardTitle className="text-yellow-600">
                📦 Seguinte 2
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pizzasNext2.length > 0 ? (
                  pizzasNext2.map((pizza) => (
                    <div key={pizza.id} className="bg-white p-3 rounded-lg shadow border-l-4 border-yellow-500">
                      <div className="font-bold text-gray-800">{pizza.teamName}</div>
                      <div className="text-sm text-gray-600">Pizza #{pizza.id}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-3xl mb-2">⏳</div>
                    <p>Aguardando próximas pizzas</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Histórico de Pizzas Concluídas */}
        <Card className="pizza-card">
          <CardHeader>
            <CardTitle className="text-green-600">
              ✅ Pizzas Concluídas - Rodada {currentRound}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completedPizzas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedPizzas.map((pizza) => (
                  <div key={pizza.id} className="bg-gradient-to-r from-green-100 to-green-200 p-4 rounded-lg shadow border-l-4 border-green-500">
                    <div className="font-bold text-gray-800">{pizza.teamName}</div>
                    <div className="text-sm text-gray-600">Pizza #{pizza.id}</div>
                    {pizza.completedAt && (
                      <div className="text-xs text-green-700 mt-1">
                        Concluída: {pizza.completedAt.toLocaleTimeString()}
                      </div>
                    )}
                    <Badge className="mt-2 bg-green-500">
                      🍕 Aguardando Avaliação
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <div className="text-6xl mb-4">🍕</div>
                <p className="text-xl">Nenhuma pizza concluída ainda</p>
                <p className="text-gray-400">As pizzas prontas aparecerão aqui</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProducaoScreen;
