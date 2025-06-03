
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseGlobalRefreshOptions {
  enabled?: boolean;
  interval?: number;
  silent?: boolean;
}

export const useGlobalRefresh = (options: UseGlobalRefreshOptions = {}) => {
  const {
    enabled = true,
    interval = 1000, // 1 segundo
    silent = true
  } = options;

  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const performRefresh = () => {
      const now = Date.now();
      
      // Evitar refresh muito frequente
      if (now - lastRefreshRef.current < interval) {
        return;
      }

      try {
        // Invalidar queries específicas para atualização em tempo real
        queryClient.invalidateQueries({
          queryKey: ['pizzas'],
          exact: false
        });
        
        queryClient.invalidateQueries({
          queryKey: ['compras'],
          exact: false
        });
        
        queryClient.invalidateQueries({
          queryKey: ['equipes'],
          exact: false
        });
        
        queryClient.invalidateQueries({
          queryKey: ['rodadas'],
          exact: false
        });
        
        queryClient.invalidateQueries({
          queryKey: ['produtos'],
          exact: false
        });
        
        queryClient.invalidateQueries({
          queryKey: ['sabores'],
          exact: false
        });

        lastRefreshRef.current = now;

        if (!silent) {
          console.log('🔄 Global refresh executado', new Date().toLocaleTimeString());
        }
      } catch (error) {
        if (!silent) {
          console.error('Erro no global refresh:', error);
        }
      }
    };

    // Executar refresh inicial após um pequeno delay
    const initialTimeout = setTimeout(() => {
      performRefresh();
      
      // Configurar interval contínuo
      intervalRef.current = setInterval(performRefresh, interval);
    }, 100);

    return () => {
      if (initialTimeout) clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, silent, queryClient]);

  // Escutar eventos de visibilidade para pausar/retomar
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Retomar refresh quando a página volta ao foco
        if (!intervalRef.current) {
          intervalRef.current = setInterval(() => {
            const now = Date.now();
            if (now - lastRefreshRef.current >= interval) {
              queryClient.invalidateQueries();
              lastRefreshRef.current = now;
            }
          }, interval);
        }
      } else {
        // Pausar refresh quando a página sai de foco
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, interval, queryClient]);

  const forceRefresh = () => {
    queryClient.invalidateQueries();
    lastRefreshRef.current = Date.now();
  };

  return {
    forceRefresh,
    isEnabled: enabled,
    lastRefresh: lastRefreshRef.current
  };
};
