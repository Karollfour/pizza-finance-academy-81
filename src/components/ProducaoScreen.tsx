import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOptimizedRodadas } from '@/hooks/useOptimizedRodadas';
import { useRodadaCounter } from '@/hooks/useRodadaCounter';
import { useSynchronizedTimer } from '@/hooks/useSynchronizedTimer';
import { usePizzas } from '@/hooks/usePizzas';
import { useEquipes } from '@/hooks/useEquipes';
import { useSabores } from '@/hooks/useSabores';
import { useResetJogo } from '@/hooks/useResetJogo';
import { useSequenciaSabores } from '@/hooks/useSequenciaSabores';
import { useSaborAutomatico } from '@/hooks/useSaborAutomatico';
import { useHistoricoSaboresRodada } from '@/hooks/useHistoricoSaboresRodada';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import VisualizadorSaboresRodada from './VisualizadorSaboresRodada';
import HistoricoTodasRodadas from './HistoricoTodasRodadas';
import HistoricoSaboresAutomatico from './HistoricoSaboresAutomatico';
const ProducaoScreen = () => {
  const {
    rodadaAtual,
    iniciarRodada,
    finalizarRodada,
    criarNovaRodada,
    lastUpdate
  } = useOptimizedRodadas();
  const {
    proximoNumero,
    refetch: refetchCounter
  } = useRodadaCounter();
  const {
    pizzas,
    refetch: refetchPizzas
  } = usePizzas(undefined, rodadaAtual?.id);
  const {
    equipes
  } = useEquipes();
  const {
    sabores
  } = useSabores();
  const {
    resetarJogo,
    loading: resetLoading
  } = useResetJogo();
  const {
    criarSequenciaParaRodada,
    loading: loadingSequencia
  } = useSequenciaSabores();

  // Timer sincronizado
  const {
    timeRemaining,
    formattedTime,
    timeColor,
    progressPercentage
  } = useSynchronizedTimer(rodadaAtual, {
    onTimeUp: () => {
      if (rodadaAtual) {
        console.log('Tempo esgotado, finalizando rodada automaticamente');
        handleFinalizarRodada();
      }
    },
    onWarning: secondsLeft => {
      toast.warning(`⚠️ Atenção: ${secondsLeft} segundos restantes!`, {
        duration: 3000,
        position: 'top-center'
      });
    },
    warningThreshold: 30
  });
  const [tempoLimite, setTempoLimite] = useState(300);
  const [numeroPizzas, setNumeroPizzas] = useState(10);
  const handleIniciarRodada = async () => {
    try {
      if (!rodadaAtual) {
        // Criar nova rodada se não existe uma aguardando
        console.log('Criando nova rodada...');
        const novaRodada = await criarNovaRodada(proximoNumero, tempoLimite);

        // Criar sequência automática de sabores
        if (novaRodada?.id) {
          console.log('Criando sequência de sabores...');
          await criarSequenciaParaRodada(novaRodada.id, numeroPizzas);

          // Aguardar um momento para a sequência ser salva
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        await refetchCounter();
        toast.success(`🎯 Rodada ${proximoNumero} criada com ${numeroPizzas} pizzas!`, {
          duration: 3000,
          position: 'top-center'
        });
        return;
      }
      if (rodadaAtual.status === 'aguardando') {
        // Verificar se já existe sequência de sabores
        const {
          data: historicoExistente
        } = await supabase.from('historico_sabores_rodada').select('id').eq('rodada_id', rodadaAtual.id).limit(1);
        if (!historicoExistente || historicoExistente.length === 0) {
          console.log('Criando sequência de sabores para rodada existente...');
          await criarSequenciaParaRodada(rodadaAtual.id, numeroPizzas);

          // Aguardar um momento para a sequência ser salva
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        console.log('Iniciando rodada...');
        await iniciarRodada(rodadaAtual.id);
        toast.success(`🚀 Rodada ${rodadaAtual.numero} iniciada!`, {
          duration: 3000,
          position: 'top-center'
        });
      }
    } catch (error) {
      console.error('Erro ao iniciar rodada:', error);
      toast.error('Erro ao iniciar rodada. Tente novamente.', {
        duration: 4000,
        position: 'top-center'
      });
    }
  };
  const handleFinalizarRodada = async () => {
    if (!rodadaAtual) return;
    try {
      console.log('Finalizando rodada...');
      await finalizarRodada(rodadaAtual.id);
      await refetchCounter();
      toast.success(`🏁 Rodada ${rodadaAtual.numero} finalizada!`, {
        duration: 3000,
        position: 'top-center'
      });
    } catch (error) {
      console.error('Erro ao finalizar rodada:', error);
      toast.error('Erro ao finalizar rodada. Tente novamente.', {
        duration: 4000,
        position: 'top-center'
      });
    }
  };
  const adicionarMinutos = async (minutos: number) => {
    if (!rodadaAtual) return;
    try {
      const novoTempoLimite = rodadaAtual.tempo_limite + minutos * 60;
      console.log(`Alterando tempo limite de ${rodadaAtual.tempo_limite}s para ${novoTempoLimite}s`);
      const {
        error
      } = await supabase.from('rodadas').update({
        tempo_limite: novoTempoLimite
      }).eq('id', rodadaAtual.id);
      if (error) throw error;

      // Disparar evento customizado para notificar o timer
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rodada-tempo-alterado', {
          detail: {
            rodadaId: rodadaAtual.id,
            novoTempoLimite,
            alteracao: minutos,
            timestamp: new Date().toISOString()
          }
        }));
      }
      toast.success(`${minutos > 0 ? 'Adicionados' : 'Removidos'} ${Math.abs(minutos)} minuto(s)`, {
        duration: 2000,
        position: 'top-center'
      });
    } catch (error) {
      console.error('Erro ao ajustar tempo da rodada:', error);
      toast.error('Erro ao ajustar tempo da rodada', {
        duration: 3000,
        position: 'top-center'
      });
    }
  };
  const handleResetarJogo = async () => {
    const confirmar1 = window.confirm('⚠️ ATENÇÃO: Esta ação irá apagar TODOS os dados do jogo (rodadas, pizzas, compras e estatísticas). Esta ação NÃO PODE SER DESFEITA. Deseja continuar?');
    if (!confirmar1) return;
    const confirmar2 = window.confirm('🚨 CONFIRMAÇÃO FINAL: Tem certeza absoluta de que deseja resetar todo o jogo? Todos os dados serão perdidos permanentemente!');
    if (!confirmar2) return;
    try {
      console.log('Resetando jogo...');
      await resetarJogo();
      // Atualizar todos os dados após o reset
      await Promise.all([refetchCounter(), refetchPizzas()]);
      toast.success('🔄 Jogo resetado com sucesso!', {
        duration: 3000,
        position: 'top-center'
      });
    } catch (error) {
      console.error('Erro ao resetar jogo:', error);
      toast.error('Erro ao resetar jogo. Tente novamente.', {
        duration: 4000,
        position: 'top-center'
      });
    }
  };

  // Hooks para sabores automáticos
  const {
    historico
  } = useHistoricoSaboresRodada(rodadaAtual?.id);
  const {
    saborAtual,
    proximoSabor,
    segundoProximoSabor,
    saboresPassados,
    saborAtualIndex,
    intervaloTroca,
    tempoProximaTroca
  } = useSaborAutomatico({
    rodada: rodadaAtual,
    numeroPizzas
  });

  // Organizar pizzas por status
  const pizzasProntas = pizzas.filter(p => p.status === 'pronta');
  const pizzasAvaliadas = pizzas.filter(p => p.status === 'avaliada');
  const pizzasAprovadas = pizzasAvaliadas.filter(p => p.resultado === 'aprovada');
  const pizzasReprovadas = pizzasAvaliadas.filter(p => p.resultado === 'reprovada');

  // Estatísticas por equipe
  const estatisticasPorEquipe = equipes.map(equipe => {
    const pizzasEquipe = pizzas.filter(p => p.equipe_id === equipe.id);
    return {
      equipe,
      total: pizzasEquipe.length,
      prontas: pizzasEquipe.filter(p => p.status === 'pronta').length,
      aprovadas: pizzasEquipe.filter(p => p.resultado === 'aprovada').length,
      reprovadas: pizzasEquipe.filter(p => p.resultado === 'reprovada').length
    };
  });
  const getEquipeNome = (equipeId: string) => {
    const equipe = equipes.find(e => e.id === equipeId);
    return equipe ? equipe.nome : 'Equipe não encontrada';
  };
  const numeroRodadaDisplay = rodadaAtual?.numero || proximoNumero;

  // Helper functions para sabores
  const getSaborNome = (item: any) => {
    if (item?.sabor?.nome) {
      return item.sabor.nome;
    }
    const saborEncontrado = sabores.find(s => s.id === item?.sabor_id);
    return saborEncontrado?.nome || 'Sabor não encontrado';
  };
  const getSaborDescricao = (item: any) => {
    if (item?.sabor?.descricao) {
      return item.sabor.descricao;
    }
    const saborEncontrado = sabores.find(s => s.id === item?.sabor_id);
    return saborEncontrado?.descricao;
  };
  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return <div className="relative min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-600 mb-2">💻ADMINISTRAÇÃO</h1>
          <p className="text-gray-600">Acompanhe o status das pizzas em tempo real</p>
          <div className="mt-2 text-sm text-gray-500">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </div>
        </div>

        {/* Controles da Rodada Simplificados */}
        <Card className="shadow-lg border-2 border-red-200 mb-8">
          <CardHeader className="bg-red-50">
            <CardTitle>⚙️ Controle da Rodada</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              {/* Tempo Limite */}
              <div>
                <Label htmlFor="tempoLimite">Tempo Limite (segundos)</Label>
                <Input id="tempoLimite" type="number" value={tempoLimite} onChange={e => setTempoLimite(Number(e.target.value))} disabled={rodadaAtual?.status === 'ativa'} />
              </div>

              {/* Número de Pizzas */}
              <div>
                <Label htmlFor="numeroPizzas">Número de Pizzas</Label>
                <Input id="numeroPizzas" type="number" value={numeroPizzas} onChange={e => setNumeroPizzas(Number(e.target.value))} disabled={rodadaAtual?.status === 'ativa'} min="1" max="50" />
              </div>

              {/* Botão Principal da Rodada */}
              <div>
                {rodadaAtual?.status === 'ativa' ? <Button onClick={handleFinalizarRodada} className="w-full bg-red-500 hover:bg-red-600">
                    Encerrar Rodada
                  </Button> : <Button onClick={handleIniciarRodada} className="w-full bg-green-500 hover:bg-green-600" disabled={loadingSequencia}>
                    {loadingSequencia ? 'Criando Sequência...' : `Iniciar Rodada ${numeroRodadaDisplay}`}
                  </Button>}
              </div>

              {/* Controles de Tempo */}
              <div className="flex gap-2">
                <Button onClick={() => adicionarMinutos(-1)} disabled={!rodadaAtual || rodadaAtual.status !== 'ativa'} variant="outline" size="sm" className="flex-1">
                  -1 min
                </Button>
                <Button onClick={() => adicionarMinutos(1)} disabled={!rodadaAtual || rodadaAtual.status !== 'ativa'} variant="outline" size="sm" className="flex-1">
                  +1 min
                </Button>
              </div>

              {/* Controles Extras */}
              <div className="flex gap-2">
                <Button onClick={() => adicionarMinutos(-5)} disabled={!rodadaAtual || rodadaAtual.status !== 'ativa'} variant="outline" size="sm" className="flex-1">
                  -5 min
                </Button>
                <Button onClick={() => adicionarMinutos(5)} disabled={!rodadaAtual || rodadaAtual.status !== 'ativa'} variant="outline" size="sm" className="flex-1">
                  +5 min
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timer, Status da Rodada e Sabores Integrados */}
        <Card className="shadow-lg border-2 border-orange-200 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-4xl">Rodada {numeroRodadaDisplay}</span>
              <Badge variant={rodadaAtual?.status === 'ativa' ? "default" : "secondary"} className={rodadaAtual?.status === 'ativa' ? 'bg-green-500' : rodadaAtual?.status === 'aguardando' ? 'bg-yellow-500' : 'bg-gray-500'}>
                {rodadaAtual?.status === 'ativa' ? "Em Andamento" : rodadaAtual?.status === 'aguardando' ? "Aguardando" : "Finalizada"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Timer e Estatísticas */}
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${timeColor}`}>
                    {formattedTime}
                  </div>
                  <Progress value={progressPercentage} className="w-full mb-4" />
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{equipes.length}</div>
                    <div className="text-sm text-blue-700">Equipes</div>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{pizzasProntas.length}</div>
                    <div className="text-sm text-yellow-700">Aguardando Avaliação</div>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{pizzasAprovadas.length}</div>
                    <div className="text-sm text-green-700">Aprovadas</div>
                  </div>
                  <div className="bg-red-100 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{pizzasReprovadas.length}</div>
                    <div className="text-sm text-red-700">Reprovadas</div>
                  </div>
                </div>
              </div>

              {/* Sabores da Rodada Integrados */}
              {rodadaAtual && historico.length > 0 && <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-orange-600 mb-4 text-center">🍕 Sabores da Rodada</h3>
                  
                  {rodadaAtual.status === 'ativa' && saborAtual ? (/* Rodada Ativa - Sistema Automático */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Sabor Atual */}
                      <div className="lg:col-span-2">
                        <Card className="shadow-lg border-2 border-green-400 bg-green-50">
                          <CardContent className="p-6 text-center my-[10px]">
                            <Badge className="bg-green-500 text-white text-sm px-3 py-1 mb-3">
                              🍕 SABOR ATUAL
                            </Badge>
                            <div className="text-4xl mb-3">🍕</div>
                            <h3 className="font-bold text-green-700 mb-2 text-5xl">
                              {getSaborNome(saborAtual)}
                            </h3>
                            {getSaborDescricao(saborAtual) && <p className="text-sm text-green-600 mb-3">
                                {getSaborDescricao(saborAtual)}
                              </p>}
                            <div className="text-sm text-green-600 mb-3">
                              Pizza #{saborAtualIndex + 1} de {historico.length}
                            </div>
                            <div className="bg-green-100 p-2 rounded text-xs text-green-600">
                              Próxima troca: {formatarTempo(tempoProximaTroca)}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Próximos Sabores */}
                      <div className="space-y-3">
                        {proximoSabor ? <Card className="shadow-lg border-2 border-blue-400 bg-blue-50">
                            <CardContent className="p-3 text-center">
                              <Badge className="bg-blue-500 text-white text-xs px-2 py-1 mb-2">
                                PRÓXIMO
                              </Badge>
                              <div className="text-2xl mb-2">🍕</div>
                              <h4 className="font-bold text-blue-700 text-3xl">
                                {getSaborNome(proximoSabor)}
                              </h4>
                              <div className="text-xs text-blue-600">
                                Pizza #{saborAtualIndex + 2}
                              </div>
                            </CardContent>
                          </Card> : <Card className="shadow-lg border-2 border-gray-200">
                            <CardContent className="p-3 text-center">
                              <div className="text-xl mb-2">🏁</div>
                              <p className="text-xs text-gray-500">Último sabor</p>
                            </CardContent>
                          </Card>}

                        {segundoProximoSabor && <Card className="shadow-lg border-2 border-purple-400 bg-purple-50">
                            <CardContent className="p-3 text-center">
                              <Badge className="bg-purple-500 text-white text-xs px-2 py-1 mb-2">
                                DEPOIS
                              </Badge>
                              <div className="text-2xl mb-2">🍕</div>
                              <h4 className="font-bold text-purple-700 text-lg">
                                {getSaborNome(segundoProximoSabor)}
                              </h4>
                              <div className="text-xs text-purple-600">
                                Pizza #{saborAtualIndex + 3}
                              </div>
                            </CardContent>
                          </Card>}
                      </div>
                    </div>) : (/* Rodada Aguardando - Primeiros 3 Sabores */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2">
                        <Card className="shadow-lg border-2 border-yellow-400 bg-yellow-50">
                          <CardContent className="p-6 text-center py-[71px] my-[6px]">
                            <Badge className="bg-yellow-500 text-white text-sm px-3 mb-3 py-[3px] rounded-md">🍕 EM  PRODUÇÃO</Badge>
                            <div className="text-4xl mb-3">🍕</div>
                            <h3 className="font-bold text-yellow-700 mb-2 text-5xl">
                              {getSaborNome(historico[0])}
                            </h3>
                            {getSaborDescricao(historico[0]) && <p className="text-yellow-600 mb-3 text-xl">
                                {getSaborDescricao(historico[0])}
                              </p>}
                            <div className="text-sm text-yellow-600">
                              Pizza #{historico[0]?.ordem || 1}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="space-y-3">
                        {historico[1] && <Card className="shadow-lg border-2 border-blue-400 bg-blue-50">
                            <CardContent className="p-3 text-center">
                              <Badge className="bg-blue-500 text-white text-xs px-2 py-1 mb-2">PRÓXIMO 2</Badge>
                              <div className="text-2xl mb-2 my-[4px]">🍕</div>
                              <h4 className="font-bold text-blue-700 text-4xl py-0 my-[13px] mx-0">
                                {getSaborNome(historico[1])}
                              </h4>
                              <div className="text-xs text-blue-600">
                                Pizza #{historico[1].ordem}
                              </div>
                            </CardContent>
                          </Card>}

                        {historico[2] && <Card className="shadow-lg border-2 border-purple-400 bg-purple-50">
                            <CardContent className="p-3 text-center">
                              <Badge className="bg-purple-500 text-white text-xs px-2 py-1 mb-2">PRÓXIMO 3
                      </Badge>
                              <div className="text-2xl mb-2 my-0">🍕</div>
                              <h4 className="font-bold text-purple-700 text-4xl my-[12px]">
                                {getSaborNome(historico[2])}
                              </h4>
                              <div className="text-xs text-purple-600">
                                Pizza #{historico[2].ordem}
                              </div>
                            </CardContent>
                          </Card>}
                      </div>
                    </div>)}
                </div>}
            </div>
          </CardContent>
        </Card>

        {/* Visualizador de Sabores da Rodada - Agora com sistema automático */}
        {rodadaAtual && <Card className="shadow-lg border-2 border-blue-200 mb-8">
            
            
          </Card>}

        {/* Histórico de Sabores Automático */}
        <HistoricoSaboresAutomatico rodada={rodadaAtual} numeroPizzas={numeroPizzas} />

        {/* Histórico de Todas as Rodadas */}
        <div className="mb-8">
          <HistoricoTodasRodadas />
        </div>

        {/* Status por Equipe */}
        <Card className="shadow-lg border-2 border-purple-200 mb-8">
          <CardHeader>
            <CardTitle className="text-purple-600">👥 Status por Equipe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {estatisticasPorEquipe.map(stats => <div key={stats.equipe.id} className="p-4 bg-white rounded-lg border border-purple-200">
                  <h3 className="font-bold text-purple-600 mb-2">{stats.equipe.nome}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600">Total: <span className="font-medium">{stats.total}</span></div>
                    <div className="text-yellow-600">Prontas: <span className="font-medium">{stats.prontas}</span></div>
                    <div className="text-green-600">Aprovadas: <span className="font-medium">{stats.aprovadas}</span></div>
                    <div className="text-red-600">Reprovadas: <span className="font-medium">{stats.reprovadas}</span></div>
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Pizzas */}
        <Card className="shadow-lg border-2 border-green-200 mb-8">
          <CardHeader>
            <CardTitle className="text-green-600">
              📝 Histórico de Pizzas - Rodada {numeroRodadaDisplay}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pizzas.length > 0 ? <div className="space-y-3 max-h-96 overflow-y-auto">
                {pizzas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((pizza, index) => <div key={pizza.id} className="p-4 bg-white rounded-lg border border-green-200 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-green-600">
                          {getEquipeNome(pizza.equipe_id)} - Pizza #{pizzas.length - index}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(pizza.created_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={pizza.status === 'pronta' ? 'secondary' : pizza.resultado === 'aprovada' ? 'default' : pizza.resultado === 'reprovada' ? 'destructive' : 'outline'} className={pizza.status === 'pronta' ? 'bg-yellow-500' : pizza.resultado === 'aprovada' ? 'bg-green-500' : pizza.resultado === 'reprovada' ? 'bg-red-500' : ''}>
                          {pizza.status === 'pronta' && '🟡 Aguardando Avaliação'}
                          {pizza.resultado === 'aprovada' && '✅ Aprovada'}
                          {pizza.resultado === 'reprovada' && '❌ Reprovada'}
                          {pizza.status === 'em_producao' && '🔄 Em Produção'}
                        </Badge>
                        {pizza.resultado === 'reprovada' && pizza.justificativa_reprovacao && <div className="text-xs text-red-500 mt-1 max-w-xs">
                            {pizza.justificativa_reprovacao}
                          </div>}
                      </div>
                    </div>)}
              </div> : <div className="text-center text-gray-500 py-12">
                <div className="text-6xl mb-4">🍕</div>
                <p className="text-xl">Nenhuma pizza produzida ainda</p>
                <p className="text-gray-400">As pizzas produzidas aparecerão aqui</p>
              </div>}
          </CardContent>
        </Card>

        {/* Botão de Reset no final da tela */}
        <div className="flex justify-center mt-8 mb-4">
          <Button onClick={handleResetarJogo} disabled={resetLoading} size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold border-2 border-red-700 shadow-lg">
            {resetLoading ? <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Resetando Jogo...
              </> : <>🔄 Resetar Jogo</>}
          </Button>
        </div>
      </div>
    </div>;
};
export default ProducaoScreen;