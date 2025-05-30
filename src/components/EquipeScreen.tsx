
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRodadas } from '@/hooks/useRodadas';
import { usePizzas } from '@/hooks/usePizzas';
import { useEquipes } from '@/hooks/useEquipes';
import { useCompras } from '@/hooks/useCompras';
import { useProdutos } from '@/hooks/useProdutos';
import { toast } from 'sonner';

interface EquipeScreenProps {
  teamName: string;
}

const EquipeScreen = ({ teamName }: EquipeScreenProps) => {
  const { rodadaAtual } = useRodadas();
  const { equipes } = useEquipes();
  const [equipeAtual, setEquipeAtual] = useState<any>(null);
  const { pizzas, marcarPizzaPronta } = usePizzas(equipeAtual?.id, rodadaAtual?.id);
  const { compras } = useCompras(equipeAtual?.id);
  const { produtos } = useProdutos();
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

  const getProdutoNome = (produtoId: string | null) => {
    if (!produtoId) return 'Viagem';
    const produto = produtos.find(p => p.id === produtoId);
    return produto ? produto.nome : 'Produto não encontrado';
  };

  // Estatísticas da rodada atual
  const pizzasRodadaAtual = pizzas.filter(p => p.rodada_id === rodadaAtual?.id);
  const pizzasProntas = pizzasRodadaAtual.filter(p => p.status === 'pronta').length;
  const pizzasAprovadas = pizzasRodadaAtual.filter(p => p.resultado === 'aprovada').length;
  const pizzasReprovadas = pizzasRodadaAtual.filter(p => p.resultado === 'reprovada').length;

  // Estatísticas financeiras
  const totalGasto = compras.reduce((sum, c) => sum + c.valor_total, 0);
  const totalViagens = compras.filter(c => c.tipo === 'viagem').length;
  const gastoMateriais = compras.filter(c => c.tipo === 'material').reduce((sum, c) => sum + c.valor_total, 0);
  const gastoViagens = compras.filter(c => c.tipo === 'viagem').reduce((sum, c) => sum + c.valor_total, 0);
  const saldoRestante = (equipeAtual?.saldo_inicial || 0) - totalGasto;

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

        {/* Situação Financeira */}
        <Card className="shadow-lg border-2 border-blue-200 mb-6">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-600">💰 Situação Financeira</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
              <div className="bg-green-100 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  R$ {(equipeAtual?.saldo_inicial || 0).toFixed(2)}
                </div>
                <div className="text-sm text-green-700">Saldo Inicial</div>
              </div>
              <div className="bg-red-100 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  R$ {totalGasto.toFixed(2)}
                </div>
                <div className="text-sm text-red-700">Total Gasto</div>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  R$ {saldoRestante.toFixed(2)}
                </div>
                <div className="text-sm text-blue-700">Saldo Restante</div>
              </div>
              <div className="bg-orange-100 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{totalViagens}</div>
                <div className="text-sm text-orange-700">Viagens</div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <div className="text-lg font-bold text-purple-600">
                  R$ {gastoMateriais.toFixed(2)}
                </div>
                <div className="text-sm text-purple-700">Gastos com Materiais</div>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <div className="text-lg font-bold text-yellow-600">
                  R$ {gastoViagens.toFixed(2)}
                </div>
                <div className="text-sm text-yellow-700">Gastos com Viagens</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Pizzas */}
        <Card className="shadow-lg border-2 border-purple-200 mb-6">
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-purple-600">📊 Histórico de Pizzas</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {rodadaAtual && (
              <div className="mb-6 p-4 bg-white rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-600 mb-2">
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
              <h3 className="font-semibold text-purple-600">Histórico de Pizzas:</h3>
              {pizzas.length === 0 ? (
                <p className="text-gray-600 text-center py-4">Nenhuma pizza produzida ainda</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {pizzas
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((pizza, index) => (
                      <div key={pizza.id} className="p-3 bg-white rounded-lg border border-purple-200 flex justify-between items-center">
                        <div>
                          <div className="font-medium">Pizza #{pizzas.length - index}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(pizza.created_at).toLocaleString('pt-BR')}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              pizza.status === 'pronta' ? 'secondary' :
                              pizza.resultado === 'aprovada' ? 'default' :
                              pizza.resultado === 'reprovada' ? 'destructive' :
                              'outline'
                            }
                            className={
                              pizza.status === 'pronta' ? 'bg-yellow-500' :
                              pizza.resultado === 'aprovada' ? 'bg-green-500' :
                              pizza.resultado === 'reprovada' ? 'bg-red-500' :
                              ''
                            }
                          >
                            {pizza.status === 'pronta' && '🟡 Aguardando Avaliação'}
                            {pizza.resultado === 'aprovada' && '✅ Aprovada'}
                            {pizza.resultado === 'reprovada' && '❌ Reprovada'}
                          </Badge>
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

        {/* Histórico de Gastos */}
        <Card className="shadow-lg border-2 border-indigo-200">
          <CardHeader className="bg-indigo-50">
            <CardTitle className="text-indigo-600">🛒 Histórico de Gastos</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {compras.length === 0 ? (
              <p className="text-gray-600 text-center py-4">Nenhuma compra realizada ainda</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {compras
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((compra) => (
                    <div key={compra.id} className="p-3 bg-white rounded-lg border border-indigo-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-indigo-600">
                            {getProdutoNome(compra.produto_id)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {new Date(compra.created_at).toLocaleString('pt-BR')}
                          </div>
                          {compra.quantidade && compra.quantidade > 1 && (
                            <div className="text-sm text-gray-500">
                              Quantidade: {compra.quantidade}
                            </div>
                          )}
                          {compra.descricao && (
                            <div className="text-sm text-gray-500">
                              {compra.descricao}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant={compra.tipo === 'material' ? 'default' : 'secondary'}>
                            {compra.tipo === 'material' ? '🛒' : '🚗'}
                          </Badge>
                          <div className="text-lg font-bold text-green-600">
                            R$ {compra.valor_total.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EquipeScreen;
