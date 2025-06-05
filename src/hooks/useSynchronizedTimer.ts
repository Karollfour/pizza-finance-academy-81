
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
  const [pausedTime, setPausedTime] = useState<number | null>(null);

  const { 
    onTimeUp, 
    onWarning, 
    warningThreshold = 30 
  } = options;

  // Calcular tempo restante com suporte a pausa
  const calculateTimeRemaining = useCallback(() => {
    if (!rodada || !rodada.tempo_limite) {
      return 0;
    }

    // Se a rodada está pausada, retornar o tempo que estava quando pausou
    if (rodada.status === 'pausada' && pausedTime !== null) {
      return pausedTime;
    }

    // Se não está ativa, retornar tempo total
    if (rodada.status !== 'ativa' || !rodada.iniciou_em) {
      return rodada.tempo_limite;
    }

    try {
      const now = new Date().getTime();
      const startTime = new Date(rodada.iniciou_em).getTime();
      const duration = rodada.tempo_limite * 1000;
      const elapsed = now - startTime;
      const remaining = Math.max(0, duration - elapsed);
      
      return Math.floor(remaining / 1000);
    } catch (error) {
      console.error('Erro ao calcular tempo restante:', error);
      return 0;
    }
  }, [rodada?.id, rodada?.status, rodada?.iniciou_em, rodada?.tempo_limite, pausedTime]);

  // Gerenciar estado da pausa
  useEffect(() => {
    if (!rodada) {
      setPausedTime(null);
      return;
    }

    if (rodada.status === 'pausada' && pausedTime === null) {
      // Rodada foi pausada agora - salvar o tempo atual
      const currentTime = calculateTimeRemaining();
      setPausedTime(currentTime);
      console.log('Rodada pausada, tempo salvo:', currentTime);
    } else if (rodada.status === 'ativa' && pausedTime !== null) {
      // Rodada foi retomada - limpar tempo pausado
      setPausedTime(null);
      console.log('Rodada retomada, tempo pausado limpo');
    } else if (rodada.status === 'finalizada' || rodada.status === 'aguardando') {
      // Rodada finalizada ou aguardando - limpar estado
      setPausedTime(null);
    }
  }, [rodada?.status, rodada?.id]);

  // Timer principal
  useEffect(() => {
    if (!rodada) {
      setTimeRemaining(0);
      setIsActive(false);
      setHasWarned(false);
      return;
    }

    // Se está pausada, usar o tempo pausado
    if (rodada.status === 'pausada') {
      setIsActive(false);
      const currentTime = pausedTime !== null ? pausedTime : calculateTimeRemaining();
      setTimeRemaining(currentTime);
      return;
    }

    // Se não está ativa, mostrar tempo total ou zero
    if (rodada.status !== 'ativa' || !rodada.iniciou_em) {
      setTimeRemaining(rodada.status === 'aguardando' ? rodada.tempo_limite : 0);
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

    // Timer com interval
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
  }, [rodada?.id, rodada?.status, rodada?.tempo_limite, rodada?.iniciou_em, calculateTimeRemaining, onTimeUp, onWarning, warningThreshold, hasWarned, pausedTime]);

  // Escutar eventos globais de rodada
  useEffect(() => {
    const handleRodadaEvent = (event: CustomEvent) => {
      console.log('Timer recebeu evento de rodada:', event.type);
      
      if (event.type === 'rodada-pausada') {
        // Salvar tempo atual quando pausar
        const currentTime = calculateTimeRemaining();
        setPausedTime(currentTime);
        console.log('Evento pausa - tempo salvo:', currentTime);
      } else if (event.type === 'rodada-iniciada') {
        // Limpar tempo pausado quando iniciar/retomar
        setPausedTime(null);
        console.log('Evento início - tempo pausado limpo');
      }
      
      // Recalcular tempo
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      
      // Resetar warning se necessário
      if (remaining > warningThreshold) {
        setHasWarned(false);
      }
    };

    window.addEventListener('rodada-iniciada', handleRodadaEvent as EventListener);
    window.addEventListener('rodada-finalizada', handleRodadaEvent as EventListener);
    window.addEventListener('rodada-pausada', handleRodadaEvent as EventListener);
    window.addEventListener('rodada-updated', handleRodadaEvent as EventListener);
    window.addEventListener('rodada-tempo-alterado', handleRodadaEvent as EventListener);

    return () => {
      window.removeEventListener('rodada-iniciada', handleRodadaEvent as EventListener);
      window.removeEventListener('rodada-finalizada', handleRodadaEvent as EventListener);
      window.removeEventListener('rodada-pausada', handleRodadaEvent as EventListener);
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
    const validSeconds = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(validSeconds / 60);
    const secs = validSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (rodada?.status === 'pausada') return 'text-orange-600';
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
    isActive: isActive && rodada?.status === 'ativa',
    isPaused: rodada?.status === 'pausada',
    pausedTime,
    formatTime,
    getTimeColor,
    getProgressPercentage,
    formattedTime: formatTime(timeRemaining),
    timeColor: getTimeColor(),
    progressPercentage: getProgressPercentage()
  };
};
