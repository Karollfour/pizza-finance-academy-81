
import { useState, useEffect, useRef, useMemo } from 'react';
import { useHistoricoSaboresRodada } from '@/hooks/useHistoricoSaboresRodada';
import { useSynchronizedTimer } from '@/hooks/useSynchronizedTimer';
import { Rodada } from '@/types/database';

interface UseSaborAutomaticoProps {
  rodada: Rodada | null;
  numeroPizzas: number;
}

export const useSaborAutomatico = ({ rodada, numeroPizzas }: UseSaborAutomaticoProps) => {
  const { historico, refetch } = useHistoricoSaboresRodada(rodada?.id);
  const [saborAtualIndex, setSaborAtualIndex] = useState(0);
  const [saboresPassados, setSaboresPassados] = useState<any[]>([]);
  const lastUpdateRef = useRef<number>(0);
  const lastIndexRef = useRef<number>(0);
  const saboresPassadosRef = useRef<any[]>([]);
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [forcarInicioCarrossel, setForcarInicioCarrossel] = useState(false);
  
  // Calcular intervalo de troca (tempo total ÷ número de pizzas) - memoizado
  const intervaloTroca = useMemo(() => {
    return rodada && numeroPizzas > 0 ? Math.floor(rodada.tempo_limite / numeroPizzas) : 0;
  }, [rodada?.tempo_limite, numeroPizzas]);
  
  // Timer sincronizado para obter tempo restante
  const { timeRemaining } = useSynchronizedTimer(rodada, {});
  
  // Escutar eventos globais para atualização imediata - apenas quando necessário
  useEffect(() => {
    const handleGlobalDataChange = (event: CustomEvent) => {
      const { table } = event.detail;
      if (table === 'historico_sabores_rodada' && rodada?.id) {
        // Limpar timeout anterior se existir
        if (refetchTimeoutRef.current) {
          clearTimeout(refetchTimeoutRef.current);
        }
        
        refetchTimeoutRef.current = setTimeout(() => {
          refetch();
        }, 100);
      }
    };

    const handleRodadaEvent = () => {
      if (rodada?.id) {
        // Limpar timeout anterior se existir
        if (refetchTimeoutRef.current) {
          clearTimeout(refetchTimeoutRef.current);
        }
        
        refetchTimeoutRef.current = setTimeout(() => {
          refetch();
        }, 100);
      }
    };

    window.addEventListener('global-data-changed', handleGlobalDataChange as EventListener);
    window.addEventListener('rodada-iniciada', handleRodadaEvent);
    window.addEventListener('rodada-updated', handleRodadaEvent);

    return () => {
      window.removeEventListener('global-data-changed', handleGlobalDataChange as EventListener);
      window.removeEventListener('rodada-iniciada', handleRodadaEvent);
      window.removeEventListener('rodada-updated', handleRodadaEvent);
      
      // Limpar timeout no cleanup
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, [rodada?.id, refetch]);
  
  // MUDANÇA: Escutar evento de rodada iniciada para forçar início do carrossel
  useEffect(() => {
    const handleRodadaIniciada = (event: CustomEvent) => {
      const { rodadaId } = event.detail;
      if (rodada?.id === rodadaId) {
        console.log('Rodada iniciada - FORÇANDO início do cronômetro do carrossel IMEDIATAMENTE');
        // Reset completo e forçar início
        setSaborAtualIndex(0);
        setSaboresPassados([]);
        lastIndexRef.current = 0;
        saboresPassadosRef.current = [];
        lastUpdateRef.current = 0;
        setForcarInicioCarrossel(true); // Forçar início do carrossel
      }
    };

    window.addEventListener('rodada-iniciada', handleRodadaIniciada as EventListener);
    
    return () => {
      window.removeEventListener('rodada-iniciada', handleRodadaIniciada as EventListener);
    };
  }, [rodada?.id]);
  
  // Atualizar índice do sabor atual - MODIFICADO para funcionar com forçar início
  useEffect(() => {
    if (!rodada || !historico.length || intervaloTroca <= 0) {
      return;
    }
    
    // MUDANÇA: Permitir funcionamento se rodada está ativa OU se foi forçado o início
    const podeRodar = rodada.status === 'ativa' || forcarInicioCarrossel;
    if (!podeRodar) {
      return;
    }
    
    const now = Date.now();
    // Atualizar a cada 500ms para resposta mais rápida
    if (now - lastUpdateRef.current < 500) {
      return;
    }
    lastUpdateRef.current = now;
    
    // Calcular qual sabor deveria estar ativo baseado no tempo decorrido
    const tempoDecorrido = rodada.tempo_limite - timeRemaining;
    const novoIndex = Math.min(
      Math.floor(tempoDecorrido / intervaloTroca),
      historico.length - 1
    );
    
    // Só atualizar se realmente mudou o índice
    if (novoIndex !== lastIndexRef.current && novoIndex >= 0) {
      // Adicionar sabores anteriores aos passados se não for o primeiro
      if (lastIndexRef.current < novoIndex) {
        const saboresParaAdicionar = historico.slice(lastIndexRef.current, novoIndex);
        const novosPassados = [...saboresPassadosRef.current];
        
        saboresParaAdicionar.forEach(sabor => {
          if (!novosPassados.find(s => s.id === sabor.id)) {
            novosPassados.push({
              ...sabor,
              tempoFinalizado: new Date().toISOString()
            });
          }
        });
        
        // Só atualizar se realmente mudou
        if (JSON.stringify(novosPassados) !== JSON.stringify(saboresPassadosRef.current)) {
          saboresPassadosRef.current = novosPassados;
          setSaboresPassados(novosPassados);
        }
      }
      
      lastIndexRef.current = novoIndex;
      setSaborAtualIndex(novoIndex);
      
      // Disparar evento global apenas quando muda o índice
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sabor-automatico-alterado', {
          detail: {
            rodadaId: rodada.id,
            saborAtual: historico[novoIndex],
            saborIndex: novoIndex,
            saboresPassados: saboresPassadosRef.current,
            timestamp: new Date().toISOString()
          }
        }));
      }
    }
  }, [timeRemaining, rodada, historico, intervaloTroca, forcarInicioCarrossel]);

  // Reset quando rodada finaliza ou muda
  useEffect(() => {
    if (!rodada || (rodada.status !== 'ativa' && rodada.status !== 'pausada')) {
      setSaborAtualIndex(0);
      setSaboresPassados([]);
      lastIndexRef.current = 0;
      saboresPassadosRef.current = [];
      setForcarInicioCarrossel(false); // Reset do forçar início
    }
  }, [rodada?.id, rodada?.status]);
  
  // Memoizar valores para evitar re-renderizações
  const saborAtual = useMemo(() => historico[saborAtualIndex], [historico, saborAtualIndex]);
  const proximoSabor = useMemo(() => historico[saborAtualIndex + 1], [historico, saborAtualIndex]);
  const segundoProximoSabor = useMemo(() => historico[saborAtualIndex + 2], [historico, saborAtualIndex]);
  
  // Calcular tempo restante para próxima troca - memoizado
  const tempoProximaTroca = useMemo(() => {
    if (!rodada || intervaloTroca <= 0 || (rodada.status === 'pausada' && !forcarInicioCarrossel)) return 0;
    const tempoDecorrido = rodada.tempo_limite - timeRemaining;
    return Math.max(0, ((saborAtualIndex + 1) * intervaloTroca) - tempoDecorrido);
  }, [rodada, intervaloTroca, timeRemaining, saborAtualIndex, forcarInicioCarrossel]);
  
  return {
    saborAtual,
    proximoSabor,
    segundoProximoSabor,
    saboresPassados,
    saborAtualIndex,
    intervaloTroca,
    tempoProximaTroca,
    totalSabores: historico.length
  };
};
