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
import { useHistoricoSaboresRodada } from '@/hooks/useHistoricoSaboresRodada';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SeletorSaborProfessor from './SeletorSaborProfessor';

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

  // Hook para histórico de sabores do banco
  const {
    saborAtual: saborAtualDB
  } = useHistoricoSaboresRodada(rodadaAtual?.id);

  // Timer sincronizado
  const {
    timeRemaining,
    formattedTime,
    timeColor,
    progressPercentage
  } = useSynchronizedTimer(rodadaAtual, {
    onTimeUp: () => {
      if (rodadaAtual) {
        handleFinalizarRodada();
      }
    },
    onWarning: secondsLeft => {
      toast.warning(`⚠️ Atenção: ${secondsLeft} segundos restantes!`, {
        duration: 3000
      });
    },
    warningThreshold: 30
  });

  const [tempoLimite, setTempoLimite] = useState(300);
  
  // Estados para compatibilidade com sistema antigo (mantido para não quebrar)
  const [saborAtual, setSaborAtual] = useState<string>('');
  const [historicoSabores, setHistoricoSabores] = useState<SaborRodada[]>([]);
  const [ultimaTrocaEmEquipes, setUltimaTrocaEmEquipes] = useState(0);

  // Atualizar sabor atual baseado no banco de dados
  useEffect(() => {
    if (saborAtualDB) {
      const saborNome = sabores.find(s => s.id === saborAtualDB.sabor_id)?.nome || '';
      setSaborAtual(saborNome);
    } else {
      setSaborAtual('');
    }
  }, [saborAtualDB, sabores]);

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

  // Efeito principal para verificar mudança de sabor baseado nas pizzas
  useEffect(() => {
    if (!rodadaAtual || rodadaAtual.status !== 'ativa' || equipes.length === 0 || pizzas.length === 0) return;
    const metadeEquipes = Math.ceil(equipes.length / 2);

    // Contar equipes únicas que enviaram pizzas
    const equipesQueEnviaram = new Set<string>();
    pizzas.forEach(pizza => {
      equipesQueEnviaram.add(pizza.equipe_id);
    });
    const numEquipesQueEnviaram = equipesQueEnviaram.size;
    console.log(`Verificando troca de sabor: ${numEquipesQueEnviaram} equipes enviaram, metade necessária: ${metadeEquipes}, última troca em: ${ultimaTrocaEmEquipes}`);

    // Verificar se deve trocar sabor
    if (numEquipesQueEnviaram >= metadeEquipes && numEquipesQueEnviaram > ultimaTrocaEmEquipes) {
      console.log('Iniciando troca de sabor...');

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

      // Iniciar novo sabor após pequeno delay
      setTimeout(() => {
        iniciarNovoSabor();
      }, 1000);
    }
  }, [pizzas.length, equipes.length, rodadaAtual?.id, ultimaTrocaEmEquipes, historicoSabores.length]);

  // Resetar estado quando rodada muda ou é criada
  useEffect(() => {
    if (!rodadaAtual) {
      // Nenhuma rodada ativa, limpar tudo
      setSaborAtual('');
      setHistoricoSabores([]);
      setUltimaTrocaEmEquipes(0);
      return;
    }
    if (rodadaAtual.status === 'aguardando') {
      // Rodada aguardando, resetar para próxima
      setSaborAtual('');
      setHistoricoSabores([]);
      setUltimaTrocaEmEquipes(0);
      return;
    }
    if (rodadaAtual.status === 'ativa' && historicoSabores.length === 0 && sabores.length > 0) {
      // Rodada ativa sem sabor definido, iniciar primeiro sabor
      console.log('Iniciando primeiro sabor da rodada');
      iniciarNovoSabor();
    }
  }, [rodadaAtual?.status, rodadaAtual?.id, sabores.length, historicoSabores.length]);
  const handleIniciarRodada = async () => {
    if (!rodadaAtual) {
      // Criar nova rodada se não existe uma aguardando
      try {
        await criarNovaRodada(proximoNumero, tempoLimite);
        await refetchCounter();
      } catch (error) {
        toast.error('Erro ao criar nova rodada');
      }
      return;
    }
    if (rodadaAtual.status === 'aguardando') {
      try {
        await iniciarRodada(rodadaAtual.id);
      } catch (error) {
        toast.error('Erro ao iniciar rodada');
      }
    }
  };
  const handleFinalizarRodada = async () => {
    if (!rodadaAtual) return;
    try {
      await finalizarRodada(rodadaAtual.id);
      await refetchCounter();
    } catch (error) {
      toast.error('Erro ao finalizar rodada');
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
        duration: 2000
      });
    } catch (error) {
      console.error('Erro ao ajustar tempo da rodada:', error);
      toast.error('Erro ao ajustar tempo da rodada');
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
      await Promise.all([refetchCounter(), refetchPizzas()]);
    } catch (error) {
      console.error('Erro ao resetar jogo:', error);
    }
  };

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

  return <div className="relative min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-600 mb-2">💻ADMINISTRAÇÃO</h1>
          <p className="text-gray-600">Acompanhe o status das pizzas em tempo real</p>
          <div className="mt-2 text-sm text-gray-500">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </div>
        </div>

        {/* Seletor de Sabor do Professor */}
        <SeletorSaborProfessor 
          rodadaId={rodadaAtual?.id}
          rodadaAtiva={rodadaAtual?.status === 'ativa'}
        />

        {/* Controles da Rodada Simplificados */}
        <Card className="shadow-lg border-2 border-red-200 mb-8">
          <CardHeader className="bg-red-50">
            <CardTitle>⚙️ Controle da Rodada</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              {/* Tempo Limite */}
              <div>
                <Label htmlFor="tempoLimite">Tempo Limite (segundos)</Label>
                <Input id="tempoLimite" type="number" value={tempoLimite} onChange={e => setTempoLimite(Number(e.target.value))} disabled={rodadaAtual?.status === 'ativa'} />
              </div>

              {/* Botão Principal da Rodada */}
              <div>
                {rodadaAtual?.status === 'ativa' ? <Button onClick={handleFinalizarRodada} className="w-full bg-red-500 hover:bg-red-600">
                    Encerrar Rodada
                  </Button> : <Button onClick={handleIniciarRodada} className="w-full bg-green-500 hover:bg-green-600">
                    Iniciar Rodada {numeroRodadaDisplay}
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

        {/* Timer e Status da Rodada */}
        <Card className="shadow-lg border-2 border-orange-200 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Rodada {numeroRodadaDisplay}</span>
              <Badge variant={rodadaAtual?.status === 'ativa' ? "default" : "secondary"} className={rodadaAtual?.status === 'ativa' ? 'bg-green-500' : rodadaAtual?.status === 'aguardando' ? 'bg-yellow-500' : 'bg-gray-500'}>
                {rodadaAtual?.status === 'ativa' ? "Em Andamento" : rodadaAtual?.status === 'aguardando' ? "Aguardando" : "Finalizada"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
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
