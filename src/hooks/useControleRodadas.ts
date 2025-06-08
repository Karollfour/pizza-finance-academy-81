
import { useState, useEffect } from 'react';
import { verificarSeExcedeuLimiteRodadas, salvarLimiteRodadas } from '@/utils/rodadaConfig';

export const useControleRodadas = () => {
  const [limiteRodadas, setLimiteRodadas] = useState(5);
  const [rodadasFinalizadas, setRodadasFinalizadas] = useState(0);
  const [limiteExcedido, setLimiteExcedido] = useState(false);
  const [loading, setLoading] = useState(false);

  const verificarLimite = async () => {
    try {
      setLoading(true);
      const resultado = await verificarSeExcedeuLimiteRodadas();
      setLimiteExcedido(resultado.excedeu);
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
    return !limiteExcedido;
  };

  const getMensagemLimite = () => {
    if (limiteExcedido) {
      return `🏁 Todas as ${limiteRodadas} rodadas foram finalizadas! Para continuar, você precisa resetar o jogo.`;
    }
    return `Rodadas restantes: ${Math.max(0, limiteRodadas - rodadasFinalizadas)}/${limiteRodadas}`;
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
    verificarLimite,
    atualizarLimiteRodadas,
    podeIniciarNovaRodada,
    getMensagemLimite
  };
};
