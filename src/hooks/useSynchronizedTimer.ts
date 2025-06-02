
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
  const [serverTimeOffset, setServerTimeOffset] = useState(0);

  const { 
    onTimeUp, 
    onWarning, 
    warningThreshold = 30 
  } = options;

  // Calcular offset do servidor para sincronização precisa
  const calculateServerTimeOffset = useCallback(async () => {
    try {
      const clientTime = Date.now();
      // Simular ping para estimar latência (em produção, você faria uma requisição real)
      const serverTime = clientTime; // Em produção, buscar tempo do servidor
      setServerTimeOffset(serverTime - clientTime);
    } catch (error) {
      console.warn('Erro ao calcular offset do servidor:', error);
      setServerTimeOffset(0);
    }
  }, []);

  // Calcular tempo restante sincronizado
  const calculateTimeRemaining = useCallback(() => {
    if (!rodada || rodada.status !== 'ativa' || !rodada.iniciou_em) {
      return 0;
    }

    const now = Date.now() + serverTimeOffset;
    const startTime = new Date(rodada.iniciou_em).getTime();
    const duration = rodada.tempo_limite * 1000;
    const elapsed = now - startTime;
    const remaining = Math.max(0, duration - elapsed);
    
    return Math.ceil(remaining / 1000);
  }, [rodada, serverTimeOffset]);

  // Timer principal com correção automática
  useEffect(() => {
    if (!rodada || rodada.status !== 'ativa' || !rodada.iniciou_em) {
      setTimeRemaining(0);
      setIsActive(false);
      setHasWarned(false);
      return;
    }

    setIsActive(true);
    setHasWarned(false);
    
    // Atualizar imediatamente
    const remaining = calculateTimeRemaining();
    setTimeRemaining(remaining);

    // Configurar intervalo com correção automática a cada segundo
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      // Warning threshold
      if (!hasWarned && remaining <= warningThreshold && remaining > 0) {
        setHasWarned(true);
        onWarning?.(remaining);
      }

      // Time up
      if (remaining <= 0) {
        setIsActive(false);
        onTimeUp?.();
        clearInterval(interval);
      }
    }, 1000);

    // Correção de drift a cada 30 segundos
    const driftCorrection = setInterval(() => {
      calculateServerTimeOffset();
    }, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(driftCorrection);
    };
  }, [rodada, calculateTimeRemaining, onTimeUp, onWarning, warningThreshold, hasWarned]);

  // Sincronização quando a página volta ao foco
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        calculateServerTimeOffset();
        const remaining = calculateTimeRemaining();
        setTimeRemaining(remaining);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, calculateTimeRemaining]);

  // Inicializar offset do servidor
  useEffect(() => {
    calculateServerTimeOffset();
  }, [calculateServerTimeOffset]);

  // Escutar eventos globais de rodada para sincronização instantânea
  useEffect(() => {
    const handleRodadaEvent = () => {
      // Recalcular imediatamente quando houver mudança de rodada
      setTimeout(() => {
        const remaining = calculateTimeRemaining();
        setTimeRemaining(remaining);
      }, 100);
    };

    window.addEventListener('rodada-iniciada', handleRodadaEvent);
    window.addEventListener('rodada-finalizada', handleRodadaEvent);
    window.addEventListener('rodada-updated', handleRodadaEvent);

    return () => {
      window.removeEventListener('rodada-iniciada', handleRodadaEvent);
      window.removeEventListener('rodada-finalizada', handleRodadaEvent);
      window.removeEventListener('rodada-updated', handleRodadaEvent);
    };
  }, [calculateTimeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
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
