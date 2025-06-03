
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
  const deviceIdRef = useRef<string>('');

  // Gerar ID único para este dispositivo/aba
  useEffect(() => {
    deviceIdRef.current = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Função para executar refresh
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

      // Sincronizar com outros dispositivos via localStorage
      const syncData = {
        timestamp: now,
        deviceId: deviceIdRef.current,
        action: 'refresh_triggered'
      };
      
      localStorage.setItem('global_refresh_sync', JSON.stringify(syncData));

      if (!silent) {
        console.log('🔄 Global refresh executado', new Date().toLocaleTimeString());
      }
    } catch (error) {
      if (!silent) {
        console.error('Erro no global refresh:', error);
      }
    }
  };

  // Escutar mudanças no localStorage para sincronizar entre abas/dispositivos
  useEffect(() => {
    if (!enabled) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'global_refresh_sync' && event.newValue) {
        try {
          const syncData = JSON.parse(event.newValue);
          
          // Só processar se veio de outro dispositivo
          if (syncData.deviceId !== deviceIdRef.current) {
            const timeDiff = Date.now() - syncData.timestamp;
            
            // Só processar se o evento é recente (menos de 2 segundos)
            if (timeDiff < 2000) {
              performRefresh();
            }
          }
        } catch (error) {
          console.error('Erro ao processar sincronização:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [enabled, deviceIdRef.current]);

  // Sistema principal de refresh com interval
  useEffect(() => {
    if (!enabled) return;

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
              performRefresh();
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

  // Função para forçar refresh manual
  const forceRefresh = () => {
    performRefresh();
    
    // Disparar evento customizado para outros componentes
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('force-global-refresh', {
        detail: {
          timestamp: Date.now(),
          deviceId: deviceIdRef.current
        }
      }));
    }
  };

  return {
    forceRefresh,
    isEnabled: enabled,
    lastRefresh: lastRefreshRef.current,
    deviceId: deviceIdRef.current
  };
};
