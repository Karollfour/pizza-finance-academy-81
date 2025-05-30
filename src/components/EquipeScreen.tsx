
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface EquipeScreenProps {
  teamName: string;
}

interface PizzaHistory {
  round: number;
  made: number;
  approved: number;
  rejected: number;
}

const EquipeScreen = ({ teamName }: EquipeScreenProps) => {
  const [isPizzaReady, setIsPizzaReady] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [roundStatus, setRoundStatus] = useState<'production' | 'next1' | 'next2' | 'completed'>('production');
  
  const [history, setHistory] = useState<PizzaHistory[]>([
    { round: 1, made: 0, approved: 0, rejected: 0 },
  ]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePizzaReady = () => {
    if (!isPizzaReady) {
      setIsPizzaReady(true);
      
      // Atualizar histórico
      const updatedHistory = history.map(h => 
        h.round === currentRound 
          ? { ...h, made: h.made + 1 }
          : h
      );
      setHistory(updatedHistory);
      
      // Simular que a pizza foi enviada para avaliação
      setTimeout(() => {
        setIsPizzaReady(false);
      }, 2000);
    }
  };

  const getStatusBadge = () => {
    switch (roundStatus) {
      case 'production':
        return <Badge className="bg-red-500">🧑‍🍳 Em Produção</Badge>;
      case 'next1':
        return <Badge className="bg-orange-500">📦 Seguinte 1</Badge>;
      case 'next2':
        return <Badge className="bg-yellow-500">📦 Seguinte 2</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">✅ Concluída</Badge>;
      default:
        return <Badge variant="secondary">Aguardando</Badge>;
    }
  };

  const currentHistory = history.find(h => h.round === currentRound) || { round: currentRound, made: 0, approved: 0, rejected: 0 };
  const progressPercentage = ((300 - timeRemaining) / 300) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">
            👥 {teamName}
          </h1>
          <p className="text-gray-600">Sua estação de trabalho na pizzaria</p>
        </div>

        {/* Status da Rodada */}
        <Card className="pizza-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Rodada {currentRound}</span>
              {getStatusBadge()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  ⏱️ {formatTime(timeRemaining)}
                </div>
                <Progress value={progressPercentage} className="w-full" />
                <p className="text-sm text-gray-600 mt-2">Tempo restante da rodada</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão Pizza Pronta */}
        <Card className="pizza-card mb-6">
          <CardHeader>
            <CardTitle className="text-center">🍕 Produção de Pizza</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {roundStatus === 'production' ? (
              <>
                <div className="text-6xl animate-pizza-spin">🍕</div>
                <Button
                  onClick={handlePizzaReady}
                  disabled={isPizzaReady || timeRemaining === 0}
                  className={`text-2xl py-6 px-12 ${
                    isPizzaReady 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'pizza-button'
                  }`}
                >
                  {isPizzaReady ? '✅ Pizza Enviada!' : '🟢 Pizza Pronta!'}
                </Button>
                {isPizzaReady && (
                  <p className="text-green-600 font-bold animate-bounce">
                    Pizza enviada para avaliação! 🎉
                  </p>
                )}
              </>
            ) : (
              <div className="py-8">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-xl text-gray-600">
                  {roundStatus === 'next1' && 'Sua pizza está na fila: Seguinte 1'}
                  {roundStatus === 'next2' && 'Sua pizza está na fila: Seguinte 2'}
                  {roundStatus === 'completed' && 'Pizza concluída! Aguardando próxima rodada'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico da Equipe */}
        <Card className="pizza-card">
          <CardHeader>
            <CardTitle>📊 Histórico da Equipe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Estatísticas da Rodada Atual */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-100 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{currentHistory.made}</div>
                  <div className="text-sm text-blue-700">Pizzas Feitas</div>
                </div>
                <div className="bg-green-100 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{currentHistory.approved}</div>
                  <div className="text-sm text-green-700">Aprovadas</div>
                </div>
                <div className="bg-red-100 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{currentHistory.rejected}</div>
                  <div className="text-sm text-red-700">Reprovadas</div>
                </div>
              </div>

              <Separator />

              {/* Histórico de Rodadas Anteriores */}
              <div className="space-y-3">
                <h3 className="font-bold text-lg">📈 Histórico de Rodadas</h3>
                {history.map((round) => (
                  <div key={round.round} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Rodada {round.round}</span>
                      {round.round === currentRound && (
                        <Badge variant="default">Atual</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-blue-600">{round.made}</div>
                        <div className="text-gray-600">Feitas</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-green-600">{round.approved}</div>
                        <div className="text-gray-600">Aprovadas</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-red-600">{round.rejected}</div>
                        <div className="text-gray-600">Reprovadas</div>
                      </div>
                    </div>
                    {round.made > 0 && (
                      <div className="mt-2 text-center">
                        <span className="text-sm text-gray-600">
                          Taxa de Aprovação: {Math.round((round.approved / round.made) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Totais Gerais */}
              <Separator />
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-2">🏆 Totais Gerais</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-purple-600">
                      {history.reduce((sum, round) => sum + round.made, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total de Pizzas</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-600">
                      {history.reduce((sum, round) => sum + round.made, 0) > 0 
                        ? Math.round((history.reduce((sum, round) => sum + round.approved, 0) / history.reduce((sum, round) => sum + round.made, 0)) * 100)
                        : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Taxa de Sucesso</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EquipeScreen;
