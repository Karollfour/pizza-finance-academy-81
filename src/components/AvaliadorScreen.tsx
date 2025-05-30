
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePizzas } from '@/hooks/usePizzas';
import { useEquipes } from '@/hooks/useEquipes';
import { useRodadas } from '@/hooks/useRodadas';
import { toast } from 'sonner';

const AvaliadorScreen = () => {
  const { rodadaAtual } = useRodadas();
  const { pizzas, avaliarPizza } = usePizzas();
  const { equipes } = useEquipes();
  const [justifications, setJustifications] = useState<{ [key: string]: string }>({});

  const pizzasPendentes = pizzas.filter(p => p.status === 'pronta');
  const pizzasAvaliadas = pizzas.filter(p => p.status === 'avaliada');

  const handleEvaluation = async (pizzaId: string, approved: boolean) => {
    try {
      const justificativa = approved ? 'Pizza aprovada!' : justifications[pizzaId] || 'Não atende aos critérios';
      
      await avaliarPizza(
        pizzaId,
        approved ? 'aprovada' : 'reprovada',
        justificativa,
        'Avaliador'
      );

      // Limpar justificativa
      const newJustifications = { ...justifications };
      delete newJustifications[pizzaId];
      setJustifications(newJustifications);

      toast.success(`Pizza ${approved ? 'aprovada' : 'reprovada'} com sucesso!`);
    } catch (error) {
      toast.error('Erro ao avaliar pizza');
    }
  };

  const updateJustification = (pizzaId: string, text: string) => {
    setJustifications({
      ...justifications,
      [pizzaId]: text,
    });
  };

  const getEquipeNome = (equipeId: string) => {
    const equipe = equipes.find(e => e.id === equipeId);
    return equipe ? equipe.nome : 'Equipe não encontrada';
  };

  const getTeamStats = (equipeId: string) => {
    const pizzasEquipe = pizzas.filter(p => p.equipe_id === equipeId);
    const made = pizzasEquipe.length;
    const approved = pizzasEquipe.filter(p => p.resultado === 'aprovada').length;
    const rejected = pizzasEquipe.filter(p => p.resultado === 'reprovada').length;
    const successRate = made > 0 ? Math.round((approved / made) * 100) : 0;

    return { made, approved, rejected, successRate };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-600 mb-2">
            🧑‍🏫 Central de Avaliação
          </h1>
          <p className="text-gray-600">Avalie as pizzas produzidas pelas equipes</p>
          {rodadaAtual && (
            <div className="mt-4 p-3 bg-white/70 rounded-lg">
              <span className="text-lg font-semibold text-purple-800">
                Rodada {rodadaAtual.numero} - Status: {rodadaAtual.status}
              </span>
            </div>
          )}
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              🍕 Pendentes ({pizzasPendentes.length})
            </TabsTrigger>
            <TabsTrigger value="evaluated">
              ✅ Avaliadas ({pizzasAvaliadas.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              📊 Histórico das Equipes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            {pizzasPendentes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pizzasPendentes.map((pizza) => (
                  <Card key={pizza.id} className="shadow-lg border-2 border-yellow-200">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{getEquipeNome(pizza.equipe_id)}</span>
                        <Badge variant="outline">
                          Rodada {rodadaAtual?.numero || 'N/A'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Pizza #{pizza.id.slice(-6)} • Enviada: {new Date(pizza.created_at).toLocaleTimeString('pt-BR')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Visualização da Pizza */}
                      <div className="bg-gradient-to-br from-yellow-100 to-orange-100 p-6 rounded-lg text-center">
                        <div className="text-6xl mb-2">🍕</div>
                        <p className="text-gray-600">Pizza produzida pela {getEquipeNome(pizza.equipe_id)}</p>
                      </div>

                      {/* Área de Justificativa */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Justificativa (obrigatória para reprovação):
                        </label>
                        <Textarea
                          placeholder="Digite aqui os critérios avaliados, pontos fortes e áreas de melhoria..."
                          value={justifications[pizza.id] || ''}
                          onChange={(e) => updateJustification(pizza.id, e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>

                      {/* Botões de Avaliação */}
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleEvaluation(pizza.id, true)}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                        >
                          ✅ Aprovar
                        </Button>
                        <Button
                          onClick={() => handleEvaluation(pizza.id, false)}
                          disabled={!justifications[pizza.id]?.trim()}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                        >
                          ❌ Reprovar
                        </Button>
                      </div>

                      {!justifications[pizza.id]?.trim() && (
                        <p className="text-sm text-red-600 text-center">
                          Justificativa é obrigatória para reprovação
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="shadow-lg border-2 border-green-200">
                <CardContent className="text-center py-12">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-xl font-bold text-gray-600 mb-2">
                    Todas as pizzas foram avaliadas!
                  </h3>
                  <p className="text-gray-500">
                    Aguardando novas pizzas para avaliação
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="evaluated" className="space-y-6">
            {pizzasAvaliadas.length > 0 ? (
              <div className="space-y-4">
                {pizzasAvaliadas
                  .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                  .map((pizza) => (
                    <Card key={pizza.id} className="shadow-lg border-2 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-2xl">🍕</div>
                            <div>
                              <h3 className="font-bold">{getEquipeNome(pizza.equipe_id)}</h3>
                              <p className="text-sm text-gray-600">
                                Pizza #{pizza.id.slice(-6)} • Rodada {rodadaAtual?.numero || 'N/A'}
                              </p>
                              <p className="text-xs text-gray-500">
                                Avaliada: {new Date(pizza.updated_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={pizza.resultado === 'aprovada' ? 'default' : 'destructive'}
                              className={
                                pizza.resultado === 'aprovada'
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                              }
                            >
                              {pizza.resultado === 'aprovada' ? '✅ Aprovada' : '❌ Reprovada'}
                            </Badge>
                            {pizza.justificativa_reprovacao && (
                              <p className="text-sm text-gray-600 mt-2 max-w-xs">
                                "{pizza.justificativa_reprovacao}"
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <Card className="shadow-lg border-2 border-gray-200">
                <CardContent className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-bold text-gray-600 mb-2">
                    Nenhuma pizza avaliada ainda
                  </h3>
                  <p className="text-gray-500">
                    As pizzas avaliadas aparecerão aqui
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {equipes.map((equipe) => {
                const stats = getTeamStats(equipe.id);
                return (
                  <Card key={equipe.id} className="shadow-lg border-2 border-purple-200">
                    <CardHeader>
                      <CardTitle>{equipe.nome}</CardTitle>
                      <CardDescription>Histórico de desempenho</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Estatísticas Gerais */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-100 p-3 rounded-lg text-center">
                          <div className="text-xl font-bold text-blue-600">{stats.made}</div>
                          <div className="text-xs text-blue-700">Total Feitas</div>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg text-center">
                          <div className="text-xl font-bold text-green-600">{stats.successRate}%</div>
                          <div className="text-xs text-green-700">Taxa Sucesso</div>
                        </div>
                      </div>

                      <Separator />

                      {/* Estatísticas Detalhadas */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Resultados:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-green-600">✅ Aprovadas:</span>
                            <span className="font-medium">{stats.approved}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-600">❌ Reprovadas:</span>
                            <span className="font-medium">{stats.rejected}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AvaliadorScreen;
