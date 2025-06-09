
import { useState, useEffect } from 'react';
import { verificarSeExcedeuLimiteRodadas, salvarLimiteRodadas } from '@/utils/rodadaConfig';

export const useControleRodadas = () => {
  const [limiteRodadas, setLimiteRodadas] = useState(5);
  const [rodadasFinalizadas, setRodadasFinalizadas] = useState(0);
  const [limiteExcedido, setLimiteExcedido] = useState(false);
  const [loading, setLoading] = useState(false);
  const [configuracoesBloqueadas, setConfiguracoesBloqueadas] = useState(false);

  const verificarLimite = async () => {
    try {
      setLoading(true);
      const resultado = await verificarSeExcedeuLimiteRodadas();
      // Se o limite for 0, não aplicar restrições
      if (resultado.limite === 0) {
        setLimiteExcedido(false);
        setConfiguracoesBloqueadas(false);
      } else {
        setLimiteExcedido(resultado.excedeu);
        // Bloquear configurações se já existem rodadas no sistema
        setConfiguracoesBloqueadas(resultado.totalRodadas > 0 || resultado.excedeu);
      }
      setRodadasFinalizadas(resultado.totalRodadas);
      setLimiteRodadas(resultado.limite);
      return resultado;
    } catch (error) {
      console.error('Erro ao verificar limite:', error);
      return { excedeu: false, totalRodadas: 0, limite: 5 };
    } finally {
      setLoading(false);
    }
  };

  const atualizarLimiteRodadas = async (novoLimite: number) => {
    try {
      await salvarLimiteRodadas(novoLimite);
      setLimiteRodadas(novoLimite);
      await verificarLimite();
    } catch (error) {
      console.error('Erro ao atualizar limite:', error);
      throw error;
    }
  };

  const podeIniciarNovaRodada = () => {
    // Se o limite for 0, sempre permitir
    if (limiteRodadas === 0) {
      return true;
    }
    return !limiteExcedido;
  };

  const podeAlterarConfiguracoes = () => {
    // Permitir alterações apenas se não há rodadas no sistema
    return !configuracoesBloqueadas;
  };

  const getMensagemLimite = () => {
    // Se o limite for 0, não mostrar mensagem de limite
    if (limiteRodadas === 0) {
      return `Rodadas ilimitadas (configure um limite maior que 0)`;
    }
    
    if (limiteExcedido) {
      return `🏁 Todas as ${limiteRodadas} rodadas foram finalizadas! Para continuar, você precisa resetar o jogo.`;
    }
    return `Rodadas restantes: ${Math.max(0, limiteRodadas - rodadasFinalizadas)}/${limiteRodadas}`;
  };

  const getMensagemConfiguracoesBloqueadas = () => {
    if (!configuracoesBloqueadas) return '';
    
    if (limiteExcedido) {
      return '🔒 Configurações bloqueadas - Todas as rodadas foram finalizadas. Reset o jogo para alterar.';
    }
    
    return `🔒 Configurações bloqueadas - ${rodadasFinalizadas} de ${limiteRodadas} rodadas em andamento. Complete todas as rodadas ou reset o jogo para alterar.`;
  };

  useEffect(() => {
    verificarLimite();
  }, []);

  // Escutar eventos globais de mudanças em rodadas
  useEffect(() => {
    const handleRodadaEvent = () => {
      setTimeout(() => {
        verificarLimite();
      }, 500);
    };

    window.addEventListener('rodada-finalizada', handleRodadaEvent as EventListener);
    window.addEventListener('global-data-changed', handleRodadaEvent as EventListener);

    return () => {
      window.removeEventListener('rodada-finalizada', handleRodadaEvent as EventListener);
      window.removeEventListener('global-data-changed', handleRodadaEvent as EventListener);
    };
  }, []);

  return {
    limiteRodadas,
    rodadasFinalizadas,
    limiteExcedido,
    loading,
    configuracoesBloqueadas,
    verificarLimite,
    atualizarLimiteRodadas,
    podeIniciarNovaRodada,
    podeAlterarConfiguracoes,
    getMensagemLimite,
    getMensagemConfiguracoesBloqueadas
  };
};
