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
import { useConfiguracoes } from '@/hooks/useConfiguracoes';
import { useSabores } from '@/hooks/useSabores';
import { useResetJogo } from '@/hooks/useResetJogo';
import { useGlobalRealtime } from '@/hooks/useGlobalRealtime';
import RealtimeConnectionIndicator from '@/components/RealtimeConnectionIndicator';
import { toast } from 'sonner';

interface SaborRodada {
  sabor: string;
  iniciadoEm: string;
  pizzasEnviadas: number;
  equipesQueEnviaram: string[];
}

const ProducaoScreen = () => {
  const {
    rodadaAtual,
    iniciarRodada,
    finalizarRodada,
    criarNovaRodada,
    lastUpdate
  } = useOptimizedRodadas();
  
  const { proximoNumero, refetch: refetchCounter } = useRodadaCounter();
  const { pizzas, refetch: refetchPizzas } = usePizzas(undefined, rodadaAtual?.id);
  const { equipes } = useEquipes();
  const { atualizarConfiguracao } = useConfiguracoes();
  const { sabores } = useSabores();
  const { resetarJogo, loading: resetLoading } = useResetJogo();
  
  // Usar sistema centralizado de realtime
  const { isConnected, connectionQuality } = useGlobalRealtime({
    enableHeartbeat: true,
    silent: false
  });

  // Timer sincronizado
  const {
    timeRemaining,
    formattedTime,
    timeColor,
    progressPercentage
  } = useSynchronizedTimer(rodadaAtual, {
    onTimeUp: () => {
      console.log('⏰ Timer acabou - finalizando rodada automaticamente');
      if (rodadaAtual) {
        handleFinalizarRodada();
      }
    },
    onWarning: (secondsLeft) => {
      toast.warning(`⚠️ Atenção: ${secondsLeft} segundos restantes!`, {
        duration: 3000,
      });
    },
    warningThreshold: 30
  });

  const [novoTempoLimite, setNovoTempoLimite] = useState(300);
  const [saborAtual, setSaborAtual] = useState<string>('');
  const [historicoSabores, setHistoricoSabores] = useState<SaborRodada[]>([]);
  const [ultimaTrocaEmEquipes, setUltimaTrocaEmEquipes] = useState(0);

  // Função para gerar sabor aleatório
  const gerarSaborAleatorio = () => {
    if (sabores.length > 0) {
      const saborAleatorio = sabores[Math.floor(Math.random() * sabores.length)];
      return saborAleatorio.nome;
    }
    return '';
  };

  // Função para iniciar novo sabor
  const iniciarNovoSabor = () => {
    const novoSabor = gerarSaborAleatorio();
    setSaborAtual(novoSabor);
    const novoSaborRodada: SaborRodada = {
      sabor: novoSabor,
      iniciadoEm: new Date().toISOString(),
      pizzasEnviadas: 0,
      equipesQueEnviaram: []
    };
    setHistoricoSabores(prev => [...prev, novoSaborRodada]);
    toast.info(`🍕 Novo sabor da rodada: ${novoSabor}`, {
      duration: 4000
    });
  };

  // Verificar se deve trocar de sabor baseado nas pizzas enviadas
  useEffect(() => {
    if (!rodadaAtual || rodadaAtual.status !== 'ativa' || equipes.length === 0) return;
    const metadeEquipes = Math.ceil(equipes.length / 2);

    // Contar pizzas únicas por equipe na rodada atual
    const equipesQueEnviaram = new Set<string>();
    pizzas.forEach(pizza => {
      equipesQueEnviaram.add(pizza.equipe_id);
    });
    const numEquipesQueEnviaram = equipesQueEnviaram.size;

    // Só trocar se:
    // 1. Chegou na metade das equipes
    // 2. Ainda não trocou para este número de equipes
    // 3. Há mais equipes que enviaram do que a última troca
    if (numEquipesQueEnviaram > 0 && numEquipesQueEnviaram % metadeEquipes === 0 && numEquipesQueEnviaram > ultimaTrocaEmEquipes) {
      // Atualizar histórico do sabor anterior se existe
      if (historicoSabores.length > 0) {
        setHistoricoSabores(prev => prev.map((item, index) => index === prev.length - 1 ? {
          ...item,
          pizzasEnviadas: pizzas.length,
          equipesQueEnviaram: Array.from(equipesQueEnviaram) as string[]
        } : item));
      }

      // Marcar que já houve troca para este número de equipes
      setUltimaTrocaEmEquipes(numEquipesQueEnviaram);

      // Iniciar novo sabor após um pequeno delay
      setTimeout(() => {
        iniciarNovoSabor();
      }, 1000);
    }
  }, [pizzas.length, equipes.length, rodadaAtual?.id, ultimaTrocaEmEquipes]);

  // Timer da rodada e inicialização
  useEffect(() => {
    if (!rodadaAtual || rodadaAtual.status !== 'ativa' || !rodadaAtual.iniciou_em) {
      setTimeRemaining(0);
      setSaborAtual('');
      setHistoricoSabores([]);
      // Só resetar o contador se não há rodada ou se a rodada mudou
      if (!rodadaAtual || rodadaAtual.status === 'aguardando') {
        setUltimaTrocaEmEquipes(0);
      }
      return;
    }

    // Iniciar primeiro sabor se não há histórico
    if (historicoSabores.length === 0) {
      iniciarNovoSabor();
    }
    const inicioRodada = new Date(rodadaAtual.iniciou_em).getTime();
    const duracaoRodada = rodadaAtual.tempo_limite * 1000;
    const interval = setInterval(() => {
      const agora = Date.now();
      const tempoDecorrido = agora - inicioRodada;
      const resto = Math.max(0, duracaoRodada - tempoDecorrido);
      setTimeRemaining(Math.ceil(resto / 1000));
      if (resto <= 0) {
        clearInterval(interval);
        setSaborAtual('');
        setHistoricoSabores([]);
        setUltimaTrocaEmEquipes(0);
        handleFinalizarRodada();
      }
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [rodadaAtual, sabores]);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const handleIniciarRodada = async () => {
    if (!rodadaAtual) return;
    try {
      await iniciarRodada(rodadaAtual.id);
      // A notificação já é enviada pelo hook otimizado
    } catch (error) {
      toast.error('Erro ao iniciar rodada');
    }
  };
  const handleFinalizarRodada = async () => {
    if (!rodadaAtual) return;
    try {
      await finalizarRodada(rodadaAtual.id);
      // A notificação já é enviada pelo hook otimizado
      await refetchCounter();
    } catch (error) {
      toast.error('Erro ao finalizar rodada');
    }
  };
  const handleCriarNovaRodada = async () => {
    try {
      await criarNovaRodada(proximoNumero, novoTempoLimite);
      // A notificação já é enviada pelo hook otimizado
      await refetchCounter();
    } catch (error) {
      toast.error('Erro ao criar nova rodada');
    }
  };
  const handleAtualizarTempoLimite = async () => {
    try {
      await atualizarConfiguracao('tempo_rodada_padrao', novoTempoLimite.toString());
      toast.success('Tempo padrão atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar tempo padrão');
    }
  };
  const handleResetarJogo = async () => {
    if (!confirm('⚠️ ATENÇÃO: Esta ação irá apagar TODOS os dados do jogo (rodadas, pizzas, compras e estatísticas). Esta ação NÃO PODE SER DESFEITA. Deseja continuar?')) {
      return;
    }
    if (!confirm('🚨 CONFIRMAÇÃO FINAL: Tem certeza absoluta de que deseja resetar todo o jogo? Todos os dados serão perdidos permanentemente!')) {
      return;
    }
    try {
      await resetarJogo();
      // Atualizar todos os dados após o reset
      await Promise.all([refetchRodadas(), refetchCounter(), refetchPizzas(), refetchEquipes()]);
    } catch (error) {
      console.error('Erro ao resetar jogo:', error);
    }
  };
  const progressPercentage = rodadaAtual?.tempo_limite ? (rodadaAtual.tempo_limite - timeRemaining) / rodadaAtual.tempo_limite * 100 : 0;

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

  // Obter número da rodada para exibição
  const numeroRodadaDisplay = rodadaAtual?.numero || proximoNumero;
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-6">
      {/* Indicador de conexão realtime */}
      <div className="fixed top-4 right-4 z-50">
        <RealtimeConnectionIndicator showDetails={true} />
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-600 mb-2">
            🍽️ Central de Produção
          </h1>
          <p className="text-gray-600">Acompanhe o status das pizzas em tempo real</p>
          <div className="mt-2 text-sm text-gray-500">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')} • 
            Conexão: <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Controles da Rodada */}
        <Card className="shadow-lg border-2 border-red-200 mb-8">
          <CardHeader className="bg-red-50">
            <CardTitle>⚙️ Controles da Rodada</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tempoLimite">Tempo Limite (segundos)</Label>
                <Input 
                  id="tempoLimite" 
                  type="number" 
                  value={novoTempoLimite} 
                  onChange={e => setNovoTempoLimite(Number(e.target.value))} 
                />
                <Button 
                  onClick={async () => {
                    try {
                      await atualizarConfiguracao('tempo_rodada_padrao', novoTempoLimite.toString());
                      toast.success('Tempo padrão atualizado!');
                    } catch (error) {
                      toast.error('Erro ao atualizar tempo padrão');
                    }
                  }} 
                  size="sm" 
                  className="mt-2 w-full" 
                  variant="outline"
                >
                  Atualizar Tempo Padrão
                </Button>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleCriarNovaRodada} 
                  className="w-full bg-blue-500 hover:bg-blue-600" 
                  disabled={rodadaAtual?.status === 'ativa'}
                >
                  Criar Rodada {proximoNumero}
                </Button>
              </div>
              <div className="flex items-end">
                {rodadaAtual?.status === 'aguardando' ? (
                  <Button 
                    onClick={handleIniciarRodada} 
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    Iniciar Rodada
                  </Button>
                ) : (
                  <Button 
                    onClick={handleFinalizarRodada} 
                    className="w-full bg-red-500 hover:bg-red-600" 
                    disabled={rodadaAtual?.status !== 'ativa'}
                  >
                    Finalizar Rodada
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timer e Status da Rodada */}
        <Card className="shadow-lg border-2 border-orange-200 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Rodada {numeroRodadaDisplay}</span>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={rodadaAtual?.status === 'ativa' ? "default" : "secondary"}
                  className={
                    rodadaAtual?.status === 'ativa' ? 'bg-green-500' :
                    rodadaAtual?.status === 'aguardando' ? 'bg-yellow-500' : 'bg-gray-500'
                  }
                >
                  {rodadaAtual?.status === 'ativa' ? "Em Andamento" : 
                   rodadaAtual?.status === 'aguardando' ? "Aguardando" : "Finalizada"}
                </Badge>
                <RealtimeConnectionIndicator showDetails={false} />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${timeColor}`}>
                  {formattedTime}
                </div>
                <Progress value={progressPercentage} className="w-full mb-4" />
                
                {/* Sabor Atual da Rodada */}
                {rodadaAtual?.status === 'ativa' && saborAtual && <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-bold text-yellow-800 mb-2">
                      🍕 Sabor Atual da Rodada
                    </h3>
                    <div className="text-2xl font-bold text-yellow-600">
                      {saborAtual}
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Sabor sendo produzido nesta rodada
                    </p>
                  </div>}

                {/* Histórico de Sabores da Rodada */}
                {historicoSabores.length > 0 && <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-bold text-blue-800 mb-3">
                      📜 Histórico de Sabores da Rodada
                    </h3>
                    <div className="space-y-2">
                      {historicoSabores.map((sabor, index) => <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
                          <div>
                            <span className="font-medium text-blue-600">{sabor.sabor}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(sabor.iniciadoEm).toLocaleTimeString('pt-BR')}
                            </span>
                          </div>
                          <Badge variant="outline" className="bg-blue-100">
                            {sabor.equipesQueEnviaram.length} equipes
                          </Badge>
                        </div>)}
                    </div>
                  </div>}
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
          </CardContent>
        </Card>

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
          <Button 
            onClick={handleResetarJogo} 
            disabled={resetLoading} 
            size="sm" 
            className="bg-red-600 hover:bg-red-700 text-white font-bold border-2 border-red-700 shadow-lg"
          >
            {resetLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Resetando Jogo...
              </>
            ) : (
              <>🔄 Resetar Jogo</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProducaoScreen;
