import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pause, Square, Play } from 'lucide-react';
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
import { useGlobalSync } from '@/hooks/useGlobalSync';
import { usePersistedState } from '@/hooks/usePersistedState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import VisualizadorSaboresRodada from './VisualizadorSaboresRodada';
import HistoricoTodasRodadas from './HistoricoTodasRodadas';
import HistoricoSaboresAutomatico from './HistoricoSaboresAutomatico';
import DashboardLojinha from './DashboardLojinha';
import ComprasPorEquipe from './ComprasPorEquipe';
import GestaoEquipes from './GestaoEquipes';
import GerenciadorItens from './GerenciadorItens';
import GerenciadorSabores from './GerenciadorSabores';
import VendasLoja from './VendasLoja';
import HistoricoLoja from './HistoricoLoja';

const ProducaoScreen = () => {
  const {
    rodadaAtual,
    iniciarRodada,
    pausarRodada,
    finalizarRodada,
    criarNovaRodada,
    lastUpdate,
    refetch: refetchRodadas
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

  // Persistir estado da aba ativa - controle como padrão
  const [activeTab, setActiveTab] = usePersistedState('producao-active-tab', 'controle');

  // Estado para controle do modo fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sincronização global ativa
  const {
    forceGlobalSync
  } = useGlobalSync({
    enabled: true,
    silent: true
  });

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

  // Estados para estatísticas
  const [estatisticasGerais, setEstatisticasGerais] = useState({
    totalPizzas: 0,
    pizzasAprovadas: 0,
    pizzasReprovadas: 0,
    pizzasPendentes: 0,
    totalGastos: 0,
    equipesAtivas: 0
  });

  // Calcular estatísticas em tempo real
  useEffect(() => {
    const totalPizzas = pizzas.length;
    const pizzasAprovadas = pizzas.filter(p => p.resultado === 'aprovada').length;
    const pizzasReprovadas = pizzas.filter(p => p.resultado === 'reprovada').length;
    const pizzasPendentes = pizzas.filter(p => p.status === 'pronta').length;
    const equipesAtivas = equipes.length;
    setEstatisticasGerais({
      totalPizzas,
      pizzasAprovadas,
      pizzasReprovadas,
      pizzasPendentes,
      totalGastos: 0,
      // Não temos dados de compras aqui
      equipesAtivas
    });
  }, [pizzas, equipes]);
  const handleIniciarRodada = async () => {
    try {
      if (!rodadaAtual) {
        console.log('Criando nova rodada...');
        const novaRodada = await criarNovaRodada(proximoNumero, tempoLimite);
        if (novaRodada?.id) {
          console.log('Criando sequência de sabores...');
          await criarSequenciaParaRodada(novaRodada.id, numeroPizzas);
          await new Promise(resolve => setTimeout(resolve, 500));
          forceGlobalSync();
        }
        await refetchCounter();
        toast.success(`🎯 Rodada ${proximoNumero} criada com ${numeroPizzas} pizzas!`, {
          duration: 3000,
          position: 'top-center'
        });
        return;
      }
      if (rodadaAtual.status === 'aguardando') {
        const {
          data: historicoExistente
        } = await supabase.from('historico_sabores_rodada').select('id').eq('rodada_id', rodadaAtual.id).limit(1);
        if (!historicoExistente || historicoExistente.length === 0) {
          console.log('Criando sequência de sabores para rodada existente...');
          await criarSequenciaParaRodada(rodadaAtual.id, numeroPizzas);
          await new Promise(resolve => setTimeout(resolve, 500));
          forceGlobalSync();
        }
        console.log('Iniciando rodada...');
        await iniciarRodada(rodadaAtual.id);
        setTimeout(() => {
          forceGlobalSync();
          refetchRodadas();
        }, 500);
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
  const handlePausarRodada = async () => {
    if (!rodadaAtual) return;
    try {
      console.log('Pausando rodada...');
      await pausarRodada(rodadaAtual.id);
      setTimeout(() => {
        forceGlobalSync();
        refetchRodadas();
      }, 500);
      toast.success('⏸️ Rodada pausada!', {
        duration: 3000,
        position: 'top-center'
      });
    } catch (error) {
      console.error('Erro ao pausar rodada:', error);
      toast.error('Erro ao pausar rodada. Tente novamente.', {
        duration: 4000,
        position: 'top-center'
      });
    }
  };
  const handleRetomarRodada = async () => {
    if (!rodadaAtual) return;
    try {
      console.log('Retomando rodada...');
      await iniciarRodada(rodadaAtual.id);
      setTimeout(() => {
        forceGlobalSync();
        refetchRodadas();
      }, 500);
      toast.success('▶️ Rodada retomada!', {
        duration: 3000,
        position: 'top-center'
      });
    } catch (error) {
      console.error('Erro ao retomar rodada:', error);
      toast.error('Erro ao retomar rodada. Tente novamente.', {
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
  useEffect(() => {
    const handleGlobalDataChange = (event: CustomEvent) => {
      const {
        table,
        action
      } = event.detail;
      if (table === 'rodadas') {
        refetchRodadas();
        refetchCounter();
      } else if (table === 'pizzas') {
        refetchPizzas();
      }
    };
    window.addEventListener('global-data-changed', handleGlobalDataChange as EventListener);
    return () => {
      window.removeEventListener('global-data-changed', handleGlobalDataChange as EventListener);
    };
  }, [refetchRodadas, refetchCounter, refetchPizzas]);
  const pizzasProntas = pizzas.filter(p => p.status === 'pronta');
  const pizzasAvaliadas = pizzas.filter(p => p.status === 'avaliada');
  const pizzasAprovadas = pizzasAvaliadas.filter(p => p.resultado === 'aprovada');
  const pizzasReprovadas = pizzasAvaliadas.filter(p => p.resultado === 'reprovada');
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
  const getSaborCorRodadaAtual = (saborNome: string) => {
    const nome = saborNome?.toLowerCase() || '';
    if (nome.includes('mussarela') || nome.includes('queijo')) {
      return 'rgba(234, 179, 8, 0.15)';
    } else if (nome.includes('pepperoni') || nome.includes('calabresa')) {
      return 'rgba(234, 88, 12, 0.15)';
    } else if (nome.includes('margherita') || nome.includes('tomate')) {
      return 'rgba(22, 163, 74, 0.15)';
    } else if (nome.includes('frango') || nome.includes('chicken')) {
      return 'rgba(220, 38, 38, 0.15)';
    } else if (nome.includes('portuguesa')) {
      return 'rgba(124, 58, 237, 0.15)';
    } else {
      return 'rgba(107, 114, 128, 0.15)';
    }
  };

  // Componente para o conteúdo atual de controle de rodadas
  const ControleRodadasContent = () => <div className="space-y-8">
      {/* Controles da Rodada Simplificados */}
      <Card className="shadow-lg border-2 border-red-200">
        <CardHeader className="bg-red-50">
          <CardTitle>⚙️ Controle da Rodada</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <Label htmlFor="tempoLimite">Tempo Limite (segundos)</Label>
              <Input id="tempoLimite" type="number" value={tempoLimite} onChange={e => setTempoLimite(Number(e.target.value))} disabled={rodadaAtual?.status === 'ativa' || rodadaAtual?.status === 'pausada'} />
            </div>

            <div>
              <Label htmlFor="numeroPizzas">Número de Pizzas</Label>
              <Input id="numeroPizzas" type="number" value={numeroPizzas} onChange={e => setNumeroPizzas(Number(e.target.value))} disabled={rodadaAtual?.status === 'ativa' || rodadaAtual?.status === 'pausada'} min="1" max="50" />
            </div>

            <div>
              {rodadaAtual?.status === 'ativa' ? <div className="flex gap-2">
                  <Button onClick={handlePausarRodada} className="flex-1 bg-orange-500 hover:bg-orange-600" size="sm">
                    <Pause className="w-4 h-4 mr-1" />
                    Pausar
                  </Button>
                  <Button onClick={handleFinalizarRodada} className="flex-1 bg-red-500 hover:bg-red-600" size="sm">
                    <Square className="w-4 h-4 mr-1" />
                    Encerrar
                  </Button>
                </div> : rodadaAtual?.status === 'pausada' ? <div className="flex gap-2">
                  <Button onClick={handleRetomarRodada} className="flex-1 bg-green-500 hover:bg-green-600" size="sm">
                    <Play className="w-4 h-4 mr-1" />
                    Retomar
                  </Button>
                  <Button onClick={handleFinalizarRodada} className="flex-1 bg-red-500 hover:bg-red-600" size="sm">
                    <Square className="w-4 h-4 mr-1" />
                    Encerrar
                  </Button>
                </div> : <Button onClick={handleIniciarRodada} className="w-full bg-green-500 hover:bg-green-600" disabled={loadingSequencia}>
                  {loadingSequencia ? 'Criando Sequência...' : `Iniciar Rodada ${numeroRodadaDisplay}`}
                </Button>}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => adicionarMinutos(-1)} disabled={!rodadaAtual || rodadaAtual.status !== 'ativa'} variant="outline" size="sm" className="flex-1">
                -1 min
              </Button>
              <Button onClick={() => adicionarMinutos(1)} disabled={!rodadaAtual || rodadaAtual.status !== 'ativa'} variant="outline" size="sm" className="flex-1">
                +1 min
              </Button>
            </div>

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
      <Card className="shadow-lg border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-4xl">Rodada {numeroRodadaDisplay}</span>
            <div className="flex items-center gap-4">
              <Badge variant={rodadaAtual?.status === 'ativa' ? "default" : "secondary"} className={rodadaAtual?.status === 'ativa' ? 'bg-green-500' : rodadaAtual?.status === 'aguardando' ? 'bg-yellow-500' : rodadaAtual?.status === 'pausada' ? 'bg-orange-500' : 'bg-gray-500'}>
                {rodadaAtual?.status === 'ativa' ? "Em Andamento" : rodadaAtual?.status === 'aguardando' ? "Aguardando" : rodadaAtual?.status === 'pausada' ? "Pausada" : "Finalizada"}
              </Badge>
              {rodadaAtual?.status === 'ativa' && <div className="flex gap-2">
                  <Button onClick={handlePausarRodada} className="bg-orange-500 hover:bg-orange-600" size="sm">
                    <Pause className="w-4 h-4 mr-1" />
                    Pausar
                  </Button>
                  <Button onClick={handleFinalizarRodada} className="bg-red-500 hover:bg-red-600" size="sm">
                    <Square className="w-4 h-4 mr-1" />
                    Encerrar
                  </Button>
                </div>}
              {rodadaAtual?.status === 'pausada' && <div className="flex gap-2">
                  <Button onClick={handleRetomarRodada} className="bg-green-500 hover:bg-green-600" size="sm">
                    <Play className="w-4 h-4 mr-1" />
                    Retomar
                  </Button>
                  <Button onClick={handleFinalizarRodada} className="bg-red-500 hover:bg-red-600" size="sm">
                    <Square className="w-4 h-4 mr-1" />
                    Encerrar
                  </Button>
                </div>}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${timeColor}`}>
                  {formattedTime}
                </div>
                <Progress value={progressPercentage} className="w-full mb-4" />
              </div>
            </div>

            {/* Sabores da Rodada Integrados - Modificado para incluir rodadas pausadas */}
            {rodadaAtual && historico.length > 0 && <div>
                {(rodadaAtual.status === 'ativa' || rodadaAtual.status === 'pausada') && saborAtual ? <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Sabor Atual */}
                    <div className="lg:col-span-2 my-[5px]">
                      <Card className={`shadow-lg border-2 ${rodadaAtual.status === 'pausada' ? 'border-orange-400 bg-orange-100' : 'border-green-400 bg-green-100'}`}>
                        <CardContent className={`p-6 text-center my-[10px] ${rodadaAtual.status === 'pausada' ? 'bg-orange-100' : 'bg-green-100'}`}>
                          <Badge className={`${rodadaAtual.status === 'pausada' ? 'bg-orange-500' : 'bg-green-500'} text-white text-sm px-3 py-1 mb-3`}>
                            🍕 {rodadaAtual.status === 'pausada' ? 'PAUSADO' : 'EM PRODUÇÃO'}
                          </Badge>
                          <div className="text-4xl mb-3">🍕</div>
                          <h3 className={`font-bold mb-2 text-4xl ${rodadaAtual.status === 'pausada' ? 'text-orange-700' : 'text-green-700'}`}>
                            {getSaborNome(saborAtual)}
                          </h3>
                          {getSaborDescricao(saborAtual) && <p className={`text-sm mb-3 ${rodadaAtual.status === 'pausada' ? 'text-orange-600' : 'text-green-600'}`}>
                              {getSaborDescricao(saborAtual)}
                            </p>}
                          <div className={`text-sm mb-3 ${rodadaAtual.status === 'pausada' ? 'text-orange-600' : 'text-green-600'}`}>
                            Pizza #{saborAtualIndex + 1} de {historico.length}
                          </div>
                          {rodadaAtual.status === 'ativa' && <div className="bg-green-100 p-2 rounded text-xs text-green-600">
                            Próxima troca: {formatarTempo(tempoProximaTroca)}
                          </div>}
                          {rodadaAtual.status === 'pausada' && <div className="bg-orange-100 p-2 rounded text-xs text-orange-600">
                            Rodada pausada
                          </div>}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Próximos Sabores */}
                    <div className="space-y-3">
                      {proximoSabor ? <Card className="shadow-lg border-2 border-blue-400 bg-orange-200">
                          <CardContent className="p-3 text-center bg-orange-100">
                            <Badge className="bg-blue-500 text-white text-xs px-2 py-1 mb-2">PRÓXIMO 1</Badge>
                            <div className="text-2xl mb-2">🍕</div>
                            <h4 className="font-bold text-3xl text-sky-700">
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
                          <CardContent className="p-3 text-center bg-red-200">
                            <Badge className="bg-purple-500 text-white text-xs px-2 py-1 mb-2">PRÓXIMO 2</Badge>
                            <div className="text-2xl mb-2">🍕</div>
                            <h4 className="font-bold text-purple-700 text-3xl">
                              {getSaborNome(segundoProximoSabor)}
                            </h4>
                            <div className="text-xs text-purple-600">
                              Pizza #{saborAtualIndex + 3}
                            </div>
                          </CardContent>
                        </Card>}
                    </div>
                  </div> : <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <Card className="shadow-lg border-2 border-yellow-400 bg-yellow-50">
                        <CardContent className="p-6 text-center py-[71px] my-[6px]">
                          <Badge className="bg-yellow-500 text-white text-sm px-3 mb-3 py-[3px] rounded-md">🍕 EM  PRODUÇÃO</Badge>
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
                            <h4 className="font-bold text-4xl text-sky-700 py-0 my-[13px] mx-0">
                              {getSaborNome(historico[1])}
                            </h4>
                            <div className="text-xs text-blue-600">
                              Pizza #{historico[1].ordem}
                            </div>
                          </CardContent>
                        </Card>}

                      {historico[2] && <Card className="shadow-lg border-2 border-purple-400 bg-purple-50">
                          <CardContent className="p-3 text-center">
                            <Badge className="bg-purple-500 text-white text-xs px-2 py-1 mb-2">PRÓXIMO 3</Badge>
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
                  </div>}
                {/* Histórico Visual da Rodada Atual - Modificado para incluir rodadas pausadas */}
                {(rodadaAtual.status === 'ativa' || rodadaAtual.status === 'pausada') && historico.length > 0 && <div className="mt-6 pt-4 border-t border-orange-200">
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {historico.map((sabor, index) => {
                  const saborNome = getSaborNome(sabor);
                  const cor = getSaborCorRodadaAtual(saborNome);
                  const isAtual = index === saborAtualIndex;
                  const isPassado = index < saborAtualIndex;
                  if (!isPassado && !isAtual) {
                    return null;
                  }
                  return <div key={sabor.id} className={`relative group cursor-pointer transition-all duration-200 ${isAtual ? 'scale-105 z-10' : ''}`} title={`Pizza #${index + 1}: ${saborNome}`}>
                            <Card className={`shadow-lg border-2 ${isAtual ? (rodadaAtual.status === 'pausada' ? 'border-orange-600' : 'border-yellow-600') : 'border-gray-300 opacity-80'} ${isAtual && rodadaAtual.status === 'ativa' ? 'animate-pulse' : ''}`} style={{
                      backgroundColor: cor
                    }}>
                              <CardContent className="p-4 text-center mx-0 my-0 px-[18px] py-0">
                                <Badge className="text-white text-xs px-2 py-1 mb-2 bg-zinc-800">
                                  #{index + 1}
                                </Badge>
                                <h4 className="text-2xl font-bold text-zinc-700">
                                  {saborNome.length > 12 ? saborNome.substring(0, 12) + '...' : saborNome}
                                </h4>
                              </CardContent>
                            </Card>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                              Pizza #{index + 1}: {saborNome}
                            </div>
                            {isAtual && <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-white ${rodadaAtual.status === 'pausada' ? 'bg-orange-400' : 'bg-orange-400 animate-pulse'}`}></div>}
                            {isPassado && <div className="absolute -top-2 -right-2 w-4 h-4 bg-gray-500 rounded-full border-2 border-white">
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              </div>}
                          </div>;
                })}
                    </div>
                    {/* Legenda específica para rodada atual */}
                    <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-500 bg-opacity-30 border border-yellow-500 rounded-full"></div>
                        <span>Mussarela/Queijo</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-orange-600 bg-opacity-30 border border-orange-600 rounded-full"></div>
                        <span>Pepperoni/Calabresa</span>
                      </div>
                    </div>
                  </div>}
              </div>}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Sabores Automático */}
      <HistoricoSaboresAutomatico rodada={rodadaAtual} numeroPizzas={numeroPizzas} />

      {/* Histórico de Todas as Rodadas */}
      <div className="mb-8">
        <HistoricoTodasRodadas />
      </div>

      {/* Status por Equipe */}
      <Card className="shadow-lg border-2 border-purple-200 mb-8">
        
        
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
    </div>;
  return <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-red-600 mb-2">💻 Administração</h1>
          <p className="text-gray-600">Gerencie rodadas, equipes e monitore o progresso em tempo real</p>
          
          {/* Status da Rodada */}
          <Card className="mt-4 shadow-lg border-2 border-red-200">
            <CardContent className="p-4">
              {rodadaAtual ? <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-red-600">Rodada {rodadaAtual.numero}</div>
                    <div className="text-sm text-gray-600 capitalize">{rodadaAtual.status}</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-600">{estatisticasGerais.pizzasAprovadas}</div>
                    <div className="text-sm text-gray-600">Aprovadas</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-orange-600">{estatisticasGerais.pizzasPendentes}</div>
                    <div className="text-sm text-gray-600">Pendentes</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-purple-600">{estatisticasGerais.equipesAtivas}</div>
                    <div className="text-sm text-gray-600">Equipes Ativas</div>
                  </div>
                </div> : <div className="text-lg text-gray-600">Nenhuma rodada ativa</div>}
            </CardContent>
          </Card>

        </div>

        {/* Conteúdo Principal com 4 Abas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="controle">🎮 Carrossel</TabsTrigger>
            <TabsTrigger value="gestao">👥 Gestão</TabsTrigger>
            <TabsTrigger value="sabores">🍕 Sabores</TabsTrigger>
            <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="controle" className="mt-6">
            <ControleRodadasContent />
          </TabsContent>
          
          <TabsContent value="gestao" className="mt-6">
            <GestaoEquipes />
          </TabsContent>
          
          <TabsContent value="sabores" className="mt-6">
            <GerenciadorSabores />
          </TabsContent>
          
          <TabsContent value="dashboard" className="mt-6">
            <DashboardLojinha />
          </TabsContent>
        </Tabs>

        {/* Estatísticas Rápidas */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center p-4 bg-white shadow-lg">
            <div className="text-2xl font-bold text-red-600">{estatisticasGerais.totalPizzas}</div>
            <div className="text-sm text-gray-600">Total de Pizzas</div>
          </Card>
          <Card className="text-center p-4 bg-white shadow-lg">
            <div className="text-2xl font-bold text-green-600">{estatisticasGerais.pizzasAprovadas}</div>
            <div className="text-sm text-gray-600">Aprovadas</div>
          </Card>
          <Card className="text-center p-4 bg-white shadow-lg">
            <div className="text-2xl font-bold text-red-600">{estatisticasGerais.pizzasReprovadas}</div>
            <div className="text-sm text-gray-600">Reprovadas</div>
          </Card>
          <Card className="text-center p-4 bg-white shadow-lg">
            <div className="text-2xl font-bold text-purple-600">{estatisticasGerais.equipesAtivas}</div>
            <div className="text-sm text-gray-600">Equipes Ativas</div>
          </Card>
        </div>
      </div>
    </div>;
};
export default ProducaoScreen;
