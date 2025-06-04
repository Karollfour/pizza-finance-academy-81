
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo } from 'react';
import { calcularTaktTime, obterDadosRodadaParaTakt } from '@/utils/taktTimeCalculations';
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
    
    console.log('Rodadas disponíveis para Takt Time:', rodadasComPizzas.map(r => ({
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

  // Calcular dados do Takt Time
  const dadosTaktTime = useMemo(() => {
    if (!rodadaAtual) {
      console.log('Sem rodada atual para calcular Takt Time');
      return [];
    }

    console.log('Calculando Takt Time para rodada:', rodadaAtual.numero);

    const dadosRodada = obterDadosRodadaParaTakt(
      rodadaAtual.id,
      pizzas,
      rodadaAtual,
      10 // Pizzas planejadas padrão - pode ser configurável
    );

    if (!dadosRodada) {
      console.log('Não foi possível obter dados da rodada');
      return [];
    }

    console.log('Dados da rodada obtidos:', {
      pizzasPlanejadas: dadosRodada.pizzasPlanejadas,
      tempoTotal: dadosRodada.tempoTotalSegundos,
      pizzasEntreguesPorEquipe: dadosRodada.pizzasEntreguesPorEquipe
    });

    const resultados = calcularTaktTime(dadosRodada, equipes);
    console.log('Resultados do Takt Time:', resultados);
    
    return resultados;
  }, [rodadaAtual, pizzas, equipes]);

  // Preparar dados para o gráfico
  const dadosGrafico = dadosTaktTime.map(data => ({
    equipe: data.equipeNome,
    taktTime: data.taktTime,
    pizzasEntregues: data.pizzasEntregues,
    tempoMedioPorPizza: data.tempoMedioPorPizza
  }));

  console.log('Dados preparados para o gráfico:', dadosGrafico);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold">{`Equipe: ${label}`}</p>
          <p className="text-blue-600">{`Takt Time: ${data.taktTime.toFixed(2)}s`}</p>
          <p className="text-green-600">{`Pizzas Entregues: ${data.pizzasEntregues}`}</p>
          <p className="text-gray-600 text-sm">{`Tempo Médio por Pizza: ${data.tempoMedioPorPizza.toFixed(2)}s`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>⏱️ Takt Time por Equipe (Lean Manufacturing)</span>
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
        {dadosGrafico.length > 0 ? (
          <>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">📊 Sobre o Takt Time</h4>
              <p className="text-sm text-blue-700">
                O Takt Time ideal é 1.0 (linha de referência). Valores menores indicam maior eficiência, 
                valores maiores indicam necessidade de melhoria no processo.
              </p>
            </div>
            
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={dadosGrafico} 
                layout="horizontal"
                margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  domain={[0, 'dataMax + 0.5']}
                  label={{ value: 'Takt Time (segundos)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  type="category" 
                  dataKey="equipe" 
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  x={1.0} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5" 
                  label={{ value: "Ideal (1.0)", position: "top" }}
                />
                <Bar 
                  dataKey="taktTime" 
                  fill="#3b82f6"
                  label={{ 
                    position: 'right',
                    formatter: (value: number) => `${value.toFixed(2)}s`
                  }}
                />
              </BarChart>
            </ResponsiveContainer>

            {/* Resumo dos dados */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-gray-700">
                  {rodadaAtual?.tempo_limite || 0}s
                </div>
                <div className="text-sm text-gray-600">Tempo Total da Rodada</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-blue-700">
                  {dadosTaktTime[0]?.tempoMedioPorPizza.toFixed(2) || '0'}s
                </div>
                <div className="text-sm text-blue-600">Tempo Médio por Pizza</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-green-700">
                  {dadosTaktTime.reduce((sum, data) => sum + data.pizzasEntregues, 0)}
                </div>
                <div className="text-sm text-green-600">Total de Pizzas Entregues</div>
              </div>
            </div>

            {/* Debug: Mostrar dados brutos se não houver pizzas */}
            {dadosTaktTime.every(d => d.pizzasEntregues === 0) && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Debug Info</h4>
                <p className="text-sm text-yellow-700 mb-2">
                  Nenhuma pizza entregue encontrada. Verificando dados:
                </p>
                <div className="text-xs text-yellow-600 space-y-1">
                  <div>Total de pizzas no sistema: {pizzas.length}</div>
                  <div>Pizzas da rodada {rodadaAtual?.numero}: {pizzas.filter(p => p.rodada_id === rodadaAtual?.id).length}</div>
                  <div>Pizzas avaliadas: {pizzas.filter(p => p.rodada_id === rodadaAtual?.id && p.status === 'avaliada').length}</div>
                  <div>Pizzas aprovadas: {pizzas.filter(p => p.rodada_id === rodadaAtual?.id && p.status === 'avaliada' && p.resultado === 'aprovada').length}</div>
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
                : "Selecione uma rodada para visualizar o Takt Time"}
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
