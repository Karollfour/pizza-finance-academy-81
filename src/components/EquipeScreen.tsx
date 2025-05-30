
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useRodadas } from '@/hooks/useRodadas';
import { usePizzas } from '@/hooks/usePizzas';
import { useEquipes } from '@/hooks/useEquipes';
import { toast } from 'sonner';

interface EquipeScreenProps {
  teamName: string;
}

const EquipeScreen = ({ teamName }: EquipeScreenProps) => {
  const { rodadaAtual } = useRodadas();
  const { equipes } = useEquipes();
  const [equipeAtual, setEquipeAtual] = useState<any>(null);
  const { pizzas, marcarPizzaPronta } = usePizzas(equipeAtual?.id, rodadaAtual?.id);
  const [tempoRestante, setTempoRestante] = useState(0);

  // Encontrar a equipe pelo nome
  useEffect(() => {
    const equipe = equipes.find(e => e.nome === teamName);
    setEquipeAtual(equipe);
  }, [equipes, teamName]);

  // Timer da rodada
  useEffect(() => {
    if (!rodadaAtual || rodadaAtual.status !== 'ativa' || !rodadaAtual.iniciou_em) return;

    const inicioRodada = new Date(rodadaAtual.iniciou_em).getTime();
    const duracaoRodada = rodadaAtual.tempo_limite * 1000;

    const interval = setInterval(() => {
      const agora = Date.now();
      const tempoDecorrido = agora - inicioRodada;
      const resto = Math.max(0, duracaoRodada - tempoDecorrido);
      
      setTempoRestante(Math.ceil(resto / 1000));
      
      if (resto <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [rodadaAtual]);

  const handlePizzaPronta = async () => {
    if (!equipeAtual || !rodadaAtual) {
      toast.error('Não é possível marcar pizza como pronta no momento');
      return;
    }

    try {
      await marcarPizzaPronta(equipeAtual.id, rodadaAtual.id);
      toast.success('🍕 Pizza marcada como pronta!');
    } catch (error) {
      toast.error('Erro ao marcar pizza como pronta');
    }
  };

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const pizzasRodadaAtual = pizzas.filter(p => p.rodada_id === rodadaAtual?.id);
  const pizzasProntas = pizzasRodadaAtual.filter(p => p.status === 'pronta').length;
  const pizzasAprovadas = pizzasRodadaAtual.filter(p => p.resultado === 'aprovada').length;
  const pizzasReprovadas = pizzasRodadaAtual.filter(p => p.resultado === 'reprovada').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-orange-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-600 mb-2">👥 {teamName}</h1>
          <p className="text-orange-700">Central da Equipe</p>
        </div>

        {/* Status da Rodada */}
        <Card className="shadow-lg border-2 border-yellow-200 mb-6">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="text-yellow-600">⏰ Status da Rodada</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            {rodadaAtual ? (
              <div className="space-y-4">
                <div className="text-2xl font-bold text-yellow-600">
                  Rodada {rodadaAtual.numero}
                </div>
                <div className="text-lg">
                  Status: <span className="font-semibold capitalize">{rodadaAtual.status}</span>
                </div>
                {rodadaAtual.status === 'ativa' && (
                  <div className="text-3xl font-mono text-red-600">
                    ⏱️ {formatarTempo(tempoRestante)}
                  </div>
                )}
                {rodadaAtual.status === 'aguardando' && (
                  <div className="text-lg text-gray-600">Aguardando início da rodada</div>
                )}
                {rodadaAtual.status === 'finalizada' && (
                  <div className="text-lg text-green-600">Rodada finalizada!</div>
                )}
              </div>
            ) : (
              <div className="text-lg text-gray-600">Nenhuma rodada ativa</div>
            )}
          </CardContent>
        </Card>

        {/* Botão Pizza Pronta */}
        <Card className="shadow-lg border-2 border-green-200 mb-6">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-600">🍕 Produção de Pizza</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <Button
              onClick={handlePizzaPronta}
              disabled={!rodadaAtual || rodadaAtual.status !== 'ativa' || tempoRestante <= 0}
              className="text-2xl py-8 px-12 bg-green-500 hover:bg-green-600 disabled:bg-gray-300"
            >
              🟢 Pizza Pronta!
            </Button>
            {(!rodadaAtual || rodadaAtual.status !== 'ativa') && (
              <p className="mt-4 text-gray-600">Aguarde o início da rodada para produzir pizzas</p>
            )}
            {tempoRestante <= 0 && rodadaAtual?.status === 'ativa' && (
              <p className="mt-4 text-red-600">Tempo esgotado! Aguarde a próxima rodada.</p>
            )}
          </CardContent>
        </Card>

        {/* Histórico da Equipe */}
        <Card className="shadow-lg border-2 border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-600">📊 Histórico da Equipe</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {rodadaAtual && (
              <div className="mb-6 p-4 bg-white rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-600 mb-2">
                  Rodada {rodadaAtual.numero} - Estatísticas
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{pizzasProntas}</div>
                    <div className="text-sm text-gray-600">Pizzas Prontas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{pizzasAprovadas}</div>
                    <div className="text-sm text-gray-600">Aprovadas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{pizzasReprovadas}</div>
                    <div className="text-sm text-gray-600">Reprovadas</div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-semibold text-blue-600">Histórico de Pizzas:</h3>
              {pizzas.length === 0 ? (
                <p className="text-gray-600 text-center py-4">Nenhuma pizza produzida ainda</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {pizzas.map((pizza, index) => (
                    <div key={pizza.id} className="p-3 bg-white rounded-lg border border-blue-200 flex justify-between items-center">
                      <div>
                        <div className="font-medium">Pizza #{pizzas.length - index}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(pizza.created_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          pizza.status === 'pronta' ? 'text-yellow-600' :
                          pizza.resultado === 'aprovada' ? 'text-green-600' :
                          pizza.resultado === 'reprovada' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {pizza.status === 'pronta' && '🟡 Aguardando Avaliação'}
                          {pizza.resultado === 'aprovada' && '✅ Aprovada'}
                          {pizza.resultado === 'reprovada' && '❌ Reprovada'}
                        </div>
                        {pizza.resultado === 'reprovada' && pizza.justificativa_reprovacao && (
                          <div className="text-xs text-red-500 mt-1">
                            {pizza.justificativa_reprovacao}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EquipeScreen;
