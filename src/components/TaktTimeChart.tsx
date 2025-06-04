import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo, useEffect } from 'react';
import { usePizzas } from '@/hooks/usePizzas';
import { useEquipes } from '@/hooks/useEquipes';
import { useTodasRodadas } from '@/hooks/useTodasRodadas';
import { obterConfigRodada, RodadaConfig } from '@/utils/rodadaConfig';

const TaktTimeChart = () => {
  const { pizzas } = usePizzas();
  const { equipes } = useEquipes();
  const { rodadas } = useTodasRodadas();
  const [rodadaSelecionada, setRodadaSelecionada] = useState<string>('');
  const [configRodada, setConfigRodada] = useState<RodadaConfig | null>(null);

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

  // Carregar configuração da rodada quando ela muda
  useEffect(() => {
    const carregarConfig = async () => {
      if (rodadaAtual) {
        console.log('Carregando configuração para rodada:', rodadaAtual.numero);
        const config = await obterConfigRodada(rodadaAtual.id);
        setConfigRodada(config);
        console.log('Configuração carregada:', config);
      } else {
        setConfigRodada(null);
      }
    };

    carregarConfig();
  }, [rodadaAtual]);

  // Calcular dados do Takt Time por equipe
  const dadosTaktTime = useMemo(() => {
    if (!rodadaAtual || !configRodada) {
      console.log('Sem rodada atual ou configuração para calcular Takt Time');
      return { dados: [], tempoMedioPorPizza: 0, linhasReferencia: [], totalPizzasRodada: 0 };
    }

    console.log('Calculando Takt Time por equipe para rodada:', rodadaAtual.numero);
    console.log('Configuração da rodada:', configRodada);

    // Filtrar pizzas da rodada que foram ENVIADAS para avaliação (status pronta ou avaliada)
    const pizzasDaRodada = pizzas.filter(pizza => 
      pizza.rodada_id === rodadaAtual.id && 
      (pizza.status === 'pronta' || pizza.status === 'avaliada')
    );

    console.log(`Pizzas enviadas para avaliação na rodada ${rodadaAtual.numero}:`, pizzasDaRodada.length);

    // Obter horário de início da rodada
    const inicioRodada = rodadaAtual.iniciou_em ? new Date(rodadaAtual.iniciou_em).getTime() : null;
    
    if (!inicioRodada) {
      console.log('Rodada não tem horário de início registrado');
      return { dados: [], tempoMedioPorPizza: 0, linhasReferencia: [], totalPizzasRodada: 0 };
    }

    console.log('Início da rodada:', new Date(inicioRodada).toISOString());

    // Usar o número de pizzas planejadas pelo administrador
    const totalPizzasRodada = configRodada.numeroPizzasPlanejadas;
    
    // Calcular o tempo médio esperado por pizza baseado na configuração do administrador
    const tempoMedioPorPizza = rodadaAtual.tempo_limite / totalPizzasRodada;
    
    console.log(`CONFIGURAÇÃO CORRETA: ${totalPizzasRodada} pizzas planejadas pelo administrador`);
    console.log(`Tempo médio esperado por pizza: ${tempoMedioPorPizza.toFixed(1)}s (${rodadaAtual.tempo_limite}s ÷ ${totalPizzasRodada} pizzas planejadas)`);

    // Agrupar pizzas por equipe e calcular dados
    const pizzasPorEquipe: { [equipeId: string]: any[] } = {};
    const dadosProcessados: any[] = [];

    // Primeiro, agrupar todas as pizzas por equipe
    pizzasDaRodada.forEach(pizza => {
      if (!pizzasPorEquipe[pizza.equipe_id]) {
        pizzasPorEquipe[pizza.equipe_id] = [];
      }
      
      const equipe = equipes.find(e => e.id === pizza.equipe_id);
      
      // Usar created_at para o momento de envio para avaliação
      const tempoEnvio = new Date(pizza.created_at).getTime();
      const tempoDecorrido = Math.max(0, (tempoEnvio - inicioRodada) / 1000);
      
      pizzasPorEquipe[pizza.equipe_id].push({
        pizza,
        equipe,
        tempoDecorrido,
        tempoEnvio
      });
    });

    // Processar cada equipe e criar todas as posições de pizza (1 até totalPizzasRodada)
    equipes.forEach(equipe => {
      const pizzasEquipe = pizzasPorEquipe[equipe.id] || [];
      
      // Ordenar pizzas da equipe por tempo de envio para avaliação
      pizzasEquipe.sort((a, b) => a.tempoDecorrido - b.tempoDecorrido);
      
      // NOVO CÁLCULO: Calcular Takt Time baseado no tempo relativo de cada pizza
      const taktTimes: number[] = [];
      
      pizzasEquipe.forEach((pizzaAtual, index) => {
        const numeroPizza = index + 1;
        const tempoIdealInicio = (numeroPizza - 1) * tempoMedioPorPizza; // Início ideal desta pizza
        const tempoRelativo = pizzaAtual.tempoDecorrido - tempoIdealInicio; // Tempo relativo ao início ideal
        
        console.log(`Equipe ${equipe.nome} - Pizza ${numeroPizza}:`);
        console.log(`  Tempo de envio: ${pizzaAtual.tempoDecorrido.toFixed(1)}s`);
        console.log(`  Tempo ideal de início: ${tempoIdealInicio.toFixed(1)}s`);
        console.log(`  Tempo relativo (Takt Time): ${tempoRelativo.toFixed(1)}s`);
        
        taktTimes.push(tempoRelativo);
      });
      
      // Calcular Takt Time médio da equipe
      const taktTimeEquipe = taktTimes.length > 0 ? taktTimes.reduce((sum, t) => sum + t, 0) / taktTimes.length : 0;
      
      console.log(`Equipe ${equipe.nome}: ${pizzasEquipe.length} pizzas enviadas, Takt Time médio: ${taktTimeEquipe.toFixed(1)}s`);
      console.log(`Takt Times individuais da equipe ${equipe.nome}:`, taktTimes.map(t => t.toFixed(1) + 's'));
      
      // Criar entradas para TODAS as posições de pizza (1 até totalPizzasRodada)
      for (let numeroPizza = 1; numeroPizza <= totalPizzasRodada; numeroPizza++) {
        const tempoIdealPizza = numeroPizza * tempoMedioPorPizza;
        const tempoIdealInicio = (numeroPizza - 1) * tempoMedioPorPizza;
        const pizzaEnviada = pizzasEquipe[numeroPizza - 1]; // Arrays são 0-indexed
        
        if (pizzaEnviada) {
          // Pizza foi enviada - calcular Takt Time relativo
          const tempoRelativo = pizzaEnviada.tempoDecorrido - tempoIdealInicio;
          const estaDentroDoTakt = tempoRelativo <= tempoMedioPorPizza; // Dentro do tempo esperado para esta pizza
          
          dadosProcessados.push({
            equipeId: equipe.id,
            equipeNome: equipe.nome,
            numeroPizzaEquipe: numeroPizza,
            tempo: Number(pizzaEnviada.tempoDecorrido.toFixed(1)),
            tempoAbsoluto: Number(pizzaEnviada.tempoDecorrido.toFixed(1)), // Tempo desde início da rodada
            tempoRelativo: Number(tempoRelativo.toFixed(1)), // Tempo relativo ao início ideal desta pizza
            tempoIdealInicio: Number(tempoIdealInicio.toFixed(1)), // Quando esta pizza deveria ter começado
            resultado: pizzaEnviada.pizza.resultado,
            corEquipe: equipe.cor_tema || '#3b82f6',
            pizzaId: pizzaEnviada.pizza.id,
            y: `Pizza ${numeroPizza}`,
            tempoIdeal: tempoIdealPizza,
            estaDentroDoTakt: estaDentroDoTakt,
            taktTimeEquipe: taktTimeEquipe,
            taktTimesIndividuais: taktTimes,
            foiEnviada: true
          });
        } else {
          // Pizza não foi enviada - mostrar posição vazia
          dadosProcessados.push({
            equipeId: equipe.id,
            equipeNome: equipe.nome,
            numeroPizzaEquipe: numeroPizza,
            tempo: null, // Sem tempo pois não foi enviada
            tempoAbsoluto: null,
            tempoRelativo: null,
            tempoIdealInicio: Number(tempoIdealInicio.toFixed(1)),
            resultado: null,
            corEquipe: equipe.cor_tema || '#3b82f6',
            pizzaId: null,
            y: `Pizza ${numeroPizza}`,
            tempoIdeal: tempoIdealPizza,
            estaDentroDoTakt: false,
            taktTimeEquipe: taktTimeEquipe,
            taktTimesIndividuais: taktTimes,
            foiEnviada: false
          });
        }
      }
    });

    // Criar linhas de referência para o Takt Time ideal
    const linhasReferencia = [];
    for (let i = 1; i <= totalPizzasRodada; i++) {
      linhasReferencia.push({
        tempo: i * tempoMedioPorPizza,
        label: `Pizza ${i}`
      });
    }

    console.log('Dados processados para o Takt Time:', dadosProcessados.length, 'entradas (incluindo posições vazias)');
    return { 
      dados: dadosProcessados, 
      tempoMedioPorPizza,
      linhasReferencia,
      totalPizzasRodada
    };
  }, [rodadaAtual, pizzas, equipes, configRodada]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      if (!data.foiEnviada) {
        return (
          <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
            <p className="font-semibold">{data.equipeNome} - Pizza {data.numeroPizzaEquipe}</p>
            <p className="text-red-600">Pizza não enviada</p>
            <p className="text-gray-600">{`Tempo ideal: ${data.tempoIdeal.toFixed(1)}s`}</p>
            <p className="text-gray-600">{`Início ideal: ${data.tempoIdealInicio}s`}</p>
          </div>
        );
      }
      
      const atraso = data.tempoAbsoluto - data.tempoIdeal;
      
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold">{data.equipeNome} - Pizza {data.numeroPizzaEquipe}</p>
          <p className="text-blue-600">{`Tempo de envio: ${data.tempoAbsoluto}s`}</p>
          <p className="text-purple-600">{`Início ideal desta pizza: ${data.tempoIdealInicio}s`}</p>
          <p className="text-orange-600">{`Takt Time relativo: ${data.tempoRelativo}s`}</p>
          <p className="text-gray-600">{`Tempo ideal total: ${data.tempoIdeal.toFixed(1)}s`}</p>
          <p className={`font-medium ${atraso <= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {atraso <= 0 ? `Adiantado: ${Math.abs(atraso).toFixed(1)}s` : `Atrasado: ${atraso.toFixed(1)}s`}
          </p>
          <p className={`font-medium ${data.resultado === 'aprovada' ? 'text-green-700' : data.resultado === 'reprovada' ? 'text-red-700' : 'text-purple-700'}`}>
            {`Resultado: ${data.resultado === 'aprovada' ? 'Aprovada' : data.resultado === 'reprovada' ? 'Reprovada' : 'Pendente'}`}
          </p>
          <p className="text-purple-600">{`Takt Time médio da equipe: ${data.taktTimeEquipe.toFixed(1)}s`}</p>
          <p className={`text-sm ${data.estaDentroDoTakt ? 'text-green-600' : 'text-red-600'}`}>
            {data.estaDentroDoTakt ? '✓ Dentro do Takt' : '✗ Fora do Takt'}
          </p>
        </div>
      );
    }
    return null;
  };

  // Agrupar dados por equipe para múltiplas séries
  const dadosPorEquipe = useMemo(() => {
    const grupos: { [key: string]: any[] } = {};
    
    dadosTaktTime.dados.forEach(item => {
      if (!grupos[item.equipeNome]) {
        grupos[item.equipeNome] = [];
      }
      grupos[item.equipeNome].push(item);
    });
    
    return grupos;
  }, [dadosTaktTime.dados]);

  // Criar array de posições Y únicas para todas as pizzas da rodada
  const posicoesY = useMemo(() => {
    const posicoes = [];
    for (let i = 1; i <= dadosTaktTime.totalPizzasRodada; i++) {
      posicoes.push(`Pizza ${i}`);
    }
    return posicoes;
  }, [dadosTaktTime.totalPizzasRodada]);

  // Criar ticks personalizados para o eixo X baseados no tempo médio por pizza
  const ticksTempoIdeal = useMemo(() => {
    const ticks = [0];
    for (let i = 1; i <= dadosTaktTime.totalPizzasRodada; i++) {
      ticks.push(i * dadosTaktTime.tempoMedioPorPizza);
    }
    return ticks;
  }, [dadosTaktTime.tempoMedioPorPizza, dadosTaktTime.totalPizzasRodada]);

  const coresEquipes = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>⏱️ Análise Takt Time por Equipe</span>
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
        {dadosTaktTime.dados.length > 0 && configRodada ? (
          <>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">📊 Análise Takt Time Corrigida por Pizza da Rodada</h4>
              <p className="text-sm text-blue-700 mb-2">
                <strong>{configRodada.numeroPizzasPlanejadas} pizzas planejadas</strong> pelo administrador para esta rodada. 
                O tempo médio ideal por pizza é de <strong>{dadosTaktTime.tempoMedioPorPizza.toFixed(1)}s</strong>.
              </p>
              <p className="text-xs text-blue-600">
                <strong>Takt Time Corrigido:</strong> Medido como tempo relativo ao início ideal de cada pizza.
                Pizza 1 inicia em 0s, Pizza 2 em {dadosTaktTime.tempoMedioPorPizza.toFixed(1)}s, etc.
              </p>
            </div>
            
            <ResponsiveContainer width="100%" height={Math.max(400, posicoesY.length * 40)}>
              <ScatterChart margin={{ top: 20, right: 30, left: 100, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="tempo"
                  domain={[0, rodadaAtual?.tempo_limite || 300]}
                  ticks={ticksTempoIdeal}
                  label={{ value: 'Tempo (segundos)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  type="category" 
                  dataKey="y"
                  domain={posicoesY}
                  width={80}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {/* Linhas de referência do Takt Time ideal */}
                {dadosTaktTime.linhasReferencia.map((linha, index) => (
                  <ReferenceLine 
                    key={index}
                    x={linha.tempo} 
                    stroke="#10b981" 
                    strokeDasharray="2 2"
                    label={{ value: `${linha.tempo.toFixed(0)}s`, position: 'top', fontSize: 10 }}
                  />
                ))}
                
                {Object.entries(dadosPorEquipe).map(([equipe, dados], index) => (
                  <Scatter
                    key={equipe}
                    name={equipe}
                    data={dados.filter(d => d.foiEnviada)}
                    fill={coresEquipes[index % coresEquipes.length]}
                    shape={(props: any) => {
                      const { cx, cy, payload } = props;
                      const dentroDoTakt = payload.estaDentroDoTakt;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill={payload.resultado === 'aprovada' ? coresEquipes[index % coresEquipes.length] : 'transparent'}
                          stroke={dentroDoTakt ? coresEquipes[index % coresEquipes.length] : '#ef4444'}
                          strokeWidth={dentroDoTakt ? 2 : 3}
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
                  {dadosTaktTime.tempoMedioPorPizza.toFixed(1)}s
                </div>
                <div className="text-sm text-gray-600">Tempo Médio Ideal por Pizza</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-blue-700">
                  {dadosTaktTime.dados.filter(d => d.foiEnviada).length}
                </div>
                <div className="text-sm text-blue-600">Pizzas Enviadas</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-green-700">
                  {dadosTaktTime.dados.filter(d => d.foiEnviada && d.estaDentroDoTakt).length}
                </div>
                <div className="text-sm text-green-600">Dentro do Takt Time</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-red-700">
                  {dadosTaktTime.dados.filter(d => d.foiEnviada && !d.estaDentroDoTakt).length}
                </div>
                <div className="text-sm text-red-600">Fora do Takt Time</div>
              </div>
            </div>

            {/* Análise detalhada por equipe */}
            <div className="mt-6">
              <h4 className="font-semibold text-gray-800 mb-3">📈 Performance Takt Time Corrigida por Equipe</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(dadosPorEquipe).map(([equipe, dados]) => {
                  const pizzasEnviadas = dados.filter(d => d.foiEnviada);
                  const dentroDoTakt = pizzasEnviadas.filter(d => d.estaDentroDoTakt).length;
                  const foraDoTakt = pizzasEnviadas.filter(d => !d.estaDentroDoTakt).length;
                  const taktTimeEquipe = pizzasEnviadas[0]?.taktTimeEquipe || 0;
                  const eficienciaTakt = pizzasEnviadas.length > 0 ? (dentroDoTakt / pizzasEnviadas.length) * 100 : 0;
                  const taktTimesIndividuais = pizzasEnviadas[0]?.taktTimesIndividuais || [];
                  
                  return (
                    <div key={equipe} className="bg-white border border-gray-200 p-4 rounded-lg">
                      <h5 className="font-semibold text-sm mb-3 text-blue-700">{equipe}</h5>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span>Pizzas enviadas:</span>
                          <span className="font-medium">{pizzasEnviadas.length}/{dadosTaktTime.totalPizzasRodada}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Dentro do Takt:</span>
                          <span className="font-medium text-green-600">{dentroDoTakt}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fora do Takt:</span>
                          <span className="font-medium text-red-600">{foraDoTakt}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Takt Time médio:</span>
                          <span className="font-medium">{taktTimeEquipe.toFixed(1)}s</span>
                        </div>
                        {taktTimesIndividuais.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-500">Takt Times relativos:</span>
                            <div className="text-xs text-gray-600 mt-1">
                              {taktTimesIndividuais.map((takt, idx) => `P${idx+1}: ${takt.toFixed(1)}s`).join(', ')}
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Eficiência Takt:</span>
                          <span className={`font-medium ${eficienciaTakt >= 70 ? 'text-green-600' : eficienciaTakt >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {eficienciaTakt.toFixed(1)}%
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className={`text-xs px-2 py-1 rounded text-center ${
                            eficienciaTakt >= 70 ? 'bg-green-100 text-green-700' :
                            eficienciaTakt >= 50 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {eficienciaTakt >= 70 ? '🎯 Excelente' :
                             eficienciaTakt >= 50 ? '⚠️ Moderado' : '❌ Crítico'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legenda explicativa atualizada */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">💡 Como interpretar este gráfico (CORRIGIDO):</h4>
              <div className="text-sm text-yellow-700 space-y-1">
                <p><strong>Takt Time Corrigido:</strong> Tempo relativo ao início ideal de cada pizza</p>
                <p><strong>Configuração:</strong> {configRodada.numeroPizzasPlanejadas} pizzas planejadas para esta rodada</p>
                <p><strong>Cálculo correto:</strong> Pizza 1 inicia em 0s, Pizza 2 em {dadosTaktTime.tempoMedioPorPizza.toFixed(1)}s, etc.</p>
                <p><strong>Exemplo:</strong> Pizza 1 aos 12s (Takt = 12-0 = 12s), Pizza 2 aos 32s (Takt = 32-{dadosTaktTime.tempoMedioPorPizza.toFixed(1)} = {(32-dadosTaktTime.tempoMedioPorPizza).toFixed(1)}s)</p>
                <p><strong>Interpretação:</strong> Takt Time positivo = atraso, negativo = adiantado</p>
                <p><strong>Objetivo:</strong> Manter Takt Time próximo de 0 para cada pizza</p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">📊 Sem dados disponíveis</p>
            <p className="text-sm">
              {rodadasDisponiveis.length === 0 
                ? "Nenhuma rodada finalizada com pizzas encontrada" 
                : configRodada === null 
                ? "Carregando configuração da rodada..."
                : "Selecione uma rodada para visualizar a análise Takt Time"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaktTimeChart;
