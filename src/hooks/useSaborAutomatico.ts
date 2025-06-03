
import { useState, useEffect, useRef } from 'react';
import { useHistoricoSaboresRodada } from '@/hooks/useHistoricoSaboresRodada';
import { useSynchronizedTimer } from '@/hooks/useSynchronizedTimer';
import { Rodada } from '@/types/database';

interface UseSaborAutomaticoProps {
  rodada: Rodada | null;
  numeroPizzas: number;
}

export const useSaborAutomatico = ({ rodada, numeroPizzas }: UseSaborAutomaticoProps) => {
  const { historico } = useHistoricoSaboresRodada(rodada?.id);
  const [saborAtualIndex, setSaborAtualIndex] = useState(0);
  const [saboresPassados, setSaboresPassados] = useState<any[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Calcular intervalo de troca (tempo total ÷ número de pizzas)
  const intervaloTroca = rodada && numeroPizzas > 0 ? Math.floor(rodada.tempo_limite / numeroPizzas) : 0;
  
  // Timer sincronizado para obter tempo restante
  const { timeRemaining } = useSynchronizedTimer(rodada, {});
  
  useEffect(() => {
    if (!rodada || rodada.status !== 'ativa' || !historico.length || intervaloTroca <= 0) {
      return;
    }
    
    // Calcular qual sabor deveria estar ativo baseado no tempo decorrido
    const tempoDecorrido = rodada.tempo_limite - timeRemaining;
    const novoIndex = Math.min(
      Math.floor(tempoDecorrido / intervaloTroca),
      historico.length - 1
    );
    
    // Se mudou de sabor, atualizar
    if (novoIndex !== saborAtualIndex && novoIndex >= 0) {
      // Adicionar sabor anterior aos passados se não for o primeiro
      if (saborAtualIndex < novoIndex) {
        const saboresParaAdicionar = historico.slice(saborAtualIndex, novoIndex);
        setSaboresPassados(prev => {
          const novosPassados = [...prev];
          saboresParaAdicionar.forEach(sabor => {
            if (!novosPassados.find(s => s.id === sabor.id)) {
              novosPassados.push({
                ...sabor,
                tempoFinalizado: new Date().toISOString()
              });
            }
          });
          return novosPassados;
        });
      }
      
      setSaborAtualIndex(novoIndex);
      
      // Disparar evento global para notificar outras telas
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sabor-automatico-alterado', {
          detail: {
            rodadaId: rodada.id,
            saborAtual: historico[novoIndex],
            saborIndex: novoIndex,
            saboresPassados: saboresPassados,
            timestamp: new Date().toISOString()
          }
        }));
      }
    }
  }, [timeRemaining, rodada, historico, intervaloTroca, saborAtualIndex, saboresPassados]);
  
  // Reset quando rodada muda ou finaliza
  useEffect(() => {
    if (!rodada || rodada.status !== 'ativa') {
      setSaborAtualIndex(0);
      setSaboresPassados([]);
    }
  }, [rodada?.id, rodada?.status]);
  
  const saborAtual = historico[saborAtualIndex];
  const proximoSabor = historico[saborAtualIndex + 1];
  const segundoProximoSabor = historico[saborAtualIndex + 2];
  
  // Calcular tempo restante para próxima troca
  const tempoDecorrido = rodada ? rodada.tempo_limite - timeRemaining : 0;
  const tempoProximaTroca = intervaloTroca > 0 ? 
    Math.max(0, ((saborAtualIndex + 1) * intervaloTroca) - tempoDecorrido) : 0;
  
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
