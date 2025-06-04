
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo } from 'react';
import { usePizzas } from '@/hooks/usePizzas';
import { useEquipes } from '@/hooks/useEquipes';
import { useTodasRodadas } from '@/hooks/useTodasRodadas';

const TaktTimeChart = () => {
  const { pizzas } = usePizzas();
  const { equipes } = useEquipes();
  const { rodadas } = useTodasRodadas();
  const [rodadaSelecionada, setRodadaSelecionada] = useState<string>('');

  console.log('TaktTimeChart - Dados carregados:', {
    totalPizzas: pizzas.length,
    totalEquipes: equipes.length,
    totalRodadas: rodadas.length,
    pizzasComStatus: pizzas.filter(p => p.status === 'avaliada').length,
    pizzasAprovadas: pizzas.filter(p => p.resultado === 'aprovada').length
  });

  // Filtrar apenas rodadas finalizadas que têm pizzas
  const rodadasDisponiveis = useMemo(() => {
    const rodadasComPizzas = rodadas
      .filter(rodada => {
        const temPizzas = pizzas.some(pizza => pizza.rodada_id === rodada.id);
        const estaFinalizada = rodada.status === 'finalizada';
        console.log(`Rodada ${rodada.numero}: temPizzas=${temPizzas}, finalizada=${estaFinalizada}`);
        return temPizzas && estaFinalizada;
      })
      .sort((a, b) => b.numero - a.numero);
    
    console.log('Rodadas disponíveis para Timeline:', rodadasComPizzas.map(r => ({
      id: r.id,
      numero: r.numero,
      status: r.status
    })));
    
    return rodadasComPizzas;
  }, [rodadas, pizzas]);

  // Usar a rodada mais recente como padrão
  const rodadaAtual = useMemo(() => {
    if (!rodadaSelecionada && rodadasDisponiveis.length > 0) {
      const rodadaPadrao = rodadasDisponiveis[0];
      console.log('Usando rodada padrão:', rodadaPadrao.numero);
      return rodadaPadrao;
    }
    const rodadaEncontrada = rodadasDisponiveis.find(r => r.id === rodadaSelecionada) || null;
    console.log('Rodada selecionada:', rodadaEncontrada?.numero || 'nenhuma');
    return rodadaEncontrada;
  }, [rodadaSelecionada, rodadasDisponiveis]);

  // Preparar dados do timeline das pizzas
  const dadosTimeline = useMemo(() => {
    if (!rodadaAtual) {
      console.log('Sem rodada atual para calcular Timeline');
      return [];
    }

    console.log('Calculando Timeline para rodada:', rodadaAtual.numero);

    // Filtrar pizzas da rodada específica que foram enviadas para avaliação
    const pizzasDaRodada = pizzas.filter(pizza => 
      pizza.rodada_id === rodadaAtual.id && 
      pizza.status === 'avaliada'
    );

    console.log(`Pizzas enviadas para avaliação na rodada ${rodadaAtual.numero}:`, pizzasDaRodada.length);

    if (pizzasDaRodada.length === 0) {
      console.log('Nenhuma pizza encontrada para a rodada');
      return [];
    }

    // Obter horário de início da rodada
    const inicioRodada = rodadaAtual.iniciou_em ? new Date(rodadaAtual.iniciou_em).getTime() : null;
    
    if (!inicioRodada) {
      console.log('Rodada não tem horário de início registrado');
      return [];
    }

    console.log('Início da rodada:', new Date(inicioRodada).toISOString());

    // Mapear cada pizza para o timeline
    const dadosProcessados = pizzasDaRodada.map((pizza, index) => {
      const equipe = equipes.find(e => e.id === pizza.equipe_id);
      const tempoEnvio = new Date(pizza.updated_at || pizza.created_at).getTime();
      const tempoDecorrido = Math.max(0, (tempoEnvio - inicioRodada) / 1000); // em segundos
      
      console.log(`Pizza ${index + 1}:`, {
        equipe: equipe?.nome,
        resultado: pizza.resultado,
        enviadoEm: new Date(tempoEnvio).toISOString(),
        tempoDecorrido: tempoDecorrido.toFixed(1) + 's'
      });

      return {
        pizza: `Pizza ${index + 1}`,
        equipe: equipe?.nome || 'Equipe Desconhecida',
        tempo: Number(tempoDecorrido.toFixed(1)),
        resultado: pizza.resultado,
        corEquipe: equipe?.cor_tema || '#3b82f6',
        pizzaId: pizza.id,
        y: equipe?.nome || 'Equipe Desconhecida' // Para posicionamento no eixo Y
      };
    }).sort((a, b) => a.tempo - b.tempo);

    console.log('Dados processados para o timeline:', dadosProcessados);
    return dadosProcessados;
  }, [rodadaAtual, pizzas, equipes]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold">{data.pizza}</p>
          <p className="text-blue-600">{`Equipe: ${data.equipe}`}</p>
          <p className="text-green-600">{`Tempo: ${data.tempo}s`}</p>
          <p className={`font-medium ${data.resultado === 'aprovada' ? 'text-green-700' : 'text-red-700'}`}>
            {`Resultado: ${data.resultado === 'aprovada' ? 'Aprovada' : 'Reprovada'}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Agrupar dados por equipe para múltiplas séries
  const dadosPorEquipe = useMemo(() => {
    const grupos: { [key: string]: any[] } = {};
    
    dadosTimeline.forEach(item => {
      if (!grupos[item.equipe]) {
        grupos[item.equipe] = [];
      }
      grupos[item.equipe].push(item);
    });
    
    return grupos;
  }, [dadosTimeline]);

  const coresEquipes = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>⏱️ Timeline de Pizzas por Equipe</span>
          <Select value={rodadaSelecionada} onValueChange={setRodadaSelecionada}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={rodadaAtual ? `Rodada ${rodadaAtual.numero}` : "Selecione uma rodada"} />
            </SelectTrigger>
            <SelectContent>
              {rodadasDisponiveis.map(rodada => (
                <SelectItem key={rodada.id} value={rodada.id}>
                  Rodada {rodada.numero} (Finalizada)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {dadosTimeline.length > 0 ? (
          <>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">📊 Timeline das Pizzas</h4>
              <p className="text-sm text-blue-700">
                Cada ponto representa uma pizza enviada para avaliação. O eixo X mostra o tempo decorrido desde o início da rodada.
                Pizzas aprovadas aparecem como círculos cheios, reprovadas como círculos vazios.
              </p>
            </div>
            
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 30, left: 100, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="tempo"
                  domain={[0, rodadaAtual?.tempo_limite || 300]}
                  label={{ value: 'Tempo (segundos)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  type="category" 
                  dataKey="y"
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {Object.entries(dadosPorEquipe).map(([equipe, dados], index) => (
                  <Scatter
                    key={equipe}
                    name={equipe}
                    data={dados}
                    fill={coresEquipes[index % coresEquipes.length]}
                    shape={(props: any) => {
                      const { cx, cy, payload } = props;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill={payload.resultado === 'aprovada' ? coresEquipes[index % coresEquipes.length] : 'transparent'}
                          stroke={coresEquipes[index % coresEquipes.length]}
                          strokeWidth={2}
                        />
                      );
                    }}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>

            {/* Resumo dos dados */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-gray-700">
                  {rodadaAtual?.tempo_limite || 0}s
                </div>
                <div className="text-sm text-gray-600">Tempo Total da Rodada</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-blue-700">
                  {dadosTimeline.length}
                </div>
                <div className="text-sm text-blue-600">Pizzas Enviadas</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-green-700">
                  {dadosTimeline.filter(d => d.resultado === 'aprovada').length}
                </div>
                <div className="text-sm text-green-600">Pizzas Aprovadas</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-red-700">
                  {dadosTimeline.filter(d => d.resultado === 'reprovada').length}
                </div>
                <div className="text-sm text-red-600">Pizzas Reprovadas</div>
              </div>
            </div>

            {/* Detalhes por equipe */}
            <div className="mt-6">
              <h4 className="font-semibold text-gray-800 mb-3">📈 Desempenho por Equipe</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(dadosPorEquipe).map(([equipe, dados]) => {
                  const aprovadas = dados.filter(d => d.resultado === 'aprovada').length;
                  const reprovadas = dados.filter(d => d.resultado === 'reprovada').length;
                  const tempoMedio = dados.reduce((sum, d) => sum + d.tempo, 0) / dados.length;
                  
                  return (
                    <div key={equipe} className="bg-white border border-gray-200 p-3 rounded-lg">
                      <h5 className="font-semibold text-sm mb-2">{equipe}</h5>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Total:</span>
                          <span className="font-medium">{dados.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Aprovadas:</span>
                          <span className="font-medium text-green-600">{aprovadas}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Reprovadas:</span>
                          <span className="font-medium text-red-600">{reprovadas}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tempo Médio:</span>
                          <span className="font-medium">{tempoMedio.toFixed(1)}s</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Debug: Mostrar dados brutos se necessário */}
            {dadosTimeline.length === 0 && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Debug Info</h4>
                <p className="text-sm text-yellow-700 mb-2">
                  Nenhuma pizza encontrada no timeline. Verificando dados:
                </p>
                <div className="text-xs text-yellow-600 space-y-1">
                  <div>Total de pizzas no sistema: {pizzas.length}</div>
                  <div>Pizzas da rodada {rodadaAtual?.numero}: {pizzas.filter(p => p.rodada_id === rodadaAtual?.id).length}</div>
                  <div>Pizzas avaliadas: {pizzas.filter(p => p.rodada_id === rodadaAtual?.id && p.status === 'avaliada').length}</div>
                  <div>Rodada iniciou em: {rodadaAtual?.iniciou_em || 'Não registrado'}</div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">📊 Sem dados disponíveis</p>
            <p className="text-sm">
              {rodadasDisponiveis.length === 0 
                ? "Nenhuma rodada finalizada com pizzas encontrada" 
                : "Selecione uma rodada para visualizar o timeline das pizzas"}
            </p>
            
            {/* Debug adicional quando não há dados */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left">
              <h4 className="font-semibold text-gray-700 mb-2">🔍 Status do Sistema:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Total de rodadas: {rodadas.length}</div>
                <div>Rodadas finalizadas: {rodadas.filter(r => r.status === 'finalizada').length}</div>
                <div>Total de pizzas: {pizzas.length}</div>
                <div>Equipes cadastradas: {equipes.length}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaktTimeChart;
