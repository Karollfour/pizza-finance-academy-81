
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Pizza {
  id: string;
  teamName: string;
  round: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  evaluatedAt?: Date;
  justification?: string;
}

interface TeamHistory {
  teamName: string;
  rounds: {
    round: number;
    made: number;
    approved: number;
    rejected: number;
  }[];
}

const AvaliadorScreen = () => {
  const [pendingPizzas, setPendingPizzas] = useState<Pizza[]>([
    {
      id: '1',
      teamName: 'Equipe Pepperoni',
      round: 1,
      status: 'pending',
      submittedAt: new Date(),
    },
    {
      id: '2',
      teamName: 'Equipe Margherita',
      round: 1,
      status: 'pending',
      submittedAt: new Date(),
    },
    {
      id: '3',
      teamName: 'Equipe Calabresa',
      round: 1,
      status: 'pending',
      submittedAt: new Date(),
    },
  ]);

  const [evaluatedPizzas, setEvaluatedPizzas] = useState<Pizza[]>([]);
  const [justifications, setJustifications] = useState<{ [key: string]: string }>({});

  const [teamHistories] = useState<TeamHistory[]>([
    {
      teamName: 'Equipe Pepperoni',
      rounds: [
        { round: 1, made: 2, approved: 1, rejected: 1 },
      ],
    },
    {
      teamName: 'Equipe Margherita',
      rounds: [
        { round: 1, made: 3, approved: 2, rejected: 1 },
      ],
    },
    {
      teamName: 'Equipe Calabresa',
      rounds: [
        { round: 1, made: 1, approved: 1, rejected: 0 },
      ],
    },
  ]);

  const handleEvaluation = (pizzaId: string, approved: boolean) => {
    const pizza = pendingPizzas.find(p => p.id === pizzaId);
    if (!pizza) return;

    const evaluatedPizza: Pizza = {
      ...pizza,
      status: approved ? 'approved' : 'rejected',
      evaluatedAt: new Date(),
      justification: approved ? 'Pizza aprovada!' : justifications[pizzaId] || 'Não atende aos critérios',
    };

    setPendingPizzas(pendingPizzas.filter(p => p.id !== pizzaId));
    setEvaluatedPizzas([...evaluatedPizzas, evaluatedPizza]);
    
    // Limpar justificativa
    const newJustifications = { ...justifications };
    delete newJustifications[pizzaId];
    setJustifications(newJustifications);
  };

  const updateJustification = (pizzaId: string, text: string) => {
    setJustifications({
      ...justifications,
      [pizzaId]: text,
    });
  };

  const getTeamStats = (teamName: string) => {
    const history = teamHistories.find(h => h.teamName === teamName);
    if (!history) return { made: 0, approved: 0, rejected: 0, successRate: 0 };

    const totals = history.rounds.reduce(
      (acc, round) => ({
        made: acc.made + round.made,
        approved: acc.approved + round.approved,
        rejected: acc.rejected + round.rejected,
      }),
      { made: 0, approved: 0, rejected: 0 }
    );

    return {
      ...totals,
      successRate: totals.made > 0 ? Math.round((totals.approved / totals.made) * 100) : 0,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-600 mb-2">
            🧑‍🏫 Central de Avaliação
          </h1>
          <p className="text-gray-600">Avalie as pizzas produzidas pelas equipes</p>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              🍕 Pendentes ({pendingPizzas.length})
            </TabsTrigger>
            <TabsTrigger value="evaluated">
              ✅ Avaliadas ({evaluatedPizzas.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              📊 Histórico das Equipes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            {pendingPizzas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingPizzas.map((pizza) => (
                  <Card key={pizza.id} className="pizza-card">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{pizza.teamName}</span>
                        <Badge variant="outline">Rodada {pizza.round}</Badge>
                      </CardTitle>
                      <CardDescription>
                        Pizza #{pizza.id} • Enviada: {pizza.submittedAt.toLocaleTimeString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Visualização da Pizza */}
                      <div className="bg-gradient-to-br from-yellow-100 to-orange-100 p-6 rounded-lg text-center">
                        <div className="text-6xl mb-2">🍕</div>
                        <p className="text-gray-600">Pizza produzida pela {pizza.teamName}</p>
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
              <Card className="pizza-card">
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
            {evaluatedPizzas.length > 0 ? (
              <div className="space-y-4">
                {evaluatedPizzas.map((pizza) => (
                  <Card key={pizza.id} className="pizza-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">🍕</div>
                          <div>
                            <h3 className="font-bold">{pizza.teamName}</h3>
                            <p className="text-sm text-gray-600">
                              Pizza #{pizza.id} • Rodada {pizza.round}
                            </p>
                            <p className="text-xs text-gray-500">
                              Avaliada: {pizza.evaluatedAt?.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={pizza.status === 'approved' ? 'default' : 'destructive'}
                            className={
                              pizza.status === 'approved'
                                ? 'bg-green-500'
                                : 'bg-red-500'
                            }
                          >
                            {pizza.status === 'approved' ? '✅ Aprovada' : '❌ Reprovada'}
                          </Badge>
                          {pizza.justification && (
                            <p className="text-sm text-gray-600 mt-2 max-w-xs">
                              "{pizza.justification}"
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="pizza-card">
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
              {teamHistories.map((team) => {
                const stats = getTeamStats(team.teamName);
                return (
                  <Card key={team.teamName} className="team-card">
                    <CardHeader>
                      <CardTitle>{team.teamName}</CardTitle>
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

                      {/* Histórico por Rodada */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Por Rodada:</h4>
                        {team.rounds.map((round) => (
                          <div key={round.round} className="border border-gray-200 rounded p-2 text-sm">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium">Rodada {round.round}</span>
                              <span className="text-gray-500">{round.made} pizzas</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-green-600">✅ {round.approved}</span>
                              <span className="text-red-600">❌ {round.rejected}</span>
                            </div>
                          </div>
                        ))}
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
