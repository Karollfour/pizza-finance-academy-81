
import { useState, useEffect, useCallback } from 'react';
import { Rodada } from '@/types/database';

interface UseSynchronizedTimerOptions {
  onTimeUp?: () => void;
  onWarning?: (secondsLeft: number) => void;
  warningThreshold?: number;
}

export const useSynchronizedTimer = (
  rodada: Rodada | null, 
  options: UseSynchronizedTimerOptions = {}
) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [hasWarned, setHasWarned] = useState(false);

  const { 
    onTimeUp, 
    onWarning, 
    warningThreshold = 30 
  } = options;

  // Calcular tempo restante com precisão melhorada
  const calculateTimeRemaining = useCallback(() => {
    if (!rodada || rodada.status !== 'ativa' || !rodada.iniciou_em) {
      return 0;
    }

    try {
      // Usar UTC para evitar problemas de timezone
      const now = new Date().getTime();
      const startTime = new Date(rodada.iniciou_em).getTime();
      const duration = rodada.tempo_limite * 1000; // converter para millisegundos
      const elapsed = now - startTime;
      const remaining = Math.max(0, duration - elapsed);
      
      // Converter de volta para segundos
      return Math.floor(remaining / 1000);
    } catch (error) {
      console.error('Erro ao calcular tempo restante:', error);
      return 0;
    }
  }, [rodada?.id, rodada?.status, rodada?.iniciou_em, rodada?.tempo_limite]);

  // Timer principal com melhor precisão
  useEffect(() => {
    if (!rodada || rodada.status !== 'ativa' || !rodada.iniciou_em) {
      setTimeRemaining(0);
      setIsActive(false);
      setHasWarned(false);
      return;
    }

    setIsActive(true);
    
    // Atualizar imediatamente
    const remaining = calculateTimeRemaining();
    setTimeRemaining(remaining);
    
    // Resetar warning quando o tempo muda
    if (remaining > warningThreshold) {
      setHasWarned(false);
    }

    // Timer com interval mais preciso
    const intervalId = setInterval(() => {
      const currentRemaining = calculateTimeRemaining();
      setTimeRemaining(currentRemaining);

      // Warning threshold
      if (!hasWarned && currentRemaining <= warningThreshold && currentRemaining > 0) {
        setHasWarned(true);
        onWarning?.(currentRemaining);
      }

      // Time up
      if (currentRemaining <= 0) {
        setIsActive(false);
        clearInterval(intervalId);
        onTimeUp?.();
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [rodada?.id, rodada?.status, rodada?.tempo_limite, rodada?.iniciou_em, calculateTimeRemaining, onTimeUp, onWarning, warningThreshold, hasWarned]);

  // Escutar eventos globais de rodada para sincronização instantânea
  useEffect(() => {
    const handleRodadaEvent = (event: CustomEvent) => {
      console.log('Timer recebeu evento de rodada:', event.type);
      // Recalcular imediatamente quando houver mudança de rodada
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      console.log('Timer atualizado para:', remaining, 'segundos');
      
      // Resetar warning se o tempo mudou
      if (remaining > warningThreshold) {
        setHasWarned(false);
      }
    };

    window.addEventListener('rodada-iniciada', handleRodadaEvent as EventListener);
    window.addEventListener('rodada-finalizada', handleRodadaEvent as EventListener);
    window.addEventListener('rodada-updated', handleRodadaEvent as EventListener);
    window.addEventListener('rodada-tempo-alterado', handleRodadaEvent as EventListener);

    return () => {
      window.removeEventListener('rodada-iniciada', handleRodadaEvent as EventListener);
      window.removeEventListener('rodada-finalizada', handleRodadaEvent as EventListener);
      window.removeEventListener('rodada-updated', handleRodadaEvent as EventListener);
      window.removeEventListener('rodada-tempo-alterado', handleRodadaEvent as EventListener);
    };
  }, [calculateTimeRemaining, warningThreshold]);

  // Sincronização quando a página volta ao foco
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        const remaining = calculateTimeRemaining();
        setTimeRemaining(remaining);
        console.log('Timer sincronizado após foco:', remaining, 'segundos');
      }
    };

    const handlePageShow = () => {
      if (isActive) {
        const remaining = calculateTimeRemaining();
        setTimeRemaining(remaining);
        console.log('Timer sincronizado após pageshow:', remaining, 'segundos');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [isActive, calculateTimeRemaining]);

  const formatTime = (seconds: number) => {
    // Garantir que seconds seja um número válido
    const validSeconds = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(validSeconds / 60);
    const secs = validSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining <= 10) return 'text-red-600';
    if (timeRemaining <= warningThreshold) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressPercentage = () => {
    if (!rodada || !rodada.tempo_limite) return 0;
    const elapsed = rodada.tempo_limite - timeRemaining;
    return Math.min(100, Math.max(0, (elapsed / rodada.tempo_limite) * 100));
  };

  return {
    timeRemaining,
    isActive,
    formatTime,
    getTimeColor,
    getProgressPercentage,
    formattedTime: formatTime(timeRemaining),
    timeColor: getTimeColor(),
    progressPercentage: getProgressPercentage()
  };
};
